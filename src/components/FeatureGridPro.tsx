import { useState, MouseEvent, FormEvent } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Video,
  Zap,
  Phone,
  BookOpen,
  Headphones,
  Search,
  Play,
  ExternalLink,
  Clock,
  Calendar,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import useAppStore from "@/zustand";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { searchVideos, type VideoSearchResult } from "@/lib/api/endpoints/videos";
import { cn } from "@/lib/utils";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"comingSoon" | "videoSearch" | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [videoQuery, setVideoQuery] = useState("AI training walkthrough");
  const [videoResults, setVideoResults] = useState<VideoSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const selectedRole = useAppStore((state) => state.selectedRole);

  const trendingQueries = [
    "AI onboarding tutorial",
    "Driver tracking walkthrough",
    "Billing dispute training",
    "Dispatch workflow demo",
  ];

  const resetVideoState = () => {
    setVideoResults([]);
    setHasSearched(false);
    setIsSearching(false);
    setSearchError(null);
  };

  const performVideoSearch = async (query: string) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setSearchError("Enter a topic to explore tailored training videos.");
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await searchVideos(trimmedQuery);
      setVideoResults(response.results ?? []);
      setHasSearched(true);
    } catch (error) {
      console.error("Failed to search videos", error);
      setSearchError("We couldn’t load videos just now. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleTryIt = (feature: Feature, e: MouseEvent) => {
    e.stopPropagation();
    if (feature.id === "chat") {
      window.dispatchEvent(
        new CustomEvent("open-ai-trainer", {
          detail: { prompt: feature.prompt },
        })
      );
    } else if (feature.id === "video") {
      setSelectedFeature(feature);
      setDialogType("videoSearch");
      resetVideoState();
      const defaultQuery = "AI training walkthrough";
      setVideoQuery(defaultQuery);
      setDialogOpen(true);
      void performVideoSearch(defaultQuery);
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

      <Dialog
        open={dialogOpen}
        onOpenChange={(isOpen) => {
          setDialogOpen(isOpen);
          if (!isOpen) {
            setDialogType(null);
            setSelectedFeature(null);
            resetVideoState();
          }
        }}
      >
        <DialogContent
          className={cn(
            "overflow-hidden bg-gradient-to-br from-background via-background/95 to-background",
            dialogType === "videoSearch"
              ? "left-0 top-0 h-screen w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-none p-0 sm:left-0 sm:top-0 sm:h-screen sm:w-screen sm:max-w-none sm:translate-x-0 sm:translate-y-0 sm:rounded-none"
              : "sm:max-w-md"
          )}
        >
          {/* Decorative elements */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            <div className="absolute -top-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-accent/10 rounded-full blur-3xl animate-pulse delay-700" />
          </div>

          {dialogType === "videoSearch" ? (
            <div className="relative z-10 flex h-full flex-col">
              <div className="absolute right-6 top-6 z-20">
                <DialogClose asChild>
                  <button
                    type="button"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background/80 text-muted-foreground shadow-lg backdrop-blur transition hover:border-primary/60 hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Close video walkthroughs"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </DialogClose>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-primary/15 via-background to-background px-6 py-8 shadow-lg sm:px-10">
                <div className="absolute inset-y-0 -left-10 hidden w-2/5 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent blur-3xl md:block" />
                <div className="absolute -top-32 right-10 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
                <div className="relative flex flex-col gap-6 text-center md:flex-row md:items-center md:text-left">
                  <div className="flex-1 space-y-4">
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-medium text-primary/90">
                      <Play className="h-4 w-4" />
                      Guided video answers
                    </div>
                    <DialogTitle className="text-3xl font-bold leading-tight md:text-4xl">
                      {selectedFeature?.title}
                    </DialogTitle>
                    <DialogDescription className="max-w-2xl text-base text-muted-foreground">
                      Search a cinematic grid of walkthroughs and SOP demos hand-picked to
                      complement your AI assistant. Filter by popular topics or explore your own path.
                    </DialogDescription>
                  </div>
                  <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/40 bg-background/80 p-4 text-sm text-muted-foreground shadow-inner backdrop-blur md:w-72">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Quick stats
                    </span>
                    <div className="flex w-full items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
                      <div className="flex flex-col text-left">
                        <span className="text-2xl font-bold text-foreground">230+</span>
                        <span className="text-xs text-muted-foreground">guided walkthroughs</span>
                      </div>
                      <Badge variant="outline" className="rounded-full border-primary/40 text-primary">
                        New drops weekly
                      </Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      Built for training teams. Seamlessly hand-off to chat for nuanced questions.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 overflow-hidden p-6 sm:p-8">
                <form
                  className="relative flex flex-col gap-4 overflow-hidden rounded-3xl border border-border/60 bg-background/90 p-4 shadow-lg backdrop-blur md:flex-row md:items-center md:gap-6 md:p-6"
                  onSubmit={async (event: FormEvent<HTMLFormElement>) => {
                    event.preventDefault();
                    await performVideoSearch(videoQuery);
                  }}
                >
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={videoQuery}
                      onChange={(event) => setVideoQuery(event.target.value)}
                      placeholder="Search for training walkthroughs..."
                      className="h-14 rounded-2xl border-border/70 bg-background pl-12 text-base shadow-sm focus-visible:ring-1 focus-visible:ring-primary"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    className="h-14 rounded-2xl px-8 text-base font-semibold md:w-auto"
                    disabled={isSearching}
                  >
                    {isSearching ? "Finding videos..." : "Search library"}
                  </Button>
                </form>

                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="text-muted-foreground">Trending now:</span>
                  {trendingQueries.map((query) => (
                    <Button
                      key={query}
                      variant="secondary"
                      size="sm"
                      className="rounded-full bg-muted hover:bg-muted/80"
                      type="button"
                      onClick={() => {
                        setVideoQuery(query);
                        void performVideoSearch(query);
                      }}
                    >
                      {query}
                    </Button>
                  ))}
                </div>

                {searchError && (
                  <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive">
                    {searchError}
                  </p>
                )}

                <div className="flex flex-1 flex-col overflow-hidden rounded-3xl border border-border/60 bg-background/80 shadow-inner backdrop-blur">
                  <div className="flex items-center justify-between border-b border-border/40 px-6 py-4 text-sm text-muted-foreground">
                    <span>
                      {hasSearched
                        ? `${videoResults.length} ${
                            videoResults.length === 1 ? "result" : "results"
                          } found`
                        : "Curated highlights"}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full border-primary/40 text-primary">
                        Curated
                      </Badge>
                      <Badge
                        variant="outline"
                        className="rounded-full border-border/50 text-muted-foreground"
                      >
                        Updated weekly
                      </Badge>
                    </div>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="grid gap-4 p-6 sm:grid-cols-2">
                      {isSearching ? (
                        Array.from({ length: 6 }).map((_, index) => (
                          <div
                            key={index}
                            className="flex gap-4 rounded-2xl border border-border/40 bg-muted/40 p-4"
                          >
                            <div className="h-28 w-48 animate-pulse rounded-xl bg-muted" />
                            <div className="flex flex-1 flex-col gap-4">
                              <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
                              <div className="h-4 w-full animate-pulse rounded bg-muted/80" />
                              <div className="flex gap-3">
                                <div className="h-4 w-24 animate-pulse rounded bg-muted/70" />
                                <div className="h-4 w-16 animate-pulse rounded bg-muted/60" />
                              </div>
                            </div>
                          </div>
                        ))
                      ) : videoResults.length > 0 ? (
                        videoResults.map((video) => (
                          <div
                            key={video.id}
                            className="group flex flex-col overflow-hidden rounded-3xl border border-border/40 bg-background/95 shadow-sm transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg"
                          >
                            <div className="relative h-48 w-full overflow-hidden">
                              <img
                                src={video.thumbnail_url}
                                alt={video.title}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                              />
                              {video.duration && (
                                <span className="absolute bottom-3 right-3 rounded bg-black/70 px-2 py-0.5 text-xs font-medium text-white">
                                  {video.duration}
                                </span>
                              )}
                              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                            </div>
                            <div className="flex flex-1 flex-col gap-4 p-6">
                              <div className="flex items-start justify-between gap-3">
                                <h3 className="text-lg font-semibold leading-tight text-foreground">
                                  {video.title}
                                </h3>
                                <a
                                  href={video.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition hover:border-primary/50 hover:text-primary"
                                  aria-label="Open video in a new tab"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </div>
                              {video.description && (
                                <p className="line-clamp-3 text-sm text-muted-foreground/90">
                                  {video.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                {video.channel && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-3 py-1">
                                    <Play className="h-3 w-3" />
                                    {video.channel}
                                  </span>
                                )}
                                {video.published_at && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-3 py-1">
                                    <Calendar className="h-3 w-3" />
                                    {new Date(video.published_at).toLocaleDateString()}
                                  </span>
                                )}
                                {video.views && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 px-3 py-1">
                                    <Clock className="h-3 w-3" />
                                    {new Intl.NumberFormat().format(video.views)} views
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-1 flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/70 bg-muted/20 p-12 text-center text-muted-foreground sm:col-span-2">
                          <Video className="h-12 w-12 text-primary/70" />
                          <div>
                            <p className="text-lg font-medium text-foreground">
                              No videos yet for "{videoQuery}"
                            </p>
                            <p className="text-sm">
                              Try a different phrase or explore one of the suggested prompts.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                <div className="flex flex-col gap-3 rounded-3xl border border-primary/20 bg-primary/10 px-5 py-4 text-sm text-primary md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3 text-primary/90">
                    <MessageSquare className="h-4 w-4" />
                    <p>
                      Pair these clips with real-time chat — ask follow-ups inside{" "}
                      <span className="font-semibold text-primary">Chat & Voice</span>.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="rounded-2xl border-primary/50 text-primary hover:bg-primary/10"
                    onClick={() => {
                      setDialogOpen(false);
                      window.dispatchEvent(
                        new CustomEvent("open-ai-trainer", {
                          detail: { prompt: "Show me tutorial videos" },
                        })
                      );
                    }}
                  >
                    Open assistant
                  </Button>
                </div>
              </div>
            </div>
          ) : (
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
