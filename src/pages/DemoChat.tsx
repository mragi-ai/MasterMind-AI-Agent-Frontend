import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AITrainerWidget from "@/components/AITrainerWidget";
import useAppStore from "@/zustand";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

export default function DemoChat() {
  const navigate = useNavigate();
  const selectedRole = useAppStore((state) => state.selectedRole);

  const chatPlaceholder = selectedRole
    ? `Hi! I'm ready to help you practice as a ${selectedRole.title}. What would you like to work on today?`
    : "Hi! I'm your AI training assistant. How can I help you today?";

  // Automatically open the chat widget when component mounts and set initial prompt
  useEffect(() => {
    // Small delay to ensure the widget is mounted and ready
    const timer = setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("open-ai-trainer", {
          // detail: {
          //   prompt: selectedRole
          //     ? `Hi! I'm ready to help you practice as a ${selectedRole.title}. What would you like to work on today?`
          //     : "Hi! I'm your AI training assistant. How can I help you today?",
          // },
        })
      );
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedRole]);

  // If no role is selected, redirect to demo roles page
  useEffect(() => {
    if (!selectedRole) {
      navigate("/demo-roles");
    }
  }, [selectedRole, navigate]);

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
            <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {selectedRole.title}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold tracking-tight">
            AI Training Assistant
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            You're chatting as a <strong>{selectedRole.title}</strong>. The chat
            window should open automatically. If it doesn't, look for the chat
            icon in the bottom right corner.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto mb-12">
          <div className="rounded-2xl border border-border/60 bg-background/80 p-6 backdrop-blur">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">Role-Based Training</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Conversations are tailored to your selected role for realistic
              practice scenarios.
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/80 p-6 backdrop-blur">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-accent/15 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-accent-foreground" />
              </div>
              <h3 className="font-semibold">Interactive Practice</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Engage in realistic scenarios and receive instant feedback on your
              responses.
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/80 p-6 backdrop-blur">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold">24/7 Available</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Practice anytime, anywhere. The AI assistant is always ready to
              help you improve.
            </p>
          </div>
        </div>
      </div>

      {/* AI Widget - This will be the chat interface */}
      <AITrainerWidget
        brandName="AI Trainer"
        phoneNumber="+14073070855"
        placeholder={chatPlaceholder}
        onEscalate={() => {
          console.log("Escalation requested");
        }}
        startOpen={true}
      />
    </div>
  );
}

