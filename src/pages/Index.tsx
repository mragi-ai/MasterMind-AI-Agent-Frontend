import AITrainerWidget from "@/components/AITrainerWidget";
import HeroAITrainer from "@/components/HeroAITrainer";
import FeatureGridPro from "@/components/FeatureGridPro";
import TopicsShowcase from "@/components/TopicsShowcase";
import CommandPalette from "@/components/CommandPalette";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import "@/styles/feature-grid.css";
import "@/styles/topics.css";
import "@/styles/palette.css";
import useAppStore from "@/zustand";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

const commandItems = [
  {
    id: "chat",
    label: "Start a chat",
    hint: "Open AI assistant",
    onSelect: () => window.dispatchEvent(new CustomEvent("open-ai-trainer")),
  },
  {
    id: "call",
    label: "Call support",
    hint: "tel:+14073070855",
    onSelect: () => (window.location.href = "tel:+14073070855"),
  },
  {
    id: "container",
    label: "Tutorial: Check container availability",
    hint: "Learn the process",
    onSelect: () =>
      window.dispatchEvent(
        new CustomEvent("open-ai-trainer", {
          detail: { prompt: "How do I check container availability?" },
        })
      ),
  },
  {
    id: "billing",
    label: "Tutorial: Billing disputes",
    hint: "Create and track disputes",
    onSelect: () =>
      window.dispatchEvent(
        new CustomEvent("open-ai-trainer", {
          detail: { prompt: "How do I create a billing dispute?" },
        })
      ),
  },
  {
    id: "tracking",
    label: "Tutorial: Driver tracking",
    hint: "Real-time location",
    onSelect: () =>
      window.dispatchEvent(
        new CustomEvent("open-ai-trainer", {
          detail: { prompt: "How do I track last-mile drivers?" },
        })
      ),
  },
  {
    id: "dispatch",
    label: "Tutorial: Dispatch process",
    hint: "Complete workflow",
    onSelect: () =>
      window.dispatchEvent(
        new CustomEvent("open-ai-trainer", {
          detail: { prompt: "Show me the dispatch process" },
        })
      ),
  },
];

const Index = () => {
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

      {/* Header with quick call button */}

      {/* Hero Section */}
      <HeroAITrainer />

      {/* Features Section */}
      <FeatureGridPro />

      {/* Topics Section */}
      <TopicsShowcase />

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20 glass-effect">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground font-medium">
              © 2025 AI Training Assistant. Available 24/7.
            </p>
            <p className="text-xs text-muted-foreground">
              Conversations may be recorded for quality and training purposes.
            </p>
          </div>
        </div>
      </footer>

      {/* AI Widget */}
      <AITrainerWidget
        brandName="AI Trainer"
        phoneNumber="+14073070855"
        onEscalate={() => {
          console.log("Escalation requested");
        }}
      />

      {/* Command Palette (⌘K / Ctrl+K) */}
      <CommandPalette items={commandItems} />
    </div>
  );
};

export default Index;
