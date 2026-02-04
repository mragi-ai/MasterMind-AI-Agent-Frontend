import { useState, MouseEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Video,
  Zap,
  Phone,
  BookOpen,
  Headphones,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import useAppStore from "@/zustand";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

type Feature = {
  id: string;
  icon: any;
  title: string;
  description: string;
  metric: string;
  prompt: string;
  color: "primary" | "accent";
};

const features: Feature[] = [
  {
    id: "chat",
    icon: MessageSquare,
    title: "Chat Simulations",
    description:
      "Role-play real conversations with AI coaches that adapt to your persona and give instant feedback.",
    metric: "Live Coaching",
    prompt: "", // No default prompt - let user type their own message
    color: "primary",
  },
  {
    id: "video",
    icon: Video,
    title: "Video Lessons",
    description:
      "Stream cinematic walkthroughs and micro-trainings that mirror the scenarios you face every day.",
    metric: "200+ Lessons",
    prompt: "", // No default prompt
    color: "accent",
  },
  {
    id: "quick",
    icon: Zap,
    title: "Practice Modes",
    description:
      "Switch between guided drills, timed reps, or sandbox practice to sharpen skills at your pace.",
    metric: "3 Modes",
    prompt: "", // No default prompt
    color: "accent",
  },
  {
    id: "escalate",
    icon: Phone,
    title: "Mentor Escalation",
    description:
      "Request a human coach when you need deeper guidance—AI shares your progress and notes instantly.",
    metric: "Under 3 min",
    prompt: "", // No default prompt
    color: "primary",
  },
  {
    id: "source",
    icon: BookOpen,
    title: "Playbook Library",
    description:
      "Access playbooks, SOPs, and scripts aligned with your role and new certifications.",
    metric: "Always Current",
    prompt: "", // No default prompt
    color: "primary",
  },
  {
    id: "accessible",
    icon: Headphones,
    title: "Accessible Training",
    description:
      "Keyboard-first navigation, captions, and audio descriptions keep every learner in the loop.",
    metric: "WCAG 2.2 AA",
    prompt: "", // No default prompt
    color: "accent",
  },
];

export default function FeatureGridPro() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"comingSoon" | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const selectedRole = useAppStore((state) => state.selectedRole);

  const handleTryIt = (feature: Feature, e: MouseEvent) => {
    e.stopPropagation();
    if (feature.id === "chat") {
      // Open chat without pre-filled prompt - let user type their own message
      window.dispatchEvent(
        new CustomEvent("open-ai-trainer", {
          detail: {}, // No prompt - user will type their own message
        })
      );
    } else if (feature.id === "video") {
      navigate("/video-lessons");
    } else {
      setSelectedFeature(feature);
      setDialogType("comingSoon");
      setDialogOpen(true);
    }
  };

  return (
    <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <div className="mb-4 flex items-center justify-center gap-2">
          <span className="text-lg font-medium text-muted-foreground">
            Logged in as:
          </span>
          <span className="text-lg font-semibold text-primary">
            {selectedRole?.title}
          </span>
        </div>
        <h2 className="text-4xl font-bold mb-4 gradient-text">
          Training Capabilities
        </h2>
        <p className="text-xl text-muted-foreground">
          Blend simulations, lessons, and live coaching in one workspace
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          const isAccent = feature.color === "accent";

          return (
            <Card
              key={feature.id}
              className="feature-card group relative overflow-hidden"
            >
              {/* Icon */}
              <div
                className={`feature-icon ${isAccent ? "accent" : "primary"}`}
              >
                <Icon className="h-7 w-7" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                {feature.description}
              </p>

              {/* Metric badge */}
              <div className="feature-metric">{feature.metric}</div>

              {/* Try it button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4 group-hover:border-primary group-hover:text-primary transition-colors"
                onClick={(e) => handleTryIt(feature, e)}
              >
                Try it
              </Button>
            </Card>
          );
        })}
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(isOpen) => {
          setDialogOpen(isOpen);
          if (!isOpen) {
            setDialogType(null);
            setSelectedFeature(null);
          }
        }}
      >
        <DialogContent
          className={cn(
            "overflow-hidden bg-gradient-to-br from-background via-background/95 to-background",
            "sm:max-w-md"
          )}
        >
          {dialogType === "comingSoon" && (
            <div className="relative z-10">
              <DialogHeader className="space-y-4">
                <div className="bg-primary/10 w-fit mx-auto px-3 py-1 rounded-full">
                  <span className="text-primary text-sm font-medium animate-pulse">
                    Coming Soon!
                  </span>
                </div>
                <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                  {selectedFeature?.title}
                </DialogTitle>
                <DialogDescription className="text-center">
                  <p className="text-lg text-foreground/90 mb-2">
                    We're working hard to bring you something amazing!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    This feature is currently in development and will be available soon.
                  </p>
                </DialogDescription>
              </DialogHeader>

              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Development Progress</span>
                    <span className="text-primary font-medium">75%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full w-[75%] bg-gradient-to-r from-primary to-accent rounded-full animate-pulse" />
                  </div>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <p className="text-sm text-center text-muted-foreground">
                    Currently available for {selectedRole?.title}s:{" "}
                    <span className="text-foreground font-medium">Chat & Voice feature</span>
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="default"
                    className="sm:flex-1"
                    onClick={() => setDialogOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
