import { useRef, useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, CheckCircle2, Clock, X, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getAllVideos, getVideoProgress, saveVideoProgress } from "@/lib/api/endpoints/videos";
import { getUser } from "@/lib/auth";

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
  videoDuration?: number; // Duration in seconds
  savedTime?: number; // Saved progress time in seconds
  steps?: Array<{
    title: string;
    description?: string;
    src: string;
    poster?: string;
    startTime?: number; // Start time in seconds for this step
  }>;
};

// Helper function to convert time string (HH:MM:SS) to seconds
function timeToSeconds(timeStr: string): number {
  const parts = timeStr.split(":").map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

// Helper function to convert duration string (HH:MM:SS) to seconds
function durationToSeconds(duration: string): number {
  return timeToSeconds(duration);
}

// Helper to extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  
  // Handle embed URLs: youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) return embedMatch[1];
  
  // Handle watch URLs: youtube.com/watch?v=VIDEO_ID or youtu.be/VIDEO_ID
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (watchMatch) return watchMatch[1];
  
  // Handle thumbnail URLs that might contain video ID: img.youtube.com/vi/VIDEO_ID/
  const thumbnailMatch = url.match(/img\.youtube\.com\/vi\/([a-zA-Z0-9_-]{11})/);
  if (thumbnailMatch) return thumbnailMatch[1];
  
  // Fallback: try to find any 11-character alphanumeric string that looks like a video ID
  const genericMatch = url.match(/[?&/]([a-zA-Z0-9_-]{11})(?:[?&/]|$)/);
  if (genericMatch) return genericMatch[1];
  
  return null;
}

// Helper to get a valid thumbnail URL from YouTube URL
function getValidThumbnailUrl(youtubeUrl: string, providedThumbnail?: string): string {
  // First, try to extract video ID from the youtube URL
  let videoId = extractYouTubeId(youtubeUrl);
  
  // If we couldn't get it from youtube URL, try the provided thumbnail URL
  if (!videoId && providedThumbnail) {
    videoId = extractYouTubeId(providedThumbnail);
  }
  
  // If we have a valid video ID, construct the proper thumbnail URL
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  
  // Check if providedThumbnail is a valid non-YouTube URL
  if (providedThumbnail && 
      !providedThumbnail.includes("youtube.com") && 
      !providedThumbnail.includes("ytimg.com") &&
      providedThumbnail.startsWith("http")) {
    return providedThumbnail;
  }
  
  // Return empty string - will show fallback in UI
  return "";
}

export default function TopicsShowcase() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const progressSaveTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const topicsRef = useRef<Topic[]>([]);
  const activeTopicRef = useRef<Topic | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    topicsRef.current = topics;
  }, [topics]);

  useEffect(() => {
    activeTopicRef.current = activeTopic;
  }, [activeTopic]);

  // Function to process videos and map to Topic format
  const processVideos = async (response: Awaited<ReturnType<typeof getAllVideos>>) => {
    const user = getUser<{ user_id?: string }>();
    const userId = user?.user_id || "";
    console.log("User ID:", userId);

    // Handle different response structures
    const videos = response.videos || (Array.isArray(response) ? response : []);
    console.log(`Processing ${videos.length} videos`);

    // Fetch progress for each video
    const topicsWithProgress = await Promise.all(
      videos.map(async (video) => {
        console.log("Processing video:", video._id, video.title);
        let progress = 0;
        let savedTime = 0;

        const youtubeUrl = video.youtube_url || "";

        if (userId && youtubeUrl) {
          try {
            const progressData = await getVideoProgress(userId, youtubeUrl);
            savedTime = progressData.time || 0;
            const totalDuration = durationToSeconds(video.duration || "00:00:00");
            if (totalDuration > 0) {
              progress = Math.round((savedTime / totalDuration) * 100);
            }
          } catch (error) {
            console.error(`Failed to fetch progress for video ${video._id}:`, error);
          }
        }

        // Convert timestamps to steps
        const videoDuration = durationToSeconds(video.duration || "00:00:00");
        const steps =
          video.timestamps && video.timestamps.length > 0
            ? video.timestamps.map((ts, index) => {
              // Extract YouTube video ID and create embed URL
              const youtubeId = youtubeUrl
                ? youtubeUrl.match(
                  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
                )?.[1]
                : null;
              const startTime = timeToSeconds(ts.time || "00:00:00");
              const embedUrl = youtubeId
                ? `https://www.youtube.com/embed/${youtubeId}?start=${startTime}`
                : youtubeUrl || "";

              return {
                title: ts.label || `Step ${index + 1}`,
                description: ts.label || "",
                src: embedUrl,
                poster: video.thumbnail_url || "",
                startTime,
              };
            })
            : [
              {
                title: video.title || "Video",
                description: video.description || "",
                src: youtubeUrl || "",
                poster: video.thumbnail_url || "",
                startTime: 0,
              },
            ];

        const totalSteps = steps.length;
        const completedSteps = Math.round((progress / 100) * totalSteps);

        return {
          id: video._id,
          title: video.title || "Untitled Video",
          description: video.description || "",
          progress,
          totalSteps,
          completedSteps,
          videoThumb: getValidThumbnailUrl(youtubeUrl, video.thumbnail_url),
          videoSrc: youtubeUrl,
          prompt: `Tell me about ${video.title || "this video"}`,
          videoDuration,
          savedTime, // Store the saved time for resuming
          steps,
        } as Topic;
      })
    );

    return topicsWithProgress;
  };

  // Fetch videos from API and map to Topic format
  useEffect(() => {
    async function fetchVideos() {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching videos from API...");
        const response = await getAllVideos();
        console.log("Received videos response:", response);
        console.log("Response structure:", {
          hasResponse: !!response,
          count: response?.count,
          videosLength: response?.videos?.length,
          videosType: typeof response?.videos,
          fullResponse: JSON.stringify(response, null, 2),
        });

        // Check if response is valid
        if (!response) {
          console.error("No response received from API");
          setError("Failed to receive response from the server. Please check your connection.");
          setTopics([]);
          setLoading(false);
          return;
        }

        // Handle different response structures
        const videos = response.videos || (Array.isArray(response) ? response : []);

        if (!videos || videos.length === 0) {
          console.warn("No videos found in API response. Response:", response);
          setError("No videos available at the moment. Please try again later.");
          setTopics([]);
          setLoading(false);
          return;
        }

        console.log(`Found ${videos.length} videos to process`);

        // Create a normalized response object
        const normalizedResponse = {
          ...response,
          videos: videos,
        };

        const topicsWithProgress = await processVideos(normalizedResponse);
        console.log("Successfully processed topics:", topicsWithProgress.length);
        setTopics(topicsWithProgress);
      } catch (error: any) {
        console.error("Failed to fetch videos:", error);
        console.error("Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          stack: error.stack,
        });

        // Set user-friendly error message
        const errorMessage = error.response?.status === 404
          ? "Videos endpoint not found. Please check the API configuration."
          : error.response?.status === 403 || error.response?.status === 401
            ? "Access denied. Please check your authentication."
            : error.message?.includes("Network") || error.code === "ERR_NETWORK"
              ? "Network error. Please check your internet connection."
              : "Failed to load videos. Please try again later.";

        setError(errorMessage);
        setTopics([]);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();

    // Cleanup timers on unmount
    return () => {
      progressSaveTimers.current.forEach((timer) => clearTimeout(timer));
      progressSaveTimers.current.clear();
    };
  }, []);

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

  const handleProgressUpdate = useCallback((id: string, progress: number, currentTime: number) => {
    // Update local state immediately for responsive UI
    setTopics((prev) =>
      prev.map((topic) =>
        topic.id === id
          ? {
            ...topic,
            progress: progress,
            completedSteps: Math.round((progress / 100) * topic.totalSteps),
            savedTime: currentTime, // Update saved time
          }
          : topic
      )
    );

    // Update active topic if it matches
    setActiveTopic((prev) => {
      if (prev?.id === id) {
        return {
          ...prev,
          progress: progress,
          completedSteps: Math.round((progress / 100) * prev.totalSteps),
          savedTime: currentTime, // Update saved time
        };
      }
      return prev;
    });

    // Throttle API calls - clear existing timer and set new one
    const existingTimer = progressSaveTimers.current.get(id);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Save progress to API after 3 seconds of no updates (debounced)
    const timer = setTimeout(async () => {
      // Use refs to get latest state
      const topic = topicsRef.current.find((t) => t.id === id) ||
        (activeTopicRef.current?.id === id ? activeTopicRef.current : null);

      if (topic) {
        const user = getUser<{ user_id?: string }>();
        const userId = user?.user_id;
        if (userId && topic.videoSrc) {
          try {
            await saveVideoProgress({
              userid: userId,
              video: topic.videoSrc,
              time: currentTime,
            });
          } catch (error) {
            console.error("Failed to save video progress:", error);
          }
        }
      }

      progressSaveTimers.current.delete(id);
    }, 3000);

    progressSaveTimers.current.set(id, timer);
  }, []); // Empty deps - we use functional updates to avoid stale closures

  return (
    <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Card className="p-6 md:p-8 shadow-lg border overflow-hidden relative bg-card">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Popular Training Topics
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Continue where you left off or start something new
              </p>
            </div>
            {/* {topics.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                <span>{topics.filter(t => t.progress >= 100).length} of {topics.length} completed</span>
              </div>
            )} */}
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              {/* <p className="text-muted-foreground">Loading videos...</p> */}
              <div className="h-8 w-8 border-4 border-gray-300 border-t-primary rounded-full animate-spin"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive mb-2">{error}</p>
              <Button
                variant="outline"
                onClick={async () => {
                  setError(null);
                  setLoading(true);
                  try {
                    const response = await getAllVideos();
                    if (response?.videos && response.videos.length > 0) {
                      const topicsWithProgress = await processVideos(response);
                      setTopics(topicsWithProgress);
                      setError(null);
                    } else {
                      setError("No videos available");
                    }
                  } catch (err: any) {
                    const errorMessage = err.response?.status === 404
                      ? "Videos endpoint not found. Please check the API configuration."
                      : err.response?.status === 403 || err.response?.status === 401
                        ? "Access denied. Please check your authentication."
                        : err.message?.includes("Network") || err.code === "ERR_NETWORK"
                          ? "Network error. Please check your internet connection."
                          : "Failed to load videos. Please try again later.";
                    setError(errorMessage);
                  } finally {
                    setLoading(false);
                  }
                }}
              >
                Retry
              </Button>
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No videos available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {topics.map((topic) => (
                <TopicCard
                  key={topic.id}
                  topic={topic}
                  onAction={handleStartOrResume}
                  onOpenChat={openChat}
                />
              ))}
            </div>
          )}
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
    <Card 
      className="group overflow-hidden border border-border/60 bg-card hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={() => onAction(topic)}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden bg-muted">
        {/* Fallback */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
          <Play className="h-10 w-10 text-white/20" />
        </div>
        
        {/* Image */}
        {topic.videoThumb && (
          <img
            src={topic.videoThumb}
            alt={topic.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              const videoId = extractYouTubeId(topic.videoSrc);
              if (videoId) {
                if (img.src.includes("hqdefault")) {
                  img.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                } else if (img.src.includes("mqdefault")) {
                  img.src = `https://img.youtube.com/vi/${videoId}/default.jpg`;
                } else if (!img.src.includes("default.jpg")) {
                  img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                } else {
                  img.style.opacity = "0";
                }
              } else {
                img.style.opacity = "0";
              }
            }}
          />
        )}
        
        {/* Dark overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />

        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform duration-300">
            <Play className="h-6 w-6 text-white ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Duration badge */}
        {topic.totalSteps > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/70 text-white text-xs font-medium">
            {topic.totalSteps} {topic.totalSteps === 1 ? 'lesson' : 'lessons'}
          </div>
        )}

        {/* Progress indicator */}
        {topic.progress > 0 && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-black/20">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${topic.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Status badge */}
        {isComplete ? (
          <div className="flex items-center gap-1.5 text-green-600 dark:text-green-500 text-xs font-medium mb-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Completed</span>
          </div>
        ) : isStarted ? (
          <div className="flex items-center gap-1.5 text-primary text-xs font-medium mb-2">
            <Clock className="h-3.5 w-3.5" />
            <span>{topic.progress}% complete</span>
          </div>
        ) : null}

        {/* Title */}
        <h3 className="font-semibold text-base leading-snug line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
          {topic.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {topic.description || "Watch this video to learn more"}
        </p>
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
  onProgressUpdate: (id: string, progress: number, currentTime: number) => void;
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
  // Initialize step index based on saved progress
  const getInitialStepIndex = () => {
    if (!topic.savedTime || topic.savedTime === 0) return 0;

    // Find which step the saved time corresponds to
    for (let i = steps.length - 1; i >= 0; i--) {
      const stepStartTime = steps[i]?.startTime || 0;
      if (topic.savedTime >= stepStartTime) {
        return i;
      }
    }
    return 0;
  };

  const initialStepIndex = getInitialStepIndex();
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStepIndex);

  // For YouTube videos, update the embed URL to start from saved time
  const getYouTubeEmbedUrl = (stepIndex: number, savedTime?: number) => {
    const step = steps[stepIndex];
    if (!step) return "";

    const youtubeId = topic.videoSrc.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    )?.[1];

    if (!youtubeId) return step.src || "";

    // If this is the initial step and we have saved time, use saved time
    // Otherwise use the step's start time
    let startTime = step.startTime || 0;
    if (stepIndex === initialStepIndex && savedTime && savedTime > 0) {
      startTime = savedTime;
    }

    return `https://www.youtube.com/embed/${youtubeId}?start=${Math.floor(startTime)}`;
  };

  const [currentStepPercent, setCurrentStepPercent] = useState(0);
  const isYouTubeVideo = topic.videoSrc.includes("youtube.com") || topic.videoSrc.includes("youtu.be");

  // Store onProgressUpdate in a ref to avoid dependency issues
  const onProgressUpdateRef = useRef(onProgressUpdate);
  useEffect(() => {
    onProgressUpdateRef.current = onProgressUpdate;
  }, [onProgressUpdate]);

  // Resume video from saved progress when it loads
  useEffect(() => {
    if (isYouTubeVideo) {
      // For YouTube videos, we've already set the step index based on saved time
      // The embed URL will start from the saved time
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // If no saved time, start from beginning
    if (!topic.savedTime || topic.savedTime === 0) {
      return;
    }

    // Wait for video metadata to load before setting currentTime
    const handleLoadedMetadata = () => {
      if (video.duration > 0 && topic.savedTime) {
        // For videos with steps, savedTime is absolute time
        // For videos without steps, savedTime is also absolute time
        if (steps.length > 1 && steps[0]?.startTime !== undefined) {
          // Video has steps - find which step and calculate relative time
          let targetStepIndex = 0;
          for (let i = steps.length - 1; i >= 0; i--) {
            const stepStartTime = steps[i]?.startTime || 0;
            if (topic.savedTime >= stepStartTime) {
              targetStepIndex = i;
              break;
            }
          }

          // Set the step index
          setCurrentStepIndex(targetStepIndex);

          // Calculate time within the current step
          const stepStartTime = steps[targetStepIndex]?.startTime || 0;
          const stepTime = topic.savedTime - stepStartTime;

          // Set video time to resume position (relative to step start)
          video.currentTime = Math.max(0, stepTime);

          // Calculate initial progress percentage for the step
          const nextStepTime = steps[targetStepIndex + 1]?.startTime || video.duration;
          const stepDuration = nextStepTime - stepStartTime;
          if (stepDuration > 0) {
            const stepPercent = Math.round((stepTime / stepDuration) * 100);
            setCurrentStepPercent(Math.max(0, Math.min(100, stepPercent)));
          }
        } else {
          // Video without steps - savedTime is direct currentTime
          video.currentTime = Math.min(topic.savedTime, video.duration);
          const percent = video.duration > 0
            ? Math.round((video.currentTime / video.duration) * 100)
            : 0;
          setCurrentStepPercent(percent);
        }
      }
    };

    if (video.readyState >= 1) {
      // Metadata already loaded
      handleLoadedMetadata();
    } else {
      video.addEventListener("loadedmetadata", handleLoadedMetadata);
      return () => {
        video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      };
    }
  }, [isYouTubeVideo, topic.savedTime, topic.id, steps]);

  // progress tracking across steps (only for non-YouTube videos)
  useEffect(() => {
    if (isYouTubeVideo) {
      // For YouTube videos, we track progress based on step completion
      // Only update when step index changes, not on every render
      const currentStep = steps[currentStepIndex];
      const stepStartTime = currentStep?.startTime || 0;
      const videoDuration = topic.videoDuration || 0;

      // Calculate progress: if we're on a step, we've at least reached its start time
      // Estimate that we're halfway through the current step
      const nextStepTime = steps[currentStepIndex + 1]?.startTime || videoDuration;
      const estimatedCurrentTime = stepStartTime + (nextStepTime - stepStartTime) * 0.5;

      const overall = videoDuration > 0
        ? Math.round((estimatedCurrentTime / videoDuration) * 100)
        : Math.round(((currentStepIndex + 1) / steps.length) * 100);

      // Use ref to avoid dependency on onProgressUpdate
      onProgressUpdateRef.current(topic.id, overall, estimatedCurrentTime);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Throttle progress updates to avoid too many API calls
    let lastSaveTime = 0;
    const SAVE_INTERVAL = 5000; // Save every 5 seconds

    const handleTimeUpdate = () => {
      const duration = video.duration || 0;
      if (duration > 0) {
        const percent = Math.max(0, Math.min(100, Math.round((video.currentTime / duration) * 100)));
        setCurrentStepPercent(percent);
        const overall = Math.round(
          ((currentStepIndex + percent / 100) / steps.length) * 100
        );

        // Calculate absolute time for saving
        // For videos with steps, absolute time = step start time + current time in step
        // For videos without steps, absolute time = current time
        const stepStartTime = steps[currentStepIndex]?.startTime || 0;
        const absoluteTime = stepStartTime + video.currentTime;

        // Save progress periodically (throttled to avoid too many API calls)
        const now = Date.now();
        if (now - lastSaveTime >= SAVE_INTERVAL) {
          onProgressUpdateRef.current(topic.id, overall, absoluteTime);
          lastSaveTime = now;
        }
      }
    };

    const handleEnded = () => {
      if (currentStepIndex < steps.length - 1) {
        setCurrentStepIndex((i) => i + 1);
        setCurrentStepPercent(0);
      } else {
        // Save final progress - use absolute time (video duration)
        const duration = video.duration || 0;
        const stepStartTime = steps[currentStepIndex]?.startTime || 0;
        const absoluteTime = stepStartTime + duration;
        onProgressUpdateRef.current(topic.id, 100, absoluteTime);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("ended", handleEnded);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("ended", handleEnded);
    };
  }, [topic.id, currentStepIndex, steps.length, isYouTubeVideo, topic.videoDuration, steps]);

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

  // start closing: pause video, save final progress, set isClosing so animation runs,
  // then when animation completes we'll tell parent to remove component.
  const startClose = async () => {
    const v = videoRef.current;
    if (v && !v.paused) v.pause();

    // Save final progress before closing
    if (!isYouTubeVideo && v) {
      const duration = v.duration || 0;
      const currentTime = v.currentTime || 0;
      const percent = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
      const overall = Math.round(((currentStepIndex + percent / 100) / steps.length) * 100);
      // Calculate absolute time (step start + current time in step)
      const stepStartTime = steps[currentStepIndex]?.startTime || 0;
      const absoluteTime = stepStartTime + currentTime;
      onProgressUpdateRef.current(topic.id, overall, absoluteTime);
    } else if (isYouTubeVideo) {
      // For YouTube, save based on current step's start time
      const step = steps[currentStepIndex];
      const stepStartTime = step?.startTime || 0;
      const videoDuration = topic.videoDuration || 0;
      const overall = videoDuration > 0
        ? Math.round((stepStartTime / videoDuration) * 100)
        : Math.round(((currentStepIndex + 1) / steps.length) * 100);
      onProgressUpdateRef.current(topic.id, overall, stepStartTime);
    }

    setIsClosing(true);
  };

  const goToStep = (index: number) => {
    if (index < 0 || index >= steps.length) return;
    setCurrentStepIndex(index);
    setCurrentStepPercent(0);

    // For YouTube videos, update progress when step changes
    if (isYouTubeVideo) {
      const step = steps[index];
      const stepStartTime = step?.startTime || 0;
      const videoDuration = topic.videoDuration || 0;
      const overall = videoDuration > 0
        ? Math.round((stepStartTime / videoDuration) * 100)
        : Math.round(((index + 1) / steps.length) * 100);
      onProgressUpdateRef.current(topic.id, overall, stepStartTime);
    } else {
      const v = videoRef.current;
      if (v) {
        v.currentTime = 0;
        // allow React to switch src before playing
        setTimeout(() => {
          v.play().catch(() => { });
        }, 0);
      }
    }
  };

  const goNext = () => {
    if (currentStepIndex >= steps.length - 1) {
      // On last step, "Done" button closes the modal
      startClose();
    } else {
      goToStep(currentStepIndex + 1);
    }
  };
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

  // Hide browser scrollbar when modal is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
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
      className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50"
      variants={backdropVariants}
      initial="open"
      animate={isClosing ? "closed" : "open"}
      onClick={startClose} // click on backdrop triggers close
    >
      <motion.div
        ref={containerRef}
        className="relative bg-gradient-to-br from-white via-primary/5 to-accent/5 overflow-hidden shadow-2xl w-screen h-screen max-w-none rounded-none flex flex-col"
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
                    className={`text-sm px-3 py-1.5 rounded-full border transition whitespace-nowrap ${isCurrent
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

          {/* Check if it's a YouTube URL and render iframe, otherwise use video element */}
          {isYouTubeVideo ? (
            <div className="w-full  h-[calc(100vh-260px)] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center rounded-lg overflow-hidden shadow-inner">
              <iframe
                src={getYouTubeEmbedUrl(currentStepIndex, topic.savedTime)}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title={steps[currentStepIndex].title}
                key={`${currentStepIndex}-${topic.savedTime}`} // Force re-render when step or saved time changes
              />
            </div>
          ) : (
            <video
              ref={videoRef}
              src={steps[currentStepIndex].src}
              controls
              autoPlay
              className="w-full max-h-[60vh] sm:max-h-[70vh] md:h-[calc(100vh-260px)] object-contain bg-gradient-to-br from-muted to-muted/50 rounded-lg shadow-inner"
            />
          )}
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
