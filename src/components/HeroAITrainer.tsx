import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone } from "lucide-react";
import evansLogo from "@/assets/evans-logo.png";
import useAppStore from "@/zustand";
import masteryLogo from "@/assets/mastery-logo.png";
import { useNavigate } from "react-router-dom";
import { UserMenu } from "./UserMenu";
import { clearAuth } from "@/lib/auth";

export default function HeroAITrainer() {
  const navigate = useNavigate();
  const selectedRole = useAppStore((state) => state.selectedRole);
  const [typedText, setTypedText] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);

  // Prompt examples for each role
  const rolePrompts: Record<string, string> = {
    Dispatcher: "How do I track a container in real-time?",
    Billing: "How do I create a billing dispute ticket?",
    "Customer Service": "How do I handle a customer escalation?",
  };

  const handleLogout = () => {
    clearAuth();
    useAppStore.getState().setSelectedRole(null);
    navigate("/");
  };

  if (!selectedRole) {
    navigate("/role-selection");
    return null;
  }
  const currentPrompt =
    rolePrompts[selectedRole?.title || "Dispatcher"] ||
    "How do I track a container in real-time?";

  // Typing animation effect
  useEffect(() => {
    setTypedText("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < currentPrompt.length) {
        setTypedText(currentPrompt.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [currentPrompt]);

  const openChat = (prompt?: string) => {
    window.dispatchEvent(
      new CustomEvent("open-ai-trainer", { detail: { prompt } })
    );
  };

  const getGradientClass = () => {
    const color = selectedRole?.color || "primary";
    return color === "primary"
      ? "from-primary/20 to-primary/5"
      : "from-accent/20 to-accent/5";
  };

  return (
    <section
      className={`relative py-16 overflow-hidden transition-all duration-700 bg-gradient-to-br ${getGradientClass()}`}
    >
      {/* Aurora background */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "10s", animationDelay: "-3s" }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Navigation */}
        <div className="flex justify-end mb-6">
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              className="hover-lift shadow-sm"
              size="sm"
            >
              <a href="tel:+14073070855">
                <Phone className="h-4 w-4 mr-2" />
                Call Support
              </a>
            </Button>
            <UserMenu onLogout={handleLogout} userName={selectedRole?.title} />
          </div>
        </div>

        {/* Co-brand logos */}
        <div className="co-brand-bar justify-center mb-10">
          <img src={masteryLogo} alt="Mastery" className="mastery-logo" />
          <div className="powered-by">
            <span>Powered by</span>
            <img
              src={evansLogo}
              alt="Evans Network of Companies"
              className="evans-logo"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left content */}
          <div className="space-y-6">
            {/* Selected role badge */}
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full glass-effect border border-primary/20 mb-6">
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full text-lg ${
                  selectedRole?.color === "primary"
                    ? "bg-primary/10 text-primary"
                    : "bg-accent/10 text-accent"
                }`}
              >
                {selectedRole?.title.includes("Dispatch")
                  ? "🚛"
                  : selectedRole?.title.includes("Billing")
                  ? "💰"
                  : selectedRole?.title.includes("Customer")
                  ? "📞"
                  : "✨"}
              </div>
              <div className="flex flex-col text-left">
                <span className="text-base font-semibold text-foreground">
                  {selectedRole?.title || "AI Assistant"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {selectedRole?.description ||
                    "Personalized support assistant"}
                </span>
              </div>
            </div>

            <p className="text-lg text-muted-foreground leading-relaxed">
              Chat with AI, watch step-by-step videos, or connect with a
              specialist — all personalized for your role.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                size="lg"
                className="gap-2 shadow-lg hover-lift text-lg px-8 py-6"
                onClick={() => openChat()}
              >
                <MessageSquare className="h-5 w-5" />
                Start Chatting
              </Button>
            </div>
          </div>

          {/* Right: Chat simulation */}
          <div className="relative">
            <div className="glass-effect rounded-2xl border-2 border-primary/20 p-6 shadow-custom-lg backdrop-blur-md">
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold">AI Assistant</div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    Online
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-3 ml-auto max-w-[80%]">
                  <p className="text-sm">{currentPrompt}</p>
                </div>

                <div className="bg-card border border-border rounded-xl px-4 py-3 mr-auto max-w-[80%]">
                  <p className="text-sm min-h-[3rem] flex items-center">
                    {typedText}
                    <span className="inline-block w-0.5 h-4 bg-primary ml-1 animate-pulse" />
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  💡 This conversation is tailored to your selected role
                </p>
              </div>
            </div>

            {/* Floating assistant orb */}
            <button
              onClick={() => openChat()}
              className="absolute -bottom-6 -right-6 w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent shadow-custom-lg hover:shadow-custom hover:scale-110 transition-all duration-300 flex items-center justify-center group animate-pulse-ring"
              aria-label="Open AI Assistant"
            >
              <MessageSquare className="h-8 w-8 text-white group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
