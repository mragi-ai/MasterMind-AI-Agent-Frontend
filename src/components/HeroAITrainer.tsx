import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Phone, PlayCircle, ChevronDown, Truck, Headset, ShieldCheck, Check } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Available roles for selection
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

// Default role for simplified direct login flow
const defaultRole = roles[0];

// Helper function to get the full role object from the local roles array
const getRoleById = (id: string | undefined): Role | null => {
  if (!id) return null;
  return roles.find(role => role.id === id) || null;
};

export default function HeroAITrainer() {
  const navigate = useNavigate();
  const storedRole = useAppStore((state) => state.selectedRole);
  const setSelectedRole = useAppStore((state) => state.setSelectedRole);
  const [typedText, setTypedText] = useState("");
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Match stored role with local roles array to get complete role object with icon
  const selectedRole = getRoleById(storedRole?.id) || (storedRole ? roles.find(r => r.title === storedRole.title) : null);

  // Auto-select default role if none is set (simplified flow)
  useEffect(() => {
    if (!storedRole) {
      setSelectedRole(defaultRole);
    }
  }, [storedRole, setSelectedRole]);

  // Handle role selection
  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
  };

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

  // Use selected role or default role - now properly matched from local roles array
  const activeRole = selectedRole || defaultRole;
  const currentPrompt =
    rolePrompts[activeRole?.title || "Carrier Representative"] ||
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
    const color = activeRole?.color || "primary";
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
        {/* Top Navigation - Simplified */}
        <div className="flex justify-end items-center mb-6">
          <div className="flex items-center gap-3">
            <ThemeToggle variant="outline" size="sm" className="bg-card/80 border-border shadow-sm" />
            <Button
              variant="outline"
              className="hover-lift shadow-sm"
              size="sm"
              onClick={() => setIsSupportModalOpen(true)}
            >
              <Phone className="h-4 w-4 mr-2" />
              Call Support
            </Button>
            <UserMenu onLogout={handleLogout} userName={activeRole?.title} />
          </div>
        </div>

        {/* Co-brand logos with brand names */}
        <div className="flex flex-col items-center gap-4 mb-10">
          {/* Primary Brand - Mastery */}
          <div className="flex flex-col items-center gap-2">
            <div className="mastery-logo-wrapper">
              <img src={masteryLogo} alt="Mastery" className="mastery-logo" />
            </div>
        
          </div>
          
          {/* Secondary Brand - Evans */}
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl glass-effect border border-border/50">
            <span className="text-muted-foreground text-sm font-medium">Powered by</span>
            <div className="flex items-center gap-2">
              <div className="evans-logo-wrapper">
                <img
                  src={evansLogo}
                  alt="Evans Network of Companies"
                  className="evans-logo"
                />
              </div>
              <span className="text-foreground text-sm sm:text-base font-semibold">
                Evans Network of Companies
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left content */}
          <div className="space-y-6">
            {/* Role selector section */}
            <div className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wider text-primary">
                Your Training Persona
              </h2>
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="inline-flex items-center gap-3 px-5 py-3 rounded-full glass-effect border border-primary/20 mb-6 hover:border-primary/40 hover:shadow-lg transition-all duration-200 cursor-pointer group">
                  <div
                    className={cn(
                      "w-10 h-10 flex items-center justify-center rounded-full text-lg transition-colors",
                      activeRole?.color === "primary"
                        ? "bg-primary/10 text-primary"
                        : "bg-accent/10 text-accent"
                    )}
                  >
                    {activeRole?.title.includes("Carrier") ? (
                      <Truck className="h-5 w-5" />
                    ) : activeRole?.title.includes("Customer") ? (
                      <Headset className="h-5 w-5" />
                    ) : activeRole?.title.includes("Agent") ? (
                      <ShieldCheck className="h-5 w-5" />
                    ) : (
                      "✨"
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-base font-semibold text-foreground">
                      {activeRole?.title || "Select Role"}
                    </span>
                    {/* <span className="text-xs text-muted-foreground">
                      {activeRole?.description || "Choose your training persona"}
                    </span> */}
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors ml-2" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-80 p-2">
                <div className="px-2 py-1.5 mb-2">
                  <p className="text-sm font-semibold text-foreground">Select Training Persona</p>
                  <p className="text-xs text-muted-foreground">Choose a role to personalize your experience</p>
                </div>
                {roles.map((role) => {
                  const Icon = role.icon;
                  const isActive = activeRole?.id === role.id;
                  return (
                    <DropdownMenuItem
                      key={role.id}
                      onClick={() => handleRoleSelect(role)}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        isActive && "bg-primary/10"
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 flex items-center justify-center rounded-full flex-shrink-0",
                          role.color === "primary"
                            ? "bg-primary/10 text-primary"
                            : "bg-accent/10 text-accent"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-foreground">
                            {role.title}
                          </span>
                          {isActive && (
                            <Check className="h-4 w-4 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground line-clamp-2">
                          {role.description}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
              </DropdownMenu>
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
