import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, PlayCircle, ArrowLeft } from "lucide-react";
import evansLogo from "@/assets/evans-logo.png";
import useAppStore from "@/zustand";
import masteryLogo from "@/assets/mastery-logo.png";
import { useNavigate } from "react-router-dom";
import { UserMenu } from "./UserMenu";
import { clearAuth } from "@/lib/auth";
import { logout } from "@/lib/api/endpoints/auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function HeroAITrainer() {
  const navigate = useNavigate();
  const selectedRole = useAppStore((state) => state.selectedRole);
  const [typedText, setTypedText] = useState("");
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Prompt examples for each role
  const rolePrompts: Record<string, string> = {
    "Carrier Representative": "Coach me through a detention update call with a carrier.",
    "Customer Representative": "Help me prepare a proactive shipment status recap for my customer.",
    "Agent Manager": "Walk me through a five-minute coaching huddle agenda.",
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed", error);
    }
    clearAuth();
    useAppStore.getState().setSelectedRole(null);
    navigate("/");
  };

  if (!selectedRole) {
    navigate("/role-selection");
    return null;
  }
  const currentPrompt =
    rolePrompts[selectedRole?.title || "Carrier Representative"] ||
    "Show me how to practice my next scenario.";

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
      className={`relative py-16 overflow-hidden transition-all duration-700 bg-gradient-to-br from-white via-primary/5 to-accent/5 ${getGradientClass()}`}
    >
      {/* Aurora background - Brighter and more vibrant */}
      <div className="absolute inset-0 pointer-events-none opacity-60">
        <div
          className="absolute top-0 left-1/4 w-96 h-96 bg-primary/25 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "10s", animationDelay: "-3s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-80 h-80 bg-primary/15 rounded-full blur-3xl animate-float"
          style={{ animationDuration: "12s", animationDelay: "-5s" }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Top Navigation */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/role-selection")}
            className="hover-lift"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Roles
          </Button>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="hover-lift shadow-sm"
              size="sm"
              onClick={() => setIsSupportModalOpen(true)}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Support
            </Button>
            <UserMenu onLogout={handleLogout} userName={selectedRole?.title} />
          </div>
        </div>

        {/* Co-brand logos */}
        <div className="co-brand-bar justify-center mb-10">
          <div className="mastery-logo-wrapper">
            <img src={masteryLogo} alt="Mastery" className="mastery-logo" />
          </div>
          <div className="powered-by">
            <span>Powered by</span>
            <div className="evans-logo-wrapper">
              <img
                src={evansLogo}
                alt="Evans Network of Companies"
                className="evans-logo"
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left content */}
          <div className="space-y-6">
            {/* Selected role badge */}
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full glass-effect border border-primary/20 mb-6">
              <div
                className={`w-10 h-10 flex items-center justify-center rounded-full text-lg ${selectedRole?.color === "primary"
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
              Run live simulations, rehearse conversations, and unlock video
              lessons curated for your training persona.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button
                size="lg"
                className="gap-2 shadow-lg hover-lift text-lg px-8 py-6"
                onClick={() => openChat()}
              >
                <MessageSquare className="h-5 w-5" />
                Start Simulation
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2 text-lg px-8 py-6"
                onClick={() => openChat("Recommend a video lesson for my next milestone.")}
              >
                <PlayCircle className="h-5 w-5" />
                Watch Lesson
              </Button>
            </div>
          </div>

          {/* Right: Chat simulation */}
          <div className="relative">
            <div className="glass-effect rounded-2xl border-2 border-primary/30 p-6 shadow-custom-lg backdrop-blur-md bg-white/95">
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
      <Dialog open={isSupportModalOpen} onOpenChange={setIsSupportModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Contact Support</DialogTitle>
            <DialogDescription className="pt-4  text-base leading-relaxed text-center">
              You can reach our mentor desk directly at{" "}
              <a href="tel:+14073070855" className="font-medium text-primary hover:underline">
                +14073070855
              </a>{" "}
              or email us at{" "}
              <a href="mailto:training-support@mastermind.ai" className="font-medium text-primary hover:underline">
                training-support@mastermind.ai
              </a>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </section>
  );
}
