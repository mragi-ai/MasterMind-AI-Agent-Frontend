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
  CheckCircle2,
  Sparkles,
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

const roles: Role[] = [
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
];

export default function RoleSelection() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const storedRole = useAppStore((state) => state.selectedRole);
  const [selectedRole, setSelectedRole] = useState<number | null>(
    storedRole?.id || null
  );

  const handleRoleSelect = (roleId: number) => {
    setSelectedRole(roleId);
  };

  const handleStartChatting = () => {
    if (selectedRole) {
      const selectedRoleData = roles.find((r) => r.id === selectedRole);
      useAppStore.getState().setSelectedRole(selectedRoleData);
      navigate("/dashboard");
    }
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
                Select Your Training Persona
              </span>
            </div>

            <div className="space-y-5">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                Tailored Learning Journeys for Every Logistics Pro
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Choose the role that mirrors your responsibilities so we can
                curate role-based simulations, guided chat practice, and
                on-demand video lessons.
              </p>
            </div>

            <div className="grid gap-5">
              {[
                "Practice real conversations with AI coaches tuned to your role.",
                "Watch micro-trainings and scenario breakdowns chosen for you.",
                "Track mastery with live scorecards and certification checkpoints.",
              ].map((item) => (
                <div
                  key={item}
                  className="group flex items-center gap-3 rounded-xl border border-border/60 bg-background/80 px-4 py-3 shadow-[0_8px_24px_rgba(15,23,42,0.1)] backdrop-blur transition hover:border-primary/40 hover:shadow-[0_16px_40px_rgba(14,165,233,0.15)]"
                >
                  <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary/10 text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                  <p className="text-sm font-medium text-foreground/90">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-8 rounded-3xl border border-border/50 bg-background/70 p-6 shadow-[0_24px_60px_rgba(15,23,42,0.2)] backdrop-blur-xl">
            <header className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-wider text-primary">
                  Persona Library
                </p>
                <h2 className="text-2xl font-semibold">
                  Preview the learning plan aligned to your daily outcomes.
                </h2>
              </div>
              <div className="rounded-full border border-border/80 bg-muted/40 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                3 Curated Tracks
              </div>
            </header>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                    <CardFooter className="pt-0">
                      <Button
                        variant={isSelected ? "default" : "outline"}
                        className={cn(
                          "w-full transition",
                          !isSelected &&
                            "border-border/60 bg-background/80 text-foreground hover:border-primary/50 hover:text-primary"
                        )}
                        size={isMobile ? "lg" : "default"}
                      >
                        {isSelected ? "Selected Track" : "Preview Training"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>

            <footer className="flex flex-col gap-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-primary">
                  Need more customization?
                </p>
                <p className="text-sm text-muted-foreground">
                  Start with the closest track. You can personalize lesson
                  sequences, skill goals, and practice scenarios anytime.
                </p>
              </div>
              <Button
                size="lg"
                className="min-w-[12rem] shadow-lg hover:shadow-xl"
                onClick={handleStartChatting}
                disabled={!selectedRole}
              >
                Enter Training Hub
              </Button>
            </footer>
          </section>
        </div>
      </div>
    </div>
  );
}
