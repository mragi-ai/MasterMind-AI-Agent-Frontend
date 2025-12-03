import { useEffect, useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Video as VideoIcon,
  Play,
} from "lucide-react";
import useAppStore from "@/zustand";
import { searchVideos, type VideoSearchResult } from "@/lib/api/endpoints/videos";

const DEFAULT_QUERY = "AI training walkthrough";

const trendingQueries = [
  "Carrier detention call simulation",
  "Proactive customer update lesson",
  "Agent coaching huddle replay",
  "Certification prep crash course",
];

export default function VideoLessons() {
  const navigate = useNavigate();
  const selectedRole = useAppStore((state) => state.selectedRole);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<VideoSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performSearch = async (nextQuery: string) => {
    const trimmed = nextQuery.trim();
    if (!trimmed) {
      setError("Enter a topic to explore tailored training videos.");
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const response = await searchVideos(trimmed);
      setResults(response.videos ?? []);
      setHasSearched(true);
    } catch (err) {
      console.error("Video search failed:", err);
      setError("We couldn’t load videos just now. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    void performSearch("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await performSearch(query);
  };

  const handleVideoClick = (video: VideoSearchResult) => {
    const videoId = extractVideoId(video.youtube_url);
    if (videoId) {
      navigate(
        `/video-viewer?v=${videoId}&url=${encodeURIComponent(
          video.youtube_url
        )}&title=${encodeURIComponent(video.title)}`
      );
    }
  };

  const extractVideoId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_rgba(10,10,10,0.95))]">
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute top-[-15%] left-[10%] h-[26rem] w-[26rem] rounded-full bg-primary/15 blur-3xl animate-float" />
        <div className="absolute bottom-[-20%] right-[8%] h-[30rem] w-[30rem] rounded-full bg-accent/20 blur-3xl animate-float" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 pb-20 pt-12 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span className="text-base font-medium text-foreground">Video Lessons Library</span>
          <Button
            variant="secondary"
            size="sm"
            className="rounded-full px-4 text-primary"
            type="button"
          >
            Video Lessons
          </Button>
        </div>

        <header className="space-y-6 rounded-3xl border border-border/50 bg-background/80 p-8 shadow-[0_24px_70px_rgba(15,23,42,0.35)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Badge className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-primary">
              {selectedRole?.title ?? "Training Persona"}
            </Badge>
            <Badge variant="outline" className="rounded-full border-border/60 text-muted-foreground">
              230+ curated walkthroughs
            </Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:items-start">
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Explore cinematic lessons aligned to your role-based journey.
              </h1>
              <p className="text-base text-muted-foreground">
                Search the training library for guided walkthroughs, SOP breakdowns, and scenario
                replays. Pair each clip with live chat simulations to turn lessons into practice.
              </p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">Quick tip</p>
              <p>
                After watching, ask the AI coach to quiz you or launch a follow-up simulation to lock
                in the skill.
              </p>
            </div>
          </div>
        </header>

        <section className="space-y-6 rounded-3xl border border-border/50 bg-background/85 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.3)] backdrop-blur-xl">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/80 p-4 shadow-inner md:flex-row md:items-center md:p-6"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
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

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground">Trending now:</span>
            {trendingQueries.map((item) => (
              <Button
                key={item}
                variant="secondary"
                size="sm"
                className="rounded-full bg-muted hover:bg-muted/80"
                type="button"
                onClick={() => {
                  setQuery(item);
                  void performSearch(item);
                }}
              >
                {item}
              </Button>
            ))}
          </div>

          {error && (
            <p className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-5 rounded-3xl border border-border/60 bg-background/85 shadow-inner backdrop-blur">
            <div className="flex flex-col gap-2 border-b border-border/40 px-6 py-4 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <span>
                {hasSearched
                  ? `${results.length} ${results.length === 1 ? "result" : "results"} found`
                  : "Curated highlights to get you started"}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full border-primary/40 text-primary">
                  Updated weekly
                </Badge>
                <Badge variant="outline" className="rounded-full border-border/50 text-muted-foreground">
                  Watch • Practice • Certify
                </Badge>
              </div>
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
                {isSearching
                  ? Array.from({ length: 6 }).map((_, index) => (
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
                  : results.length > 0
                  ? results.map((video, index) => (
                      <div
                        key={`${video.title}-${index}`}
                        onClick={() => handleVideoClick(video)}
                        className="group flex flex-col overflow-hidden rounded-3xl border border-border/40 bg-background/95 shadow-sm transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg cursor-pointer"
                      >
                        <div className="relative h-48 w-full overflow-hidden">
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/90 text-white shadow-lg backdrop-blur-sm">
                              <Play className="h-8 w-8 ml-1" fill="currentColor" />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-1 flex-col gap-4 p-6">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="text-lg font-semibold leading-tight text-foreground">
                              {video.title}
                            </h3>
                            <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition group-hover:border-primary/50 group-hover:text-primary">
                              <VideoIcon className="h-4 w-4" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary" className="text-xs">
                              Watch with transcript
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  : (
                      <div className="col-span-1 flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/70 bg-muted/20 p-12 text-center text-muted-foreground sm:col-span-2">
                        <VideoIcon className="h-12 w-12 text-primary/70" />
                        <div>
                          <p className="text-lg font-medium text-foreground">
                            No videos yet for "{query}"
                          </p>
                          <p className="text-sm">
                            Try a different phrase or explore one of the suggested prompts.
                          </p>
                        </div>
                      </div>
                    )}
            </div>
          </div>


        </section>
      </div>
    </div>
  );
}

