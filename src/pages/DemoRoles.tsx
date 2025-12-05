import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import useAppStore from "@/zustand";

type Role = {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  color: "primary" | "accent";
  role?: string;
};

// Predefined demo roles
const demoRoles: Role[] = [
  {
    id: 1,
    title: "Carrier Representative",
    description:
      "Coordinate with carriers, oversee loads, and keep freight moving on schedule.",
    icon: Truck,
    color: "primary",
    role: "carrier_representative",
  },
  {
    id: 2,
    title: "Customer Representative",
    description:
      "Support shippers and receivers, deliver proactive updates, and resolve issues fast.",
    icon: Headset,
    color: "accent",
    role: "customer_representative",
  },
  {
    id: 3,
    title: "Agent Manager",
    description:
      "Orchestrate agent performance, monitor KPIs, and deliver operational insights.",
    icon: ShieldCheck,
    color: "accent",
    role: "agent_manager",
  },
  {
    id: 4,
    title: "Dispatcher",
    description:
      "Manage daily operations, coordinate shipments, and ensure timely deliveries.",
    icon: Briefcase,
    color: "primary",
    role: "dispatcher",
  },
  {
    id: 5,
    title: "Customer Service Agent",
    description:
      "Handle customer inquiries, provide support, and maintain customer satisfaction.",
    icon: MessageSquare,
    color: "accent",
    role: "customer_service_agent",
  },
  {
    id: 6,
    title: "Operations Coordinator",
    description:
      "Streamline logistics operations, optimize routes, and manage resources efficiently.",
    icon: User,
    color: "primary",
    role: "operations_coordinator",
  },
];

export default function DemoRoles() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [selectedRole, setSelectedRole] = useState<number | null>(null);

  const handleRoleSelect = (roleId: number) => {
    setSelectedRole(roleId);
  };


  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_rgba(10,10,10,0))]">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div
          className="absolute top-[-10%] left-[5%] h-[28rem] w-[28rem] rounded-full bg-primary/15 blur-3xl animate-float"
          style={{ animationDuration: "8s" }}
        />
        <div
          className="absolute bottom-[-10%] right-[10%] h-[32rem] w-[32rem] rounded-full bg-accent/20 blur-3xl animate-float"
          style={{ animationDuration: "12s", animationDelay: "-4s" }}
        />
      </div>

      <div className="relative container mx-auto max-w-7xl px-6 py-16">
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
                {demoRoles.length} Roles
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-2">
              {demoRoles.map((role) => {
                const isSelected = selectedRole === role.id;
                const Icon = role.icon;

                return (
                  <Card
                    key={role.id}
                    onClick={() => handleRoleSelect(role.id)}
                    className={cn(
                      "group relative flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-border/60 bg-background/80 transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_45px_rgba(14,165,233,0.15)]",
                      isSelected &&
                        "border-primary/60 shadow-[0_24px_60px_rgba(14,165,233,0.28)] ring-1 ring-primary/40"
                    )}
                  >
                    <div className="absolute inset-x-8 top-0 h-1 rounded-b-full bg-gradient-to-r from-primary/80 via-primary to-transparent opacity-0 transition group-hover:opacity-100" />
                    <CardHeader className="space-y-4 pb-0">
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-xl transition",
                          role.color === "primary"
                            ? "bg-primary/15 text-primary"
                            : "bg-accent/15 text-accent-foreground"
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-xl font-semibold">
                          {role.title}
                        </CardTitle>
                        <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                          {role.description}
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
                            const roleData = demoRoles.find((r) => r.id === role.id);
                            if (roleData) {
                              useAppStore.getState().setSelectedRole(roleData);
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
                            const roleData = demoRoles.find((r) => r.id === role.id);
                            if (roleData) {
                              useAppStore.getState().setSelectedRole(roleData);
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

