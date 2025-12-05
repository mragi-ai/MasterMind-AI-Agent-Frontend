import { useState, useRef, MouseEvent } from "react";
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
import { useNavigate } from "react-router-dom";
import useAppStore from "@/zustand";

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
    title: "Chat & Voice",
    description:
      "Type your question or use push-to-talk for hands-free help. Get instant answers from our AI.",
    metric: "24/7 Available",
    prompt: "How can I help you today?",
    color: "primary",
  },
  {
    id: "video",
    icon: Video,
    title: "Video Walkthroughs",
    description:
      "Watch step-by-step video guides tailored to your question. Learn by seeing it done.",
    metric: "230+ Videos",
    prompt: "Show me tutorial videos",
    color: "accent",
  },
  {
    id: "quick",
    icon: Zap,
    title: "Quick Actions",
    description:
      "Use smart quick-reply buttons to navigate common workflows faster than typing.",
    metric: "50+ Shortcuts",
    prompt: "What quick actions are available?",
    color: "accent",
  },
  {
    id: "escalate",
    icon: Phone,
    title: "Escalate Anytime",
    description:
      "Need a human? One click connects you to a specialist with full conversation context.",
    metric: "<3 min wait",
    prompt: "Connect me with a specialist",
    color: "primary",
  },
  {
    id: "source",
    icon: BookOpen,
    title: "Source Citations",
    description:
      "Every answer includes the source document or SOP version for transparency and trust.",
    metric: "100% Traced",
    prompt: "Show me your sources",
    color: "primary",
  },
  {
    id: "accessible",
    icon: Headphones,
    title: "Fully Accessible",
    description:
      "WCAG 2.2 AA compliant, keyboard-first navigation, and screen reader optimized.",
    metric: "AA Certified",
    prompt: "Tell me about accessibility features",
    color: "accent",
  },
];

export default function FeatureGridPro() {
  const [hoveredFeature, setHoveredFeature] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const featureRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const selectedRole = useAppStore((state) => state.selectedRole);

  const handleTryIt = (feature: Feature, e: MouseEvent) => {
    e.stopPropagation();
    if (feature.id === "chat") {
      window.dispatchEvent(
        new CustomEvent("open-ai-trainer", {
          detail: { prompt: feature.prompt },
        })
      );
    } else {
      setSelectedFeature(feature);
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
          Powerful Features
        </h2>
        <p className="text-xl text-muted-foreground">
          Everything you need for seamless training
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md overflow-hidden bg-gradient-to-br from-background via-background/95 to-background">
          {/* Decorative elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl animate-pulse delay-700" />
          </div>

          <DialogHeader className="relative z-10 space-y-4">
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
                This feature is currently in development and will be available
                soon.
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-4 relative z-10">
            {/* Progress indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Development Progress
                </span>
                <span className="text-primary font-medium">75%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-[75%] bg-gradient-to-r from-primary to-accent rounded-full animate-pulse" />
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <p className="text-sm text-center text-muted-foreground">
                Currently available for {selectedRole?.title}s:{" "}
                <span className="text-foreground font-medium">
                  Chat & Voice feature
                </span>
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              {/* <Button
                variant="outline"
                className="sm:flex-1 group"
                onClick={() => {
                  setDialogOpen(false);
                  window.dispatchEvent(new CustomEvent("open-ai-trainer"));
                }}
              >
                <MessageSquare className="w-4 h-4 mr-2 group-hover:text-primary transition-colors" />
                Try Chat Instead
              </Button> */}
              <Button
                variant="default"
                className="sm:flex-1"
                onClick={() => setDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
