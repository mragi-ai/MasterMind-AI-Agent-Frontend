import AITrainerWidget from "@/components/AITrainerWidget";
import HeroAITrainer from "@/components/HeroAITrainer";
import FeatureGridPro from "@/components/FeatureGridPro";
import TopicsShowcase from "@/components/TopicsShowcase";
import PopularVideosSection from "@/components/PopularVideosSection";
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
    id: "resume-path",
    label: "Resume training path",
    hint: "Jump back into your next module",
    onSelect: () =>
      window.dispatchEvent(
        new CustomEvent("open-ai-trainer", {
          detail: {
            prompt:
              "Guide me through the next step in my role-based training journey.",
          },
        })
      ),
  },
  {
    id: "launch-simulation",
    label: "Launch chat simulation",
    hint: "Practice a scenario with AI feedback",
    onSelect: () =>
      window.dispatchEvent(
        new CustomEvent("open-ai-trainer", {
          detail: {
            prompt:
              "Start a role-play simulation that reflects my day-to-day responsibilities.",
          },
        })
      ),
  },
  {
    id: "recommend-video",
    label: "Recommend a lesson",
    hint: "Find the best video to watch now",
    onSelect: () =>
      window.dispatchEvent(
        new CustomEvent("open-ai-trainer", {
          detail: {
            prompt:
              "Recommend a video lesson that matches my current role and progress.",
          },
        })
      ),
  },
  {
    id: "plan-coaching",
    label: "Plan coaching week",
    hint: "Balance practice and video drills",
    onSelect: () =>
      window.dispatchEvent(
        new CustomEvent("open-ai-trainer", {
          detail: {
            prompt:
              "Help me plan a week of training with chat simulations, lessons, and recap checkpoints.",
          },
        })
      ),
  },
  {
    id: "escalate-help",
    label: "Escalate to mentor",
    hint: "Request human coaching support",
    onSelect: () =>
      window.dispatchEvent(
        new CustomEvent("open-ai-trainer", {
          detail: {
            prompt:
              "I need a mentor for additional support on today's training topic.",
          },
        })
      ),
  },
  {
    id: "library-search",
    label: "Search training library",
    hint: "Find lessons by topic",
    onSelect: () =>
      window.dispatchEvent(
        new CustomEvent("open-ai-trainer", {
          detail: {
            prompt:
              "Search the training library for resources related to my role.",
          },
        })
      ),
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/2 to-accent/2 relative overflow-hidden">
      {/* Enhanced background gradient - Brighter and more vibrant */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none opacity-50">
        <div className="absolute -top-1/2 -left-1/4 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-float" />
        <div
          className="absolute top-1/4 right-1/4 w-64 h-64 bg-accent/12 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "-2s" }}
        />
        <div
          className="absolute -bottom-1/2 -right-1/4 w-96 h-96 bg-primary/12 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "-3s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "-4s" }}
        />
      </div>

      {/* Header with quick call button */}

      {/* Hero Section */}
      <HeroAITrainer />

      {/* Features Section */}
      <FeatureGridPro />

      {/* Popular Videos Section - Module-based like Coursera */}
      <PopularVideosSection />

      {/* Topics Section */}
      <TopicsShowcase />

      {/* Footer */}
      <footer className="border-t border-border/50 mt-20 glass-effect bg-white/90">
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
