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
  Truck,
  Headset,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

// WebSocket URL for OpenAI Realtime API bridge
// Using ngrok URL for WebSocket connection to Python backend
// const WEBSOCKET_URL = "wss://738002e1e676.ngrok-free.app/api/v1/client-stream";

const WEBSOCKET_URL = "ws://98.93.49.166/api/v1/client-stream";

// Available roles - kept in sync with HeroAITrainer.tsx
type Role = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: "primary" | "accent";
  role: string;
};

const roles: Role[] = [
  {
    id: "695b8d76566a1ea150da303d",
    title: "Carrier Representative",
    description: "Coordinate with carriers, oversee loads, and keep freight moving on schedule.",
    icon: Truck,
    color: "primary",
    role: "carrier_representative",
  },
  {
    id: "695b8cc6566a1ea150da303c",
    title: "Customer Representative",
    description: "Support shippers and receivers, deliver proactive updates, and resolve issues fast.",
    icon: Headset,
    color: "accent",
    role: "customer_representative",
  },
  {
    id: "695b8e04566a1ea150da303e",
    title: "Agent Manager",
    description: "Orchestrate agent performance, monitor KPIs, and deliver operational insights.",
    icon: ShieldCheck,
    color: "accent",
    role: "agent_manager",
  },
];

// Helper function to get the full role object from the local roles array
const getRoleById = (id: string | undefined): Role | null => {
  if (!id) return null;
  return roles.find(role => role.id === id) || null;
};

// Extend the Window interface to include ag2client
declare global {
  interface Window {
    ag2client?: {
      WebsocketAudio: new (url: string) => {
        start: () => Promise<void>;
        stop: () => void;
        ws?: WebSocket; // Internal WebSocket reference (if exposed)
        onmessage?: (event: MessageEvent) => void;
        onerror?: (event: Event) => void;
        onopen?: (event: Event) => void;
      };
    };
  }
}

export default function Call() {
  const navigate = useNavigate();
  const storedRole = useAppStore((state) => state.selectedRole);
  
  // Match stored role with local roles array to get complete role object
  const selectedRole = getRoleById(storedRole?.id) || (storedRole ? roles.find(r => r.title === storedRole.title) : null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected" | "error"
  >("disconnected");
  const [aiResponseText, setAiResponseText] = useState<string>("");

  // WebSocket and Audio Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioClientRef = useRef<any>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isProcessingAudioRef = useRef(false);
  const nextAudioStartTimeRef = useRef<number>(0);

  // If no role is selected, redirect to dashboard
  useEffect(() => {
    if (!storedRole) {
      navigate("/dashboard");
    }
  }, [storedRole, navigate]);

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
      // Cleanup WebSocket
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (error) {
          console.error("Error closing WebSocket on unmount:", error);
        }
      }

      // Cleanup AG2 client if used
      if (audioClientRef.current) {
        try {
          audioClientRef.current.stop();
        } catch (error) {
          console.error("Error stopping AG2 client on unmount:", error);
        }
      }

      // Cleanup media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }

      // Cleanup audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Process audio queue for playback (sequentially to avoid overlap)
  const processAudioQueue = async () => {
    if (isProcessingAudioRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 24000 });
      console.log('🎵 AudioContext created, state:', audioContextRef.current.state);
      nextAudioStartTimeRef.current = 0; // Reset start time when creating new context
    }

    const context = audioContextRef.current;

    // Resume audio context if suspended (required by some browsers)
    if (context.state === 'suspended') {
      console.log('🎵 Resuming suspended AudioContext...');
      await context.resume();
      console.log('🎵 AudioContext resumed, state:', context.state);
    }

    // If nextAudioStartTime is in the past, start from current time
    if (nextAudioStartTimeRef.current < context.currentTime) {
      nextAudioStartTimeRef.current = context.currentTime;
    }

    isProcessingAudioRef.current = true;
    const sampleRate = 24000; // OpenAI Realtime API uses 24kHz

    while (audioQueueRef.current.length > 0) {
      const audioBuffer = audioQueueRef.current.shift();
      if (!audioBuffer) continue;

      try {
        // Convert PCM16 (Int16Array) to Float32Array for Web Audio API
        const pcm16Data = new Int16Array(audioBuffer);
        const float32Data = new Float32Array(pcm16Data.length);

        // Convert Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
        for (let i = 0; i < pcm16Data.length; i++) {
          float32Data[i] = Math.max(-1, Math.min(1, pcm16Data[i] / 32768.0));
        }

        // Create AudioBuffer from PCM16 data
        const audioBufferNode = context.createBuffer(1, float32Data.length, sampleRate);
        audioBufferNode.getChannelData(0).set(float32Data);

        // Schedule audio to play at the next available time (sequential playback)
        const startTime = nextAudioStartTimeRef.current;
        const duration = audioBufferNode.duration;

        const source = context.createBufferSource();
        source.buffer = audioBufferNode;
        source.connect(context.destination);
        source.start(startTime);

        // Update next start time to be right after this chunk finishes
        nextAudioStartTimeRef.current = startTime + duration;

        console.log('🔊 Scheduled audio chunk:', {
          samples: float32Data.length,
          duration: duration.toFixed(3) + 's',
          startTime: startTime.toFixed(3) + 's',
          nextStartTime: nextAudioStartTimeRef.current.toFixed(3) + 's',
          contextState: context.state
        });
      } catch (error) {
        console.error("❌ Error playing audio:", error);
      }
    }

    isProcessingAudioRef.current = false;
  };

  // Handle OpenAI Realtime API message format
  const handleWebSocketMessage = async (event: MessageEvent) => {
    // Handle binary audio data (raw PCM16 bytes from backend)
    // Can be ArrayBuffer or Blob
    let audioBuffer: ArrayBuffer | null = null;

    if (event.data instanceof ArrayBuffer) {
      audioBuffer = event.data;
    } else if (event.data instanceof Blob) {
      // Convert Blob to ArrayBuffer
      console.log("🎵 AI Agent Audio Response Received (Blob):", {
        type: 'audio',
        size: event.data.size,
        bytes: `${(event.data.size / 1024).toFixed(2)} KB`,
        timestamp: new Date().toISOString()
      });
      audioBuffer = await event.data.arrayBuffer();
    }

    if (audioBuffer) {
      console.log("🎵 AI Agent Audio Response Received:", {
        type: 'audio',
        size: audioBuffer.byteLength,
        bytes: `${(audioBuffer.byteLength / 1024).toFixed(2)} KB`,
        timestamp: new Date().toISOString()
      });

      // Add to audio queue for playback
      audioQueueRef.current.push(audioBuffer);
      await processAudioQueue();
      return; // Exit early after handling audio
    }
    // Handle text/JSON messages
    else if (typeof event.data === 'string') {
      try {
        const jsonData = JSON.parse(event.data);
        const messageType = jsonData.type;

        console.log(`📨 Received message type: ${messageType}`, jsonData);

        // Handle OpenAI Realtime API event types
        switch (messageType) {
          case 'response.output_text.delta':
          case 'response.text.delta':
            // Accumulate text deltas
            const textDelta = jsonData.delta || '';
            setAiResponseText(prev => prev + textDelta);
            console.log("💬 AI Text Response (delta):", textDelta);
            break;

          case 'response.output_text.done':
          case 'response.text.done':
            // Text response complete
            console.log("✅ AI Text Response Complete:", jsonData);
            break;

          case 'response.audio.delta':
            // Audio delta (base64 encoded) - backend should handle this, but just in case
            console.log("🎵 AI Audio Delta (base64):", {
              size: jsonData.delta?.length || 0
            });
            break;

          case 'response.audio.done':
            console.log("✅ AI Audio Response Complete");
            break;

          case 'clear_audio':
            // Clear audio buffer (interrupt signal)
            console.log("🛑 Clear Audio Signal Received");
            audioQueueRef.current = [];
            // Reset next start time so new audio starts immediately
            if (audioContextRef.current) {
              nextAudioStartTimeRef.current = audioContextRef.current.currentTime;
              // Stop all currently playing audio
              audioContextRef.current.suspend();
              audioContextRef.current.resume();
            } else {
              nextAudioStartTimeRef.current = 0;
            }
            break;

          case 'conversation.item.created':
            console.log("💬 Conversation item created:", jsonData);
            break;

          case 'response.created':
            // New response started - clear previous text
            setAiResponseText("");
            console.log("🆕 New AI Response Started");
            break;

          case 'input_audio_buffer.speech_started':
            console.log("🗣️ User speech detected");
            break;

          default:
            console.log("📦 Unknown message type:", messageType, jsonData);
        }
      } catch (e) {
        // Not JSON, log as raw text
        console.log("💬 AI Agent Text Response (raw):", event.data);
      }
    } else {
      console.log("📦 AI Agent Response (unknown type):", {
        type: typeof event.data,
        data: event.data
      });
    }
  };

  const handleStartCall = async () => {
    if (connectionStatus === 'connected') return;

    try {
      setConnectionStatus('connecting');
      setIsCallActive(true);
      setCallDuration(0);

      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error("getUserMedia not available");
        setConnectionStatus('error');
        setIsCallActive(false);
        alert("Microphone access requires HTTPS or localhost. Please use a secure connection.");
        return;
      }

      // Request microphone permission first
      try {
        console.log('Requesting microphone permission...');
        const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        testStream.getTracks().forEach(track => track.stop());
        console.log('✅ Microphone permission granted');
      } catch (mediaError: any) {
        console.error("Microphone permission error:", mediaError);
        setConnectionStatus('error');
        setIsCallActive(false);

        let errorMsg = '';
        if (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError') {
          errorMsg = "No microphone found.\n\nPlease:\n1. Connect a microphone to your device\n2. Check your system audio settings\n3. Ensure the microphone is enabled\n4. Try refreshing the page";
        } else if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
          errorMsg = "Microphone permission was denied.\n\nPlease:\n1. Click the microphone icon in your browser's address bar\n2. Allow microphone access\n3. Try again";
        } else if (mediaError.name === 'NotReadableError' || mediaError.name === 'TrackStartError') {
          errorMsg = "Microphone is already in use.\n\nPlease:\n1. Close other applications using the microphone\n2. Try again";
        } else {
          errorMsg = `Microphone error: ${mediaError.message || mediaError.name}\n\nPlease check your microphone settings and try again.`;
        }

        alert(errorMsg);
        return;
      }

      console.log('Initializing WebSocket connection...');
      console.log(`Connecting to ${WEBSOCKET_URL}...`);

      // Initialize AudioContext for playback
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContext({ sampleRate: 24000 });
        console.log('🎵 AudioContext initialized, initial state:', audioContextRef.current.state);
      }

      // Ensure audio context is running (required by some browsers)
      if (audioContextRef.current.state === 'suspended') {
        console.log('🎵 Resuming AudioContext...');
        await audioContextRef.current.resume();
        console.log('🎵 AudioContext state after resume:', audioContextRef.current.state);
      }

      // Get microphone stream for sending audio
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Bypass ngrok warning page by making HTTP request first
      // This establishes a session that allows WebSocket connections
      const baseUrl = "https://api.evanstrainer.com";
      const baseUrlWs = "api.evanstrainer.com";

      // const baseUrl = "https://738002e1e676.ngrok-free.app";
      // const baseUrlWs = "738002e1e676.ngrok-free.app";

      // First, make an HTTP request to establish ngrok session
      // This bypasses the warning page for subsequent WebSocket connections
      try {
        console.log('🔓 Establishing ngrok session...');
        const sessionResponse = await fetch(`${baseUrl}/api/v1/websocket`, {
          method: 'GET',
          headers: {
            'ngrok-skip-browser-warning': 'true'
          }
        });
        console.log('✅ ngrok session established, HTTP status:', sessionResponse.status);
      } catch (sessionError: any) {
        console.warn('⚠️ Could not establish ngrok session (will still try WebSocket):', sessionError.message);
      }

      // Try different WebSocket endpoints
      // Note: We already established ngrok session via /api/v1/websocket HTTP request above
      // Since HTTP endpoint is /api/v1/websocket, WebSocket is likely at /api/v1/client-stream
      const possibleEndpoints = [
        `wss://${baseUrlWs}/api/v1/client-stream`,
        `ws://${baseUrlWs}/api/v1/client-stream`,
        `wss://${baseUrlWs}/client-stream`,
        `ws://${baseUrlWs}/client-stream`,
      ];

      let connected = false;
      let lastError: Error | null = null;
      let ws: WebSocket | null = null;

      // Small delay to ensure ngrok session is established
      await new Promise(resolve => setTimeout(resolve, 200));

      for (const wsEndpoint of possibleEndpoints) {
        try {
          console.log(` Attempting WebSocket connection to: ${wsEndpoint}`);

          ws = new WebSocket(wsEndpoint);
          wsRef.current = ws;

          // Set up WebSocket event handlers
          ws.addEventListener('open', () => {
            console.log('✅ WebSocket Connected to:', wsEndpoint);

            // Start sending audio data from microphone
            const audioContext = new AudioContext({ sampleRate: 16000 });
            const source = audioContext.createMediaStreamSource(stream);
            const processor = audioContext.createScriptProcessor(4096, 1, 1);

            processor.onaudioprocess = (e) => {
              if (!isMuted && ws && ws.readyState === WebSocket.OPEN) {
                const inputData = e.inputBuffer.getChannelData(0);
                // Convert Float32Array to Int16Array (PCM16)
                const pcm16 = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                  const s = Math.max(-1, Math.min(1, inputData[i]));
                  pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }
                // Send raw audio bytes to backend
                ws.send(pcm16.buffer);
              }
            };

            source.connect(processor);
            processor.connect(audioContext.destination);
          });

          ws.addEventListener('message', handleWebSocketMessage);

          ws.addEventListener('error', (event: Event) => {
            console.error('❌ WebSocket Error Event:', event);
            console.error('WebSocket URL:', wsEndpoint);
            console.error('WebSocket readyState:', ws?.readyState);
            setConnectionStatus('error');
          });

          ws.addEventListener('close', (event: CloseEvent) => {
            console.log('🔌 WebSocket Closed:', {
              code: event.code,
              reason: event.reason || 'No reason provided',
              wasClean: event.wasClean,
              endpoint: wsEndpoint
            });

            // Code 1006 means abnormal closure - provide helpful diagnostics
            if (event.code === 1006) {
              console.error('❌ WebSocket closed abnormally (code 1006). Possible causes:');
              console.error('1. Server is not running');
              console.error('2. ngrok tunnel is not active or expired');
              console.error('3. Wrong endpoint path');
              console.error('4. CORS/authentication issue');
              console.error('5. Network/firewall blocking the connection');
            }

            // Only update status if this was the active connection
            if (ws === wsRef.current) {
              setConnectionStatus('disconnected');
              setIsCallActive(false);

              // Cleanup
              if (mediaStreamRef.current) {
                mediaStreamRef.current.getTracks().forEach(track => track.stop());
                mediaStreamRef.current = null;
              }
              if (audioContextRef.current) {
                audioContextRef.current.close();
                audioContextRef.current = null;
              }
            }
          });

          // Wait for connection to open with timeout
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              if (ws) {
                ws.close();
              }
              reject(new Error(`Connection timeout to ${wsEndpoint}`));
            }, 10000); // Increased timeout to 10 seconds

            ws.addEventListener('open', () => {
              clearTimeout(timeout);
              connected = true;
              resolve(undefined);
            });

            ws.addEventListener('error', (error) => {
              clearTimeout(timeout);
              reject(new Error(`WebSocket error: ${error}`));
            });

            ws.addEventListener('close', (event) => {
              if (!connected) {
                clearTimeout(timeout);
                reject(new Error(`WebSocket closed before connection: code ${event.code}`));
              }
            });
          });

          // If we get here, connection was successful
          console.log(`✅ Successfully connected to ${wsEndpoint}`);
          break;

        } catch (err: any) {
          console.warn(`❌ Failed to connect to ${wsEndpoint}:`, err.message);
          lastError = err;

          // Close the failed WebSocket
          if (ws) {
            try {
              ws.close();
            } catch (e) {
              // Ignore cleanup errors
            }
          }
          ws = null;

          // Continue to next endpoint
          continue;
        }
      }

      if (!connected || !ws) {
        throw lastError || new Error('Failed to connect to any WebSocket endpoint. Please ensure the Python backend server is running and the ngrok tunnel is active.');
      }

      // Set as connected
      setConnectionStatus('connected');
      setAiResponseText(""); // Clear previous responses
      console.log('✅ Connected & Live! Speak now.');
    } catch (error) {
      console.error("Error starting call:", error);
      setConnectionStatus('error');
      setIsCallActive(false);

      // Clean up WebSocket and media stream
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {
          // Ignore cleanup errors
        }
        wsRef.current = null;
      }

      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      if (audioContextRef.current) {
        try {
          audioContextRef.current.close();
        } catch (e) {
          // Ignore cleanup errors
        }
        audioContextRef.current = null;
      }

      // Clean up AG2 client if used
      if (audioClientRef.current) {
        try {
          audioClientRef.current.stop();
        } catch (e) {
          // Ignore cleanup errors
        }
        audioClientRef.current = null;
      }

      const errorMessage = (error as Error).message || 'Unknown error';

      // Provide helpful error messages
      if (errorMessage.includes('code 1006') || errorMessage.includes('1006')) {
        alert(
          `WebSocket connection failed (Code 1006 - Abnormal Closure)\n\n` +
          `This usually means the connection was refused or closed immediately.\n\n` +
          `Please check:\n` +
          `1. ✅ Is your Python backend server running?\n` +
          `2. ✅ Is the ngrok tunnel active? (Check: https://738002e1e676.ngrok-free.app/websocket)\n` +
          `3. ✅ Is the WebSocket endpoint correct? (/client-stream)\n` +
          `4. ✅ Check browser console for more details\n\n` +
          `Tried endpoints:\n` +
          `- wss://738002e1e676.ngrok-free.app/client-stream\n` +
          `- ws://738002e1e676.ngrok-free.app/client-stream\n` +
          `- wss://738002e1e676.ngrok-free.app/api/v1/client_stream\n` +
          `- ws://738002e1e676.ngrok-free.app/api/v1/client_stream\n\n` +
          `Quick test: Open https://738002e1e676.ngrok-free.app/websocket in your browser to verify the server is reachable.`
        );
      } else if (errorMessage.includes('WebSocket') || errorMessage.includes('connection failed')) {
        alert(
          `WebSocket connection failed\n\n` +
          `Possible issues:\n` +
          `1. The Python backend server is not running\n` +
          `2. The ngrok tunnel is not active or expired\n` +
          `3. The WebSocket endpoint path might be incorrect\n` +
          `4. The server doesn't support WebSocket connections\n\n` +
          `Error: ${errorMessage}\n\n` +
          `Try checking:\n` +
          `- Is the server running?\n` +
          `- Is the ngrok tunnel active?\n` +
          `- Does the endpoint exist on the server?\n` +
          `- Check browser console for detailed error messages`
        );
      } else if (errorMessage.includes('timeout')) {
        alert(
          `Connection timeout\n\n` +
          `The server is not responding. Please ensure:\n` +
          `1. The Python backend server is running\n` +
          `2. The server address is correct\n` +
          `3. The ngrok tunnel is active\n` +
          `4. Firewall allows the connection\n\n` +
          `Error: ${errorMessage}`
        );
      } else {
        alert(`Failed to start call: ${errorMessage}\n\nCheck the browser console for more details.`);
      }
    }
  };

  const handleEndCall = () => {
    if (connectionStatus === 'disconnected') return;

    try {
      console.log('Ending call...');

      // Close WebSocket
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      // Stop media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }

      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Stop AG2 client if used
      if (audioClientRef.current) {
        try {
          audioClientRef.current.stop();
        } catch (e) {
          // Ignore cleanup errors
        }
        audioClientRef.current = null;
      }

      // Clear audio queue and reset timing
      audioQueueRef.current = [];
      nextAudioStartTimeRef.current = 0;
      setAiResponseText("");

      setIsCallActive(false);
      setCallDuration(0);
      setConnectionStatus('disconnected');
      console.log('⛔ Call stopped.');
    } catch (error) {
      console.error("Error ending call:", error);
      setConnectionStatus('disconnected');
      setIsCallActive(false);
      setCallDuration(0);
    }
  };

  const toggleMute = () => {
    // Note: AG2 client handles microphone internally
    // This is a UI state toggle for future enhancement
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    console.log(`Microphone ${newMutedState ? 'muted' : 'unmuted'}`);
    // TODO: Implement mute functionality with AG2 client if supported
  };

  const toggleSpeaker = () => {
    // Note: AG2 client handles audio playback internally
    // This is a UI state toggle for future enhancement
    const newSpeakerState = !isSpeakerOn;
    setIsSpeakerOn(newSpeakerState);
    console.log(`Speaker ${newSpeakerState ? 'on' : 'off'}`);
    // TODO: Implement speaker control with AG2 client if supported
  };

  if (!selectedRole) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute -top-1/2 -left-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute top-1/4 right-1/4 w-48 sm:w-64 h-48 sm:h-64 bg-accent/8 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "-2s" }}
        />
        <div
          className="absolute -bottom-1/2 -right-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-primary/8 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "-3s" }}
        />
      </div>

      {/* Header */}
      <div className="relative z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm shrink-0">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 rounded-full border border-accent/30 bg-accent/5 px-2.5 sm:px-4 py-1.5 sm:py-2">
              <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-accent" />
              <span className="text-xs sm:text-sm font-medium text-accent-foreground truncate max-w-[120px] sm:max-w-none">
                {selectedRole.title}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-6 sm:py-12">
          {/* Call Interface */}
          <div className="w-full max-w-md space-y-6 sm:space-y-8">
            {/* Avatar/Profile Section */}
            <div className="flex flex-col items-center space-y-3 sm:space-y-4">
              <div
                className={cn(
                  "relative h-24 w-24 sm:h-32 sm:w-32 rounded-full flex items-center justify-center text-3xl sm:text-4xl font-bold text-white shadow-2xl transition-all duration-300",
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
              <div className="text-center space-y-1.5 sm:space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold">{selectedRole.title}</h2>
                {isCallActive && (
                  <div className="flex items-center justify-center gap-2 mt-2 sm:mt-4">
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
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="rounded-xl sm:rounded-2xl border border-accent/30 bg-accent/5 p-4 sm:p-6">
                  <Phone className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 text-accent" />
                  <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">Ready to Call</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Click the call button below to start a voice conversation
                    with the AI training assistant.
                  </p>
                </div>
              </div>
            )}

            {isCallActive && (
              <div className="text-center space-y-3 sm:space-y-4">
                <div
                  className={cn(
                    "rounded-xl sm:rounded-2xl border p-4 sm:p-6",
                    connectionStatus === "connected"
                      ? "border-green-500/30 bg-green-500/5"
                      : connectionStatus === "connecting"
                        ? "border-yellow-500/30 bg-yellow-500/5"
                        : "border-red-500/30 bg-red-500/5"
                  )}
                >
                  <div className="flex items-center justify-center gap-2 mb-1.5 sm:mb-2">
                    <div
                      className={cn(
                        "h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full animate-pulse",
                        connectionStatus === "connected"
                          ? "bg-green-500"
                          : connectionStatus === "connecting"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      )}
                    />
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-medium",
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
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {connectionStatus === "connected"
                      ? "You're connected to the AI training assistant"
                      : connectionStatus === "connecting"
                        ? "Establishing connection..."
                        : "Failed to connect. Please try again."}
                  </p>
                </div>

                {/* AI Response Text Display */}
                {connectionStatus === "connected" && aiResponseText && (
                  <div className="rounded-lg sm:rounded-xl border border-border/60 bg-background/80 p-3 sm:p-4 backdrop-blur text-left max-h-28 sm:max-h-32 overflow-y-auto">
                    <p className="text-xs font-medium mb-1.5 sm:mb-2 text-muted-foreground">AI Response:</p>
                    <p className="text-xs sm:text-sm text-foreground">{aiResponseText}</p>
                  </div>
                )}
              </div>
            )}

            {/* Call Controls */}
            <div className="flex flex-col gap-3 sm:gap-4">
              {!isCallActive ? (
                <Button
                  size="lg"
                  onClick={handleStartCall}
                  className="h-14 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-r from-accent to-accent/90 hover:from-accent/90 hover:to-accent/80 text-base sm:text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
                >
                  <Phone className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3" />
                  Start Call
                </Button>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {/* Control Buttons */}
                  <div className="flex items-center justify-center gap-3 sm:gap-4">
                    <Button
                      size="lg"
                      variant={isMuted ? "destructive" : "outline"}
                      onClick={toggleMute}
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-full"
                    >
                      {isMuted ? (
                        <MicOff className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Mic className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </Button>
                    <Button
                      size="lg"
                      variant="destructive"
                      onClick={handleEndCall}
                      className="h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-lg hover:shadow-xl"
                    >
                      <PhoneOff className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                    <Button
                      size="lg"
                      variant={isSpeakerOn ? "default" : "outline"}
                      onClick={toggleSpeaker}
                      className="h-12 w-12 sm:h-14 sm:w-14 rounded-full"
                    >
                      {isSpeakerOn ? (
                        <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
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
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-6 sm:pt-8">
              <div className="rounded-lg sm:rounded-xl border border-border/60 bg-background/80 p-2.5 sm:p-4 backdrop-blur text-center">
                <Phone className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 sm:mb-2 text-accent" />
                <p className="text-xs font-medium mb-0.5 sm:mb-1">Voice Training</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  Practice real conversations
                </p>
              </div>
              <div className="rounded-lg sm:rounded-xl border border-border/60 bg-background/80 p-2.5 sm:p-4 backdrop-blur text-center">
                <Mic className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 sm:mb-2 text-primary" />
                <p className="text-xs font-medium mb-0.5 sm:mb-1">Live Feedback</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
                  Get instant coaching tips
                </p>
              </div>
              <div className="rounded-lg sm:rounded-xl border border-border/60 bg-background/80 p-2.5 sm:p-4 backdrop-blur text-center">
                <Volume2 className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 sm:mb-2 text-accent" />
                <p className="text-xs font-medium mb-0.5 sm:mb-1">24/7 Available</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">
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
