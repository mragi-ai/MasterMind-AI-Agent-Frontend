import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAppStore from "@/zustand";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { cn } from "@/lib/utils";

const WEBSOCKET_URL = "ws://192.168.3.199:3000/media-stream";

export default function DemoCall() {
  const navigate = useNavigate();
  const selectedRole = useAppStore((state) => state.selectedRole);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const phoneNumber = "+14073070855";

  // WebSocket and Media Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const isSpeakerOnRef = useRef<boolean>(true);
  const isMutedRef = useRef<boolean>(false);

  // If no role is selected, redirect to demo roles page
  useEffect(() => {
    if (!selectedRole) {
      navigate("/demo-roles");
    }
  }, [selectedRole, navigate]);

  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isCallActive) {
        cleanup();
      }
    };
  }, [isCallActive]);

  // Helper function to convert Float32Array to PCM16
  const float32ToPCM16 = (float32Array: Float32Array): Int16Array => {
    const pcm16 = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      // Clamp values to [-1, 1] and convert to 16-bit PCM
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return pcm16;
  };

  // Helper function to resample audio
  const resampleAudio = (
    audioData: Float32Array,
    sourceSampleRate: number,
    targetSampleRate: number
  ): Float32Array => {
    if (sourceSampleRate === targetSampleRate) {
      return audioData;
    }

    const ratio = sourceSampleRate / targetSampleRate;
    const newLength = Math.round(audioData.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const sourceIndex = i * ratio;
      const index = Math.floor(sourceIndex);
      const fraction = sourceIndex - index;

      if (index + 1 < audioData.length) {
        // Linear interpolation
        result[i] =
          audioData[index] * (1 - fraction) + audioData[index + 1] * fraction;
      } else {
        result[i] = audioData[index];
      }
    }

    return result;
  };

  // Helper function to convert audio to base64 PCM16
  const audioToBase64PCM16 = (
    audioData: Float32Array,
    sampleRate: number
  ): string => {
    // Resample to 24kHz if needed
    const resampled = resampleAudio(audioData, sampleRate, 24000);

    // Convert to PCM16
    const pcm16 = float32ToPCM16(resampled);

    // Convert to base64
    const bytes = new Uint8Array(pcm16.buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Initialize audio context and WebSocket connection
  const initializeAudioContext = async () => {
    try {
      // Create AudioContext for playback (using 24kHz to match server expectations)
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });

      // Create audio element for playback
      if (!audioElementRef.current) {
        audioElementRef.current = new Audio();
        audioElementRef.current.autoplay = true;
      }

      // Get user media (microphone)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1, // Mono audio
          sampleRate: 24000, // Request 24kHz sample rate
        },
      });

      mediaStreamRef.current = stream;

      // Create source node for microphone input
      if (audioContextRef.current) {
        sourceNodeRef.current =
          audioContextRef.current.createMediaStreamSource(stream);
        gainNodeRef.current = audioContextRef.current.createGain();

        // Create ScriptProcessorNode for processing audio data
        const bufferSize = 4096; // Process in chunks
        processorNodeRef.current =
          audioContextRef.current.createScriptProcessor(bufferSize, 1, 1);

        // Process audio data
        processorNodeRef.current.onaudioprocess = (event) => {
          if (
            wsRef.current?.readyState === WebSocket.OPEN &&
            gainNodeRef.current
          ) {
            // Check mute state
            const isCurrentlyMuted = gainNodeRef.current.gain.value === 0;
            if (!isCurrentlyMuted) {
              const inputData = event.inputBuffer.getChannelData(0);
              const sampleRate = event.inputBuffer.sampleRate;

              // Convert to base64 PCM16
              const base64Audio = audioToBase64PCM16(inputData, sampleRate);

              // Send audio event to server
              const audioEvent = {
                type: "input_audio_buffer.append",
                audio: base64Audio,
              };

              wsRef.current.send(JSON.stringify(audioEvent));
            }
          }
        };

        // Connect nodes
        sourceNodeRef.current.connect(gainNodeRef.current);
        gainNodeRef.current.connect(processorNodeRef.current);
        processorNodeRef.current.connect(audioContextRef.current.destination);

        // Control mute state
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = isMuted ? 0 : 1;
        }
      }

      return true;
    } catch (error) {
      console.error("Error initializing audio:", error);
      setConnectionStatus("error");
      return false;
    }
  };

  const initializeWebSocket = () => {
    return new Promise<boolean>((resolve) => {
      try {
        setConnectionStatus("connecting");
        const ws = new WebSocket(WEBSOCKET_URL);

        ws.onopen = () => {
          console.log("WebSocket connected");
          setConnectionStatus("connected");
          wsRef.current = ws;
          resolve(true);
        };

        ws.onmessage = async (event) => {
          try {
            if (typeof event.data === "string") {
              // Handle text/JSON messages
              try {
                const message = JSON.parse(event.data);
                console.log("WebSocket message:", message);

                // Handle different event types
                if (message.type === "session.created") {
                  console.log("Session created successfully");
                } else if (message.type === "session.updated") {
                  console.log("Session updated");
                } else if (message.type === "response.audio.delta") {
                  // Handle audio delta from server
                  if (message.delta && audioContextRef.current) {
                    const base64Audio = message.delta;
                    const binaryString = atob(base64Audio);
                    const bytes = new Uint8Array(binaryString.length);
                    for (let i = 0; i < binaryString.length; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }

                    // Convert PCM16 to audio buffer
                    const pcm16 = new Int16Array(bytes.buffer);
                    const float32 = new Float32Array(pcm16.length);
                    for (let i = 0; i < pcm16.length; i++) {
                      float32[i] =
                        pcm16[i] < 0 ? pcm16[i] / 0x8000 : pcm16[i] / 0x7fff;
                    }

                    // Create audio buffer and play
                    const audioBuffer =
                      audioContextRef.current.createBuffer(1, float32.length, 24000);
                    audioBuffer.getChannelData(0).set(float32);

                    const source = audioContextRef.current.createBufferSource();
                    source.buffer = audioBuffer;

                    const gainNode = audioContextRef.current.createGain();
                    gainNode.gain.value = isSpeakerOnRef.current ? 1 : 0;

                    source.connect(gainNode);
                    gainNode.connect(audioContextRef.current.destination);
                    source.start();
                  }
                } else if (message.type === "response.audio") {
                  // Handle complete audio response
                  if (message.audio) {
                    playBase64Audio(message.audio);
                  }
                } else if (message.type === "error") {
                  console.error("Server error:", message.error || message.raw);
                }
              } catch (parseError) {
                console.log("WebSocket text message:", event.data);
              }
            } else if (event.data instanceof Blob) {
              // Handle binary blob data
              const arrayBuffer = await event.data.arrayBuffer();
              playPCM16Audio(arrayBuffer);
            } else if (event.data instanceof ArrayBuffer) {
              // Handle ArrayBuffer audio data
              playPCM16Audio(event.data);
            }
          } catch (error) {
            console.error("Error handling WebSocket message:", error);
          }
        };

        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setConnectionStatus("error");
          resolve(false);
        };

        ws.onclose = (event) => {
          console.log("WebSocket closed:", event.code, event.reason);
          setConnectionStatus("disconnected");
          wsRef.current = null;

          // Attempt to reconnect if call is still active
          if (isCallActive && event.code !== 1000) {
            setTimeout(() => {
              if (isCallActive) {
                initializeWebSocket();
              }
            }, 3000);
          }
        };
      } catch (error) {
        console.error("Error creating WebSocket:", error);
        setConnectionStatus("error");
        resolve(false);
      }
    });
  };

  const playBase64Audio = async (base64Audio: string) => {
    try {
      if (!audioContextRef.current) return;

      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Convert PCM16 to Float32
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] < 0 ? pcm16[i] / 0x8000 : pcm16[i] / 0x7fff;
      }

      // Create and play audio buffer
      const audioBuffer = audioContextRef.current.createBuffer(
        1,
        float32.length,
        24000
      );
      audioBuffer.getChannelData(0).set(float32);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = isSpeakerOnRef.current ? 1 : 0;

      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      source.start();
    } catch (error) {
      console.error("Error playing base64 audio:", error);
    }
  };

  const playPCM16Audio = async (arrayBuffer: ArrayBuffer) => {
    try {
      if (!audioContextRef.current) return;

      const pcm16 = new Int16Array(arrayBuffer);
      const float32 = new Float32Array(pcm16.length);

      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] < 0 ? pcm16[i] / 0x8000 : pcm16[i] / 0x7fff;
      }

      const audioBuffer = audioContextRef.current.createBuffer(
        1,
        float32.length,
        24000
      );
      audioBuffer.getChannelData(0).set(float32);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;

      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = isSpeakerOnRef.current ? 1 : 0;

      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      source.start();
    } catch (error) {
      console.error("Error playing PCM16 audio:", error);
    }
  };

  const cleanup = () => {
    // Disconnect processor node
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current.onaudioprocess = null;
      processorNodeRef.current = null;
    }

    // Stop media stream tracks
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }

    // Close WebSocket
    if (wsRef.current) {
      wsRef.current.close(1000, "Call ended");
      wsRef.current = null;
    }

    // Clean up audio nodes
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }

    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }

    // Clean up audio element
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.src = "";
      audioElementRef.current = null;
    }

    // Clear audio chunks
    audioChunksRef.current = [];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartCall = async () => {
    try {
      setIsCallActive(true);
      setCallDuration(0);

      // Initialize audio context and get microphone access
      const audioInitialized = await initializeAudioContext();
      if (!audioInitialized) {
        setIsCallActive(false);
        alert("Failed to access microphone. Please check permissions.");
        return;
      }

      // Initialize WebSocket connection
      const wsInitialized = await initializeWebSocket();
      if (!wsInitialized) {
        setIsCallActive(false);
        cleanup();
        alert("Failed to connect to voice server. Please try again.");
        return;
      }
    } catch (error) {
      console.error("Error starting call:", error);
      setIsCallActive(false);
      cleanup();
      alert("Failed to start call. Please try again.");
    }
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setCallDuration(0);
    setConnectionStatus("disconnected");
    cleanup();
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    isMutedRef.current = newMutedState;

    // Update gain node to control microphone input
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = newMutedState ? 0 : 1;
    }

    // Stop sending data if muted
    if (newMutedState && mediaRecorderRef.current) {
      // MediaRecorder will continue recording but we won't send data
      // The ondataavailable handler checks mute state via gain node
    }
  };

  const toggleSpeaker = () => {
    const newSpeakerState = !isSpeakerOn;
    setIsSpeakerOn(newSpeakerState);
    isSpeakerOnRef.current = newSpeakerState;

    // Update audio element volume
    if (audioElementRef.current) {
      audioElementRef.current.volume = newSpeakerState ? 1 : 0;
      // Also update muted property for better browser compatibility
      audioElementRef.current.muted = !newSpeakerState;
    }
  };

  if (!selectedRole) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute top-1/4 right-1/4 w-64 h-64 bg-accent/8 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "-2s" }}
        />
        <div
          className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "-3s" }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/demo-roles")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Roles
              </Button>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-muted-foreground">Demo Mode</span>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-accent/30 bg-accent/5 px-4 py-2">
              <Phone className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent-foreground">
                {selectedRole.title}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          {/* Call Interface */}
          <div className="w-full max-w-md space-y-8">
            {/* Avatar/Profile Section */}
            <div className="flex flex-col items-center space-y-4">
              <div
                className={cn(
                  "relative h-32 w-32 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-2xl transition-all duration-300",
                  isCallActive
                    ? "bg-gradient-to-br from-accent to-accent/80 ring-4 ring-accent/30 animate-pulse"
                    : "bg-gradient-to-br from-primary to-primary/80 ring-4 ring-primary/30"
                )}
              >
                {selectedRole.title.charAt(0)}
                {isCallActive && (
                  <div className="absolute inset-0 rounded-full bg-accent/20 animate-ping" />
                )}
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold">{selectedRole.title}</h2>
                <p className="text-muted-foreground">
                  {selectedRole.description}
                </p>
                {isCallActive && (
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {formatTime(callDuration)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Call Status */}
            {!isCallActive && (
              <div className="text-center space-y-4">
                <div className="rounded-2xl border border-accent/30 bg-accent/5 p-6">
                  <Phone className="h-12 w-12 mx-auto mb-4 text-accent" />
                  <h3 className="text-lg font-semibold mb-2">Ready to Call</h3>
                  <p className="text-sm text-muted-foreground">
                    Click the call button below to start a voice conversation
                    with the AI training assistant.
                  </p>
                </div>
              </div>
            )}

            {isCallActive && (
              <div className="text-center space-y-4">
                <div
                  className={cn(
                    "rounded-2xl border p-6",
                    connectionStatus === "connected"
                      ? "border-green-500/30 bg-green-500/5"
                      : connectionStatus === "connecting"
                      ? "border-yellow-500/30 bg-yellow-500/5"
                      : "border-red-500/30 bg-red-500/5"
                  )}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div
                      className={cn(
                        "h-3 w-3 rounded-full animate-pulse",
                        connectionStatus === "connected"
                          ? "bg-green-500"
                          : connectionStatus === "connecting"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      )}
                    />
                    <span
                      className={cn(
                        "text-sm font-medium",
                        connectionStatus === "connected"
                          ? "text-green-600 dark:text-green-400"
                          : connectionStatus === "connecting"
                          ? "text-yellow-600 dark:text-yellow-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {connectionStatus === "connected"
                        ? "Call in progress"
                        : connectionStatus === "connecting"
                        ? "Connecting..."
                        : "Connection error"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {connectionStatus === "connected"
                      ? "You're connected to the AI training assistant"
                      : connectionStatus === "connecting"
                      ? "Establishing connection..."
                      : "Failed to connect. Please try again."}
                  </p>
                </div>
              </div>
            )}

            {/* Call Controls */}
            <div className="flex flex-col gap-4">
              {!isCallActive ? (
                <Button
                  size="lg"
                  onClick={handleStartCall}
                  className="h-16 rounded-2xl bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent/80 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Phone className="h-6 w-6 mr-3" />
                  Start Call
                </Button>
              ) : (
                <div className="space-y-4">
                  {/* Control Buttons */}
                  <div className="flex items-center justify-center gap-4">
                    <Button
                      size="lg"
                      variant={isMuted ? "destructive" : "outline"}
                      onClick={toggleMute}
                      className="h-14 w-14 rounded-full"
                    >
                      {isMuted ? (
                        <MicOff className="h-5 w-5" />
                      ) : (
                        <Mic className="h-5 w-5" />
                      )}
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={handleEndCall}
                      className="h-16 w-16 rounded-full shadow-lg hover:shadow-xl"
                    >
                      <PhoneOff className="h-6 w-6" />
                    </Button>
                    <Button
                      size="lg"
                      variant={isSpeakerOn ? "default" : "outline"}
                      onClick={toggleSpeaker}
                      className="h-14 w-14 rounded-full"
                    >
                      {isSpeakerOn ? (
                        <Volume2 className="h-5 w-5" />
                      ) : (
                        <VolumeX className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      {isMuted ? "Microphone muted" : "Microphone active"} •{" "}
                      {isSpeakerOn ? "Speaker on" : "Speaker off"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Info Cards */}
            <div className="grid gap-4 md:grid-cols-3 pt-8">
              <div className="rounded-xl border border-border/60 bg-background/80 p-4 backdrop-blur text-center">
                <Phone className="h-6 w-6 mx-auto mb-2 text-accent" />
                <p className="text-xs font-medium mb-1">Voice Training</p>
                <p className="text-xs text-muted-foreground">
                  Practice real conversations
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/80 p-4 backdrop-blur text-center">
                <Mic className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-xs font-medium mb-1">Live Feedback</p>
                <p className="text-xs text-muted-foreground">
                  Get instant coaching tips
                </p>
              </div>
              <div className="rounded-xl border border-border/60 bg-background/80 p-4 backdrop-blur text-center">
                <Volume2 className="h-6 w-6 mx-auto mb-2 text-accent" />
                <p className="text-xs font-medium mb-1">24/7 Available</p>
                <p className="text-xs text-muted-foreground">
                  Call anytime to practice
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
