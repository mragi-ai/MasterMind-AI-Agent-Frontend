import { useRef, useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, CheckCircle2, Clock, X, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Topic = {
  id: string;
  title: string;
  description: string;
  progress: number;
  totalSteps: number;
  completedSteps: number;
  videoThumb: string;
  videoSrc: string;
  prompt: string;
  steps?: Array<{
    title: string;
    description?: string;
    src: string;
    poster?: string;
  }>;
};

const initialTopics: Topic[] = [
  {
    id: "container",
    title: "Container Availability Check",
    description: "Learn the complete process step-by-step",
    progress: 75,
    totalSteps: 8,
    completedSteps: 6,
    videoThumb:
      "https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?w=400&h=225&fit=crop",
    videoSrc:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    prompt: "How do I check container availability?",
    steps: [
      {
        title: "Overview",
        description: "What container availability means",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      },
      {
        title: "Search",
        description: "Find containers in the portal",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      },
      {
        title: "Filters",
        description: "Apply filters and interpret results",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      },
      {
        title: "Booking",
        description: "Book selected containers",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      },
    ],
  },
  {
    id: "billing",
    title: "Billing Dispute Tickets",
    description: "How to create and track disputes",
    progress: 40,
    totalSteps: 6,
    completedSteps: 2,
    videoThumb:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=225&fit=crop",
    videoSrc:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    prompt: "How do I create a billing dispute?",
    steps: [
      {
        title: "Intro",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      },
      {
        title: "Create Ticket",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
      },
      {
        title: "Attach Docs",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      },
    ],
  },
  {
    id: "tracking",
    title: "Last-Mile Driver Tracking",
    description: "Real-time location and updates",
    progress: 100,
    totalSteps: 5,
    completedSteps: 5,
    videoThumb:
      "https://images.unsplash.com/photo-1566933293069-b55c7f326dd4?w=400&h=225&fit=crop",
    videoSrc:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    prompt: "How do I track last-mile drivers?",
    steps: [
      {
        title: "Live Map",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      },
      {
        title: "Notifications",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
      },
      {
        title: "History",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4",
      },
      {
        title: "Export",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
      },
      {
        title: "Alerts",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      },
    ],
  },
  {
    id: "dispatch",
    title: "Dispatch Process Overview",
    description: "Complete workflow guide",
    progress: 0,
    totalSteps: 10,
    completedSteps: 0,
    videoThumb:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400&h=225&fit=crop",
    videoSrc:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    prompt: "Show me the dispatch process",
    steps: [
      {
        title: "Pipeline",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      },
      {
        title: "Assign",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
      },
      {
        title: "Handover",
        src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
      },
    ],
  },
];

export default function TopicsShowcase() {
  const [topics, setTopics] = useState<Topic[]>(initialTopics);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);

  const openChat = (prompt: string) => {
    window.dispatchEvent(
      new CustomEvent("open-ai-trainer", { detail: { prompt } })
    );
  };

  const handleStartOrResume = (topic: Topic) => {
    setActiveTopic(topic);
  };

  // Parent close handler remains simple — popup will request actual removal after animating out
  const handleCloseVideo = () => {
    setActiveTopic(null);
  };

  const handleProgressUpdate = (id: string, progress: number) => {
    setTopics((prev) =>
      prev.map((topic) =>
        topic.id === id
          ? {
              ...topic,
              progress: progress,
              completedSteps: Math.round((progress / 100) * topic.totalSteps),
            }
          : topic
      )
    );
  };

  return (
    <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Card className="p-10 glass-effect shadow-custom-lg border-2 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative">
          <div className="mb-8">
            <h2 className="text-4xl font-bold mb-3 gradient-text">
              Popular Training Topics
            </h2>
            <p className="text-muted-foreground">
              Continue where you left off or start something new
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {topics.map((topic) => (
              <TopicCard
                key={topic.id}
                topic={topic}
                onAction={handleStartOrResume}
                onOpenChat={openChat}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* AnimatePresence + modal */}
      <AnimatePresence>
        {activeTopic && (
          <VideoPopupWithSafeClose
            key={activeTopic.id}
            topic={activeTopic}
            // onCloseRequested will be called by the popup after its closing animation completes
            onCloseRequested={() => handleCloseVideo()}
            onProgressUpdate={handleProgressUpdate}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

function TopicCard({
  topic,
  onAction,
  onOpenChat,
}: {
  topic: Topic;
  onAction: (topic: Topic) => void;
  onOpenChat: (prompt: string) => void;
}) {
  const isComplete = topic.progress >= 100;
  const isStarted = topic.progress > 0 && topic.progress < 100;

  return (
    <Card className="topic-card overflow-hidden hover-lift transition-all duration-300">
      {/* Video thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-black">
        <img
          src={topic.videoThumb}
          alt={topic.title}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Restored circular progress ring */}
        {topic.progress > 0 && (
          <div className="absolute top-3 right-3">
            <div
              className="topic-progress-ring"
              style={{ "--progress": topic.progress } as any}
            >
              <div className="topic-progress-text">{topic.progress}%</div>
            </div>
          </div>
        )}

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-primary/90 backdrop-blur flex items-center justify-center shadow-lg">
            <Play className="h-6 w-6 text-white ml-1" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-semibold text-lg mb-2">{topic.title}</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {topic.description}
        </p>

        {/* Steps */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          {isComplete ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-success font-medium">Completed</span>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4" />
              <span>
                {topic.completedSteps} of {topic.totalSteps} steps
              </span>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1"
            variant={isComplete ? "outline" : "default"}
            onClick={() => onAction(topic)}
          >
            {isComplete ? "Review" : isStarted ? "Resume" : "Start"}
          </Button>
          {/* <Button
            className="flex-1"
            variant="secondary"
            onClick={() => onOpenChat(topic.prompt)}
          >
            Ask AI
          </Button> */}
        </div>
      </div>
    </Card>
  );
}

/* ===========================
   Video Popup WITH SAFE CLOSE
   - local `isClosing` to animate out first
   - calls parent onCloseRequested AFTER animation completes
   - backdrop-click + Escape key support
=========================== */
function VideoPopupWithSafeClose({
  topic,
  onCloseRequested,
  onProgressUpdate,
}: {
  topic: Topic;
  onCloseRequested: () => void;
  onProgressUpdate: (id: string, progress: number) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const steps = (topic.steps && topic.steps.length > 0)
    ? topic.steps
    : [
        {
          title: topic.title,
          description: topic.description,
          src: topic.videoSrc,
          poster: topic.videoThumb,
        },
      ];
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentStepPercent, setCurrentStepPercent] = useState(0);

  // progress tracking across steps
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const duration = video.duration || 0;
      if (duration > 0) {
        const percent = Math.max(0, Math.min(100, Math.round((video.currentTime / duration) * 100)));
        setCurrentStepPercent(percent);
        const overall = Math.round(
          ((currentStepIndex + percent / 100) / steps.length) * 100
        );
        onProgressUpdate(topic.id, overall);
      }
    };

    const handleEnded = () => {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex((i) => i + 1);
        setCurrentStepPercent(0);
      } else {
        onProgressUpdate(topic.id, 100);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [topic.id, currentStepIndex, steps.length, onProgressUpdate]);

  // Notify globally that video steps modal is open/closed
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("video-steps-open"));
    return () => {
      window.dispatchEvent(new CustomEvent("video-steps-close"));
    };
  }, []);

  // Escape key closes (starts closing animation)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        startClose();
      } else if (e.key === "ArrowRight") {
        goNext();
      } else if (e.key === "ArrowLeft") {
        goPrev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // start closing: pause video, set isClosing so animation runs,
  // then when animation completes we'll tell parent to remove component.
  const startClose = () => {
    const v = videoRef.current;
    if (v && !v.paused) v.pause();
    setIsClosing(true);
  };

  const goToStep = (index: number) => {
    if (index < 0 || index >= steps.length) return;
    setCurrentStepIndex(index);
    setCurrentStepPercent(0);
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      // allow React to switch src before playing
      setTimeout(() => {
        v.play().catch(() => {});
      }, 0);
    }
  };

  const goNext = () => goToStep(currentStepIndex + 1);
  const goPrev = () => goToStep(currentStepIndex - 1);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current && containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // noop
    }
  };

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // variants for nice open/close
  const backdropVariants = {
    open: { opacity: 1 },
    closed: { opacity: 0, transition: { duration: 0.18 } },
  };

  const panelVariants = {
    open: { scale: 1, opacity: 1, transition: { duration: 0.18 } },
    closed: { scale: 0.96, opacity: 0, transition: { duration: 0.18 } },
  };

  // when the animation finishes and we are in `closed` state, inform parent to remove component
  const handleAnimationComplete = (definition: string) => {
    if (definition === "closed") {
      // parent will remove the modal from the tree
      onCloseRequested();
    }
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
      variants={backdropVariants}
      initial="open"
      animate={isClosing ? "closed" : "open"}
      onClick={startClose} // click on backdrop triggers close
    >
      <motion.div
        ref={containerRef}
        className="relative bg-white overflow-hidden shadow-2xl w-screen h-screen max-w-none rounded-none flex flex-col"
        variants={panelVariants}
        initial="open"
        animate={isClosing ? "closed" : "open"}
        onClick={(e) => e.stopPropagation()} // prevent backdrop click when clicking inside panel
        onAnimationComplete={handleAnimationComplete}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-background/70 backdrop-blur">
          <div className="min-w-0">
            <h3 className="font-semibold text-base leading-tight truncate">{topic.title}</h3>
            <div className="text-xs text-muted-foreground">Step {currentStepIndex + 1} of {steps.length}</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
              {isFullscreen ? <Minimize2 /> : <Maximize2 />}
            </Button>
            <Button variant="ghost" size="icon" onClick={startClose} aria-label="Close">
              <X />
            </Button>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto">
          {/* Overall Progress */}
          <div className="px-4 pt-4">
            <Progress value={Math.round(((currentStepIndex + currentStepPercent / 100) / steps.length) * 100)} />
          </div>

          {/* Stepper */}
          <div className="px-4 pt-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
              {steps.map((s, i) => {
                const isCurrent = i === currentStepIndex;
                const isDone = i < currentStepIndex || (i === currentStepIndex && currentStepPercent === 100);
                return (
                  <button
                    key={s.title + i}
                    onClick={() => goToStep(i)}
                    className={`text-sm px-3 py-1.5 rounded-full border transition whitespace-nowrap ${
                      isCurrent
                        ? "bg-primary text-white border-primary shadow-sm"
                        : isDone
                        ? "bg-green-50 text-green-700 border-green-300"
                        : "bg-muted/50 text-muted-foreground border-border"
                    }`}
                  >
                    {i + 1}. {s.title}
                  </button>
                );
              })}
            </div>
          </div>

          <video
            ref={videoRef}
            src={steps[currentStepIndex].src}
            controls
            autoPlay
            className="w-full max-h-[60vh] sm:max-h-[70vh] md:h-[calc(100vh-260px)] object-contain bg-black"
          />
        </div>

        <div className="p-4 border-t bg-background/70 backdrop-blur sticky bottom-0">
          <p className="text-sm text-muted-foreground mb-3">
            {steps[currentStepIndex].description || topic.description}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={goPrev} disabled={currentStepIndex === 0}>
              Previous
            </Button>
            <Button
              variant="default"
              onClick={goNext}
              disabled={currentStepIndex >= steps.length - 1}
              className="ml-auto"
            >
              {currentStepIndex >= steps.length - 1 ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
