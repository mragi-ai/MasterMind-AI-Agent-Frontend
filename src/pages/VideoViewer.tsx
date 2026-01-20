import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import VideoPlayer, { type VideoPlayerRef } from "@/components/VideoPlayer";
import TranscriptSearch from "@/components/TranscriptSearch";
import { getVideoDetails, type VideoSearchResult } from "@/lib/api/endpoints/videos";
import useAppStore from "@/zustand";

// Mock transcript data - replace with actual API call
const mockTranscript = [
  {
    text: "Welcome to this comprehensive training session on AI-powered customer service.",
    start: 0,
    duration: 5,
  },
  {
    text: "In today's lesson, we'll cover the essential techniques for handling carrier detention calls.",
    start: 5,
    duration: 6,
  },
  {
    text: "First, let's understand what carrier detention means and why it's important.",
    start: 11,
    duration: 5,
  },
  {
    text: "Carrier detention occurs when a truck driver is delayed at a pickup or delivery location beyond the scheduled time.",
    start: 16,
    duration: 7,
  },
  {
    text: "This can lead to additional charges and impact the carrier's schedule significantly.",
    start: 23,
    duration: 5,
  },
  {
    text: "When a carrier calls about detention, the first step is to acknowledge their concern immediately.",
    start: 28,
    duration: 6,
  },
  {
    text: "Use empathetic language like 'I understand this delay is causing issues for your schedule.'",
    start: 34,
    duration: 6,
  },
  {
    text: "Next, gather all the relevant information: the load number, location, and how long they've been waiting.",
    start: 40,
    duration: 7,
  },
  {
    text: "Document everything in the system as you're speaking with them. This creates a clear record.",
    start: 47,
    duration: 6,
  },
  {
    text: "Then, provide a clear timeline for resolution and set proper expectations.",
    start: 53,
    duration: 5,
  },
  {
    text: "If you need to escalate, explain the process and who will be following up with them.",
    start: 58,
    duration: 6,
  },
  {
    text: "Always end the call by confirming their contact information and summarizing the next steps.",
    start: 64,
    duration: 6,
  },
  {
    text: "Remember, proactive communication can prevent many detention-related issues.",
    start: 70,
    duration: 5,
  },
  {
    text: "Now let's practice with a simulated call scenario.",
    start: 75,
    duration: 4,
  },
];

export default function VideoViewer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedRole = useAppStore((state) => state.selectedRole);

  const videoId = searchParams.get("v");
  const videoUrl = searchParams.get("url");
  const title = searchParams.get("title");

  const [video, setVideo] = useState<VideoSearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef<VideoPlayerRef>(null);

  useEffect(() => {
    const loadVideo = async () => {
      if (!videoId) {
        // If no videoId but we have URL and title, use those
        if (videoUrl && title) {
          setVideo({
            title: decodeURIComponent(title),
            youtube_url: videoUrl,
            thumbnail_url: "",
            video_id: extractVideoId(videoUrl) || "",
            transcript: mockTranscript,
          });
          setIsLoading(false);
        } else {
          setIsLoading(false);
        }
        return;
      }

      try {
        const data = await getVideoDetails(videoId);
        setVideo({
          ...data,
          transcript: data.transcript || mockTranscript, // Use mock if no transcript
        });
      } catch (error) {
        console.error("Failed to load video:", error);
        // Use URL params as fallback
        if (videoUrl && title) {
          setVideo({
            title: decodeURIComponent(title),
            youtube_url: videoUrl,
            thumbnail_url: "",
            video_id: extractVideoId(videoUrl) || "",
            transcript: mockTranscript,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadVideo();
  }, [videoId, videoUrl, title]);

  const extractVideoId = (url: string): string | null => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
  };

  const handleTimestampClick = (timestamp: number) => {
    if (playerRef.current) {
      playerRef.current.jumpToTimestamp(timestamp);
    }
  };

  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!video || !video.video_id) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-lg font-medium text-foreground">Video not found</p>
          <Button onClick={() => navigate("/video-lessons")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Video Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_rgba(10,10,10,0.95))]">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute top-[-15%] left-[10%] h-[26rem] w-[26rem] rounded-full bg-primary/15 blur-3xl animate-float" />
        <div className="absolute bottom-[-20%] right-[8%] h-[30rem] w-[30rem] rounded-full bg-accent/20 blur-3xl animate-float" />
      </div>

      <div className="relative z-10 mx-auto min-h-screen max-w-[1600px] px-4 py-8 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/video-lessons")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
          <div className="flex items-center gap-3">
            <Badge className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-primary">
              {selectedRole?.title ?? "Training"}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="gap-2"
            >
              <a
                href={video.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open in YouTube
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Left Column - Video Player */}
          <div className="space-y-6">
            <div className="rounded-3xl border border-border/50 bg-background/85 p-6 shadow-2xl backdrop-blur-xl">
              <h1 className="mb-6 text-2xl font-semibold leading-tight text-foreground lg:text-3xl">
                {video.title}
              </h1>

              <VideoPlayer
                ref={playerRef}
                videoId={video.video_id}
                onTimeUpdate={handleTimeUpdate}
                initialTimestamp={0}
              />
            </div>

            {/* Video Description */}
            <div className="rounded-2xl border border-border/50 bg-background/80 p-6 backdrop-blur-xl">
              <h3 className="mb-3 text-lg font-semibold text-foreground">About this lesson</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                This training video is part of your personalized learning path. Use the transcript
                search on the right to quickly find specific topics or techniques covered in this
                session. Click any timestamp to jump directly to that section of the video.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="secondary">Interactive</Badge>
                <Badge variant="secondary">Role-Based Training</Badge>
                <Badge variant="secondary">Practice Ready</Badge>
              </div>
            </div>
          </div>

          {/* Right Column - Transcript Search */}
          <div className="rounded-3xl border border-border/50 bg-background/85 p-6 shadow-2xl backdrop-blur-xl lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)]">
            <TranscriptSearch
              videoId={video.video_id}
              transcript={video.transcript}
              onTimestampClick={handleTimestampClick}
              currentTime={currentTime}
            />
          </div>
        </div>

        {/* Related Actions */}
        <div className="mt-8 rounded-2xl border border-border/50 bg-background/80 p-6 backdrop-blur-xl">
          <h3 className="mb-4 text-lg font-semibold text-foreground">
            Ready to practice what you learned?
          </h3>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" className="gap-2" onClick={() => navigate("/demo-chat")}>
              Start Practice Session
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/video-lessons")}>
              Browse More Videos
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

