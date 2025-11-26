import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAppStore from "@/zustand";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DemoCall() {
  const navigate = useNavigate();
  const selectedRole = useAppStore((state) => state.selectedRole);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const phoneNumber = "+14073070855";

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartCall = () => {
    setIsCallActive(true);
    setCallDuration(0);
    // In a real implementation, this would initiate a WebRTC call or redirect to tel: link
    // For demo purposes, we'll show the call interface
    window.location.href = `tel:${phoneNumber.replace(/^tel:/, "")}`;
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setCallDuration(0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
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
                <p className="text-muted-foreground">{selectedRole.description}</p>
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
                    Click the call button below to start a voice conversation with
                    the AI training assistant.
                  </p>
                </div>
              </div>
            )}

            {isCallActive && (
              <div className="text-center space-y-4">
                <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-6">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      Call in progress
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    You're connected to the AI training assistant
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

