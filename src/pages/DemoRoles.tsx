import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  Truck,
  Headset,
  ShieldCheck,
  Sparkles,
  User,
  Briefcase,
  MessageSquare,
  Phone,
  Bot,
  Loader2,
  ArrowLeft,
  Users,
  Building2,
  GraduationCap,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import useAppStore from "@/zustand";
import { listAgents, type Agent } from "@/lib/api/endpoints/agent";
import { ThemeToggle } from "@/components/ThemeToggle";

type Role = {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: "primary" | "accent";
  role?: string;
};

// Map agent name to icons based on keywords
const getIconForAgent = (agentName?: string): React.ElementType => {
  const name = (agentName || "").toLowerCase();

  if (name.includes("customer")) return Users;
  if (name.includes("carrier")) return Truck;
  if (name.includes("facility")) return Building2;
  if (name.includes("trainer") || name.includes("training"))
    return GraduationCap;
  if (name.includes("record") || name.includes("operations"))
    return ClipboardList;
  if (name.includes("logistics")) return Truck;
  if (name.includes("manager")) return Briefcase;

  return Bot;
};

// Generate description based on agent name and role
const getDescriptionForAgent = (agent: Agent): string => {
  const name = agent.name.toLowerCase();
  const role = agent.role || "";

  // Descriptions based on agent type
  if (name.includes("customer record operations trainer")) {
    return "Master customer record management with guided training. Learn to handle customer data, update records, and maintain accuracy in the system.";
  }
  if (name.includes("carrier record operations trainer")) {
    return "Train on carrier record operations and management. Learn best practices for maintaining carrier information and compliance documentation.";
  }
  if (name.includes("facility record operations trainer")) {
    return "Develop expertise in facility record management. Learn to maintain facility data, track updates, and ensure data integrity.";
  }
  if (name.includes("customer record")) {
    return "Practice customer record operations including data entry, updates, and customer service workflows.";
  }
  if (name.includes("carrier record")) {
    return "Work with carrier records, manage transportation data, and practice carrier communication scenarios.";
  }
  if (name.includes("facility record")) {
    return "Handle facility records, manage location data, and practice warehouse/facility management scenarios.";
  }
  if (name.includes("evans logistics")) {
    return "Comprehensive logistics training covering all aspects of Evans Logistics operations and best practices.";
  }

  // Default description
  return role !== "N/A" && role
    ? `Training for ${role} role.`
    : "AI-powered training assistant for logistics operations.";
};

const MAX_LENGTH = 120;

const isLongText = (text: string) => text.length > MAX_LENGTH;

// Convert Agent to Role format
const agentToRole = (agent: Agent, index: number): Role => {
  return {
    id: agent._id || agent.id,
    title: agent.name,
    description: getDescriptionForAgent(agent),
    icon: getIconForAgent(agent.name),
    color: index % 2 === 0 ? "primary" : "accent",
    role: agent.role !== "N/A" ? agent.role : agent.name,
  };
};

export default function DemoRoles() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // New state to hold the raw API response for debugging

  const [expandedRoles, setExpandedRoles] = useState<Record<string, boolean>>(
    {},
  );

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
  };

  const toggleReadMore = (id: string) => {
    setExpandedRoles((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Fetch agents from API
  useEffect(() => {
    const fetchAgents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("🚀 Fetching agents in DemoRoles...");
        const response = await listAgents();
        console.log("📦 Full API Response:", response);

        // Check if response is HTML (ngrok warning page)
        if (typeof response === "string") {
          const responseStr = JSON.stringify(response);
          if (
            responseStr.includes("<!DOCTYPE html>") ||
            responseStr.includes("ngrok")
          ) {
            console.error("❌ Received ngrok warning page instead of JSON");
            setError(
              "Ngrok warning page detected. Please visit the API URL in your browser first to bypass the warning, then refresh this page.",
            );
            return;
          }
        }

        // Handle different response formats:
        // Format 1: { status: "success", data: [...] }
        // Format 2: { agents: [...], total: number }
        let agentsList: Agent[] = [];

        if (response.agents && Array.isArray(response.agents)) {
          // Format 2: Direct agents array
          agentsList = response.agents;
          console.log("✅ Agents fetched successfully (format: agents array)!");
        } else if (
          response.status === "success" &&
          response.data &&
          Array.isArray(response.data)
        ) {
          // Format 1: Success with data array
          agentsList = response.data;
          console.log("✅ Agents fetched successfully (format: data array)!");
        } else if (Array.isArray(response)) {
          // Direct array response
          agentsList = response as unknown as Agent[];
          console.log("✅ Agents fetched successfully (format: direct array)!");
        }

        if (agentsList.length > 0) {
          console.log("📊 Total Agents:", agentsList.length);
          console.log("🤖 Agents List:", agentsList);

          // Log each agent individually
          agentsList.forEach((agent: Agent, index: number) => {
            console.log(`\n🤖 Agent ${index + 1}:`, agent);
          });

          // Convert agents to roles
          const convertedRoles = agentsList.map((agent, index) =>
            agentToRole(agent, index),
          );
          setRoles(convertedRoles);
        } else {
          console.warn("⚠️ No agents found in response:", response);
          setError("No agents found. Please check the API endpoint.");
        }
      } catch (error: any) {
        console.error("❌ Failed to fetch agents:", error);

        // Check if error response is HTML
        if (
          error?.response?.data &&
          typeof error.response.data === "string" &&
          error.response.data.includes("<!DOCTYPE html>")
        ) {
          console.error(
            "❌ Received HTML response (likely ngrok warning page)",
          );
          setError(
            "Ngrok warning page detected. The API endpoint may require browser verification. Please check the API URL.",
          );
        } else {
          console.error("Error details:", {
            message: error?.message,
            response: error?.response?.data,
            stack: error?.stack,
          });
          setError(
            error?.message || "Failed to load agents. Please try again.",
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    void fetchAgents();
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background transition-colors duration-300">
      {/* Header - Back Button & Theme Toggle */}
      <div className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="gap-1.5 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Login</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <ThemeToggle
              variant="outline"
              size="sm"
              className="bg-card/80 border-border shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Ambient background - theme aware */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_hsl(var(--primary)/0.15),_transparent_60%)]" />
        <div
          className="absolute top-[-10%] left-[5%] h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-3xl animate-float"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-[-10%] right-[10%] h-[32rem] w-[32rem] rounded-full bg-accent/20 blur-3xl animate-float"
          style={{ animationDuration: "12s", animationDelay: "-4s" }}
        />
      </div>

      <div className="relative container mx-auto max-w-7xl px-4 sm:px-6 pt-20 sm:pt-24 pb-12 sm:pb-16">
        <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
          <section className="space-y-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2 text-primary shadow-[0_0_32px_rgba(14,165,233,0.15)]">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium uppercase tracking-wider">
                Try Demo - Select a Role
              </span>
            </div>

            <div className="space-y-5">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Explore AI Training with Predefined Roles
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Choose a role to experience our AI training assistant. Each role
                comes with tailored conversations and scenarios designed for
                that specific position.
              </p>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
              <p className="text-sm font-medium text-primary mb-2">
                🎯 Demo Mode Active
              </p>
              <p className="text-sm text-muted-foreground">
                You're exploring in demo mode. Select any role below to start a
                conversation with our AI training assistant.
              </p>
            </div>
          </section>

          <section className="space-y-8 rounded-3xl border border-border/50 bg-background/70 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.2)] backdrop-blur-xl">
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-primary">
                  Demo Roles
                </p>
                <h2 className="text-2xl font-semibold">
                  Select a role and choose Chat or Call
                </h2>
              </div>
              <div className="rounded-full border border-border/80 bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {roles.length} Roles
              </div>
            </header>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center gap-4 py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Loading agents...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/70 bg-muted/20 p-12 text-center text-muted-foreground">
                <Bot className="h-12 w-12 text-primary/70" />
                <div>
                  <p className="text-lg font-medium text-foreground">
                    Failed to load agents
                  </p>
                  <p className="text-sm">{error}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setError(null);
                    window.location.reload();
                  }}
                >
                  Try Again
                </Button>
              </div>
            ) : roles.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/70 bg-muted/20 p-12 text-center text-muted-foreground">
                <Bot className="h-12 w-12 text-primary/70" />
                <div>
                  <p className="text-lg font-medium text-foreground">
                    No agents found
                  </p>
                  <p className="text-sm">
                    There are no agents available at the moment. Please check
                    back later.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {roles.map((role) => {
                  const isSelected = selectedRole === role.id;
                  const Icon = role.icon;

                  return (
                    <Card
                      key={role.id}
                      onClick={() => handleRoleSelect(role.id)}
                      className={cn(
                        "group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/60 bg-background/80 transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_45px_rgba(14,165,233,0.15)]",
                        isSelected &&
                          "border-primary/60 shadow-[0_24px_60px_rgba(14,165,233,0.28)] ring-1 ring-primary/40",
                      )}
                    >
                      <div className="absolute inset-x-8 top-0 h-1 rounded-b-full bg-gradient-to-r from-primary/80 via-primary to-transparent opacity-0 transition group-hover:opacity-100" />
                      <CardHeader className="space-y-4 pb-0">
                        <div
                          className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-xl transition",
                            role.color === "primary"
                              ? "bg-primary/15 text-primary"
                              : "bg-accent/15 text-accent-foreground",
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <CardTitle className="text-xl font-semibold">
                            {role.title}
                          </CardTitle>
                          {/* <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                            {role.description}
                          </CardDescription> */}
                          <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                            {expandedRoles[role.id] ||
                            !isLongText(role.description)
                              ? role.description
                              : `${role.description.slice(0, MAX_LENGTH)}...`}

                            {isLongText(role.description) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleReadMore(role.id);
                                }}
                                className="ml-1 text-primary text-xs font-medium hover:underline"
                              >
                                {expandedRoles[role.id]
                                  ? "Read less"
                                  : "Read more"}
                              </button>
                            )}
                          </CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1" />
                      <CardFooter className="pt-0 flex flex-col gap-2">
                        <div className="flex gap-2 w-full">
                          <Button
                            variant="default"
                            className="flex-1 transition gap-2 bg-primary hover:bg-primary/90"
                            size={isMobile ? "lg" : "default"}
                            onClick={(e) => {
                              e.stopPropagation();
                              const roleData = roles.find(
                                (r) => r.id === role.id,
                              );
                              if (roleData) {
                                useAppStore
                                  .getState()
                                  .setSelectedRole(roleData);
                                navigate("/demo-chat");
                              }
                            }}
                          >
                            <MessageSquare className="h-4 w-4" />
                            Chat
                          </Button>
                          <Button
                            variant="default"
                            className="flex-1 transition gap-2 bg-accent hover:bg-accent/90"
                            size={isMobile ? "lg" : "default"}
                            onClick={(e) => {
                              e.stopPropagation();
                              const roleData = roles.find(
                                (r) => r.id === role.id,
                              );
                              if (roleData) {
                                useAppStore
                                  .getState()
                                  .setSelectedRole(roleData);
                                navigate("/demo-call");
                              }
                            }}
                          >
                            <Phone className="h-4 w-4" />
                            Call
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-6 py-5">
              <div className="space-y-2 text-center">
                <p className="text-sm font-semibold text-primary">
                  Choose Your Interaction Method
                </p>
                <p className="text-sm text-muted-foreground">
                  Click "Chat" for text-based conversations or "Call" for voice
                  interactions. Both options are available for each role.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
