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
  DollarSign,
  Phone,
  Package,
  CarFront,
  MapPin,
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
    title: "Dispatcher",
    description: "Manage and coordinate fleet operations and deliveries",
    icon: Truck,
    color: "primary",
    role: "dispatcher",
  },
  {
    id: 2,
    title: "Billing Specialist",
    description: "Handle invoicing, payments, and financial operations",
    icon: DollarSign,
    color: "accent",
    role: "billing",
  },
  {
    id: 3,
    title: "Customer Service",
    description: "Provide support and resolve customer inquiries",
    icon: Phone,
    color: "primary",
    role: "customer_service",
  },
  {
    id: 4,
    title: "Warehouse Manager",
    description: "Oversee inventory and warehouse operations",
    icon: Package,
    color: "accent",
    role: "warehouse",
  },
  {
    id: 5,
    title: "Fleet Manager",
    description: "Manage vehicle maintenance and driver operations",
    icon: CarFront,
    color: "primary",
    role: "fleet",
  },
  {
    id: 6,
    title: "Route Planner",
    description: "Optimize delivery routes and schedules",
    icon: MapPin,
    color: "accent",
    role: "route_planner",
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
    <div className="relative min-h-screen bg-gradient-to-br from-background to-background/95">
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

      <div className="relative container max-w-6xl mx-auto px-4 py-12">
        <div className="space-y-6 text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect border border-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              Select Your Role
            </span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold">
            <span className="gradient-text">Choose Your Role,</span>
            <br />
            <span className="text-foreground">Get Specialized Help</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select your role to get personalized assistance and resources
            tailored to your needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {roles.map((role) => {
            const isSelected = selectedRole === role.id;
            const Icon = role.icon;

            return (
              <Card
                key={role.id}
                className={cn(
                  "feature-card group transition-all cursor-pointer hover:scale-[1.02]",
                  isSelected &&
                    "ring-2 ring-primary ring-offset-2 border-primary/30",
                  !isSelected && "hover:shadow-lg hover:border-primary/20"
                )}
                onClick={() => handleRoleSelect(role.id)}
              >
                <CardHeader>
                  <div
                    className={cn(
                      "feature-icon mb-4",
                      role.color === "primary" ? "primary" : "accent"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl mb-2">{role.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {role.description}
                  </CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button
                    className="w-full transition-colors"
                    variant={isSelected ? "default" : "outline"}
                    size={isMobile ? "lg" : "default"}
                  >
                    {isSelected ? "Selected" : "Select Role"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Button
            size="lg"
            className="px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
            onClick={handleStartChatting}
            disabled={!selectedRole}
          >
            Start Chatting
          </Button>
        </div>
      </div>
    </div>
  );
}
