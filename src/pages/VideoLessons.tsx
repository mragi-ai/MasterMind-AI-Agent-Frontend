import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  X,
  ChevronRight,
  CheckCircle2,
  Circle,
  Video as VideoIcon,
  BookOpen,
  Sparkles,
  MessageSquare,
  FileText,
  Bookmark,
  Loader2,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { getAllVideos, type ModuleVideo, type VideoModule } from "@/lib/api/endpoints/videos";

// Helper to extract YouTube video ID from various URL formats
const extractYouTubeId = (url: string): string | null => {
  if (!url) return null;
  // Handle embed URLs
  const embedMatch = url.match(/youtube\.com\/embed\/([^?&]+)/);
  if (embedMatch) return embedMatch[1];
  // Handle watch URLs
  const watchMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?]+)/);
  if (watchMatch) return watchMatch[1];
  return null;
};

// Helper to convert YouTube URL to embed URL
const getEmbedUrl = (url: string): string => {
  const videoId = extractYouTubeId(url);
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`;
  }
  return url;
};

// Helper to get video type icon and label
const getVideoTypeInfo = (video: ModuleVideo) => {
  const title = video.title?.toLowerCase() || "";
  if (title.includes("reading") || title.includes("overview")) {
    return { icon: BookOpen, label: "Reading", duration: "5 min" };
  }
  if (title.includes("dialogue") || title.includes("coach")) {
    return { icon: MessageSquare, label: "Dialogue", duration: "15 min" };
  }
  if (title.includes("activity") || title.includes("practice")) {
    return { icon: FileText, label: "Practice Assignment", duration: null };
  }
  return { icon: VideoIcon, label: "Video", duration: video.duration || "3 min" };
};

export default function VideoLessons() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [videos, setVideos] = useState<ModuleVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<ModuleVideo | null>(null);
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<string[]>([]);

  // Helper to get video ID (handles both id and _id from API)
  const getVideoId = (video: ModuleVideo): string => {
    return video.id || video._id || '';
  };

  // Group videos by module
  const modules = useMemo(() => {
    const moduleMap = new Map<string, VideoModule>();

    videos.forEach((video) => {
      if (!video.module_info) return;

      const moduleKey = video.module_info.module_number;
      if (!moduleMap.has(moduleKey)) {
        moduleMap.set(moduleKey, {
          module_number: video.module_info.module_number,
          module_name: video.module_info.module_name,
          course_name: video.module_info.course_name,
          videos: [],
        });
      }
      // Normalize the video to have an id field
      const normalizedVideo = {
        ...video,
        id: getVideoId(video),
      };
      moduleMap.get(moduleKey)!.videos.push(normalizedVideo);
    });

    // Sort modules by module number and videos by created_at
    const sortedModules = Array.from(moduleMap.values()).sort(
      (a, b) => parseInt(a.module_number) - parseInt(b.module_number)
    );

    sortedModules.forEach((module) => {
      module.videos.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    });

    return sortedModules;
  }, [videos]);

  // Calculate progress
  const totalVideos = videos.length;
  const completedCount = completedVideos.size;
  const progressPercent = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;

  // Load videos on mount
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setIsLoading(true);
        const response = await getAllVideos();
        if (response?.videos) {
          setVideos(response.videos as ModuleVideo[]);
          // Auto-select first video and expand first module
          if (response.videos.length > 0) {
            const firstVideo = response.videos[0] as ModuleVideo;
            setSelectedVideo(firstVideo);
            if (firstVideo.module_info?.module_number) {
              setExpandedModules([`module-${firstVideo.module_info.module_number}`]);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch videos:", err);
        setError("Failed to load videos. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVideos();
  }, []);

  // Load completed videos from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("completed-videos");
    if (stored) {
      try {
        setCompletedVideos(new Set(JSON.parse(stored)));
      } catch (e) {
        console.error("Failed to parse completed videos:", e);
      }
    }
  }, []);

  // Save completed videos to localStorage
  const markAsCompleted = (videoId: string) => {
    setCompletedVideos((prev) => {
      const newSet = new Set(prev);
      newSet.add(videoId);
      localStorage.setItem("completed-videos", JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const handleVideoSelect = (video: ModuleVideo) => {
    setSelectedVideo(video);
    // Mark as completed after selection (simulating watch)
    const videoId = getVideoId(video);
    if (videoId) {
      setTimeout(() => markAsCompleted(videoId), 1000);
    }
  };

  const handleGoToNextItem = () => {
    if (!selectedVideo) return;

    const currentModuleIndex = modules.findIndex(
      (m) => m.module_number === selectedVideo.module_info?.module_number
    );
    if (currentModuleIndex === -1) return;

    const selectedVideoId = getVideoId(selectedVideo);
    const currentModule = modules[currentModuleIndex];
    const currentVideoIndex = currentModule.videos.findIndex((v) => getVideoId(v) === selectedVideoId);

    // Try next video in current module
    if (currentVideoIndex < currentModule.videos.length - 1) {
      handleVideoSelect(currentModule.videos[currentVideoIndex + 1]);
      return;
    }

    // Try first video of next module
    if (currentModuleIndex < modules.length - 1) {
      const nextModule = modules[currentModuleIndex + 1];
      if (nextModule.videos.length > 0) {
        handleVideoSelect(nextModule.videos[0]);
        setExpandedModules((prev) => [...prev, `module-${nextModule.module_number}`]);
      }
    }
  };

  // Coach action buttons
  const coachActions = [
    { icon: Sparkles, label: "Give me practice questions", action: () => navigate("/demo-chat") },
    { icon: BookOpen, label: "Explain this topic in simple terms", action: () => navigate("/demo-chat") },
    { icon: FileText, label: "Give me a summary", action: () => navigate("/demo-chat") },
    { icon: MessageSquare, label: "Give me real-life examples", action: () => navigate("/demo-chat") },
  ];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading video lessons...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-lg font-medium text-destructive">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0a0a0a]' : 'bg-gray-50'}`}>
      {/* Top Navigation Bar */}
      <header className={`sticky top-0 z-50 border-b ${theme === 'dark' ? 'border-border/40 bg-background/95' : 'border-gray-200 bg-white'} backdrop-blur-sm`}>
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-primary">Evans Logistics Training</h1>
            <span className="hidden text-sm text-muted-foreground sm:inline">|</span>
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {modules[0]?.course_name || "Training Course"}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress indicator */}
            <div className="hidden items-center gap-3 sm:flex">
              <span className="text-sm text-muted-foreground">
                {completedCount}/{totalVideos} learning items
              </span>
              <Progress value={progressPercent} className="w-32 h-2" />
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => navigate("/dashboard")}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Sidebar - Module Navigation */}
        <aside className={`hidden w-80 flex-shrink-0 border-r lg:block ${theme === 'dark' ? 'border-border/40 bg-background/50' : 'border-gray-200 bg-white'}`}>
          <div className="flex h-full flex-col">
            {/* Course Title */}
            <div className={`border-b p-4 ${theme === 'dark' ? 'border-border/40' : 'border-gray-200'}`}>
              <h2 className="text-lg font-semibold text-primary">
                {modules[0]?.course_name || "Video Lessons"}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/dashboard")}
              >
                <X className="h-4 w-4" />
                Close Course
              </Button>
            </div>

            {/* Module List */}
            <ScrollArea className="flex-1">
              <Accordion
                type="multiple"
                value={expandedModules}
                onValueChange={setExpandedModules}
                className="px-2 py-2"
              >
                {modules.map((module) => {
                  const moduleCompletedCount = module.videos.filter((v) =>
                    completedVideos.has(getVideoId(v))
                  ).length;
                  const moduleTotal = module.videos.length;

                  return (
                    <AccordionItem
                      key={module.module_number}
                      value={`module-${module.module_number}`}
                      className={`border-b-0 rounded-lg mb-1 ${theme === 'dark' ? 'hover:bg-muted/30' : 'hover:bg-gray-100'}`}
                    >
                      <AccordionTrigger className="px-3 py-3 hover:no-underline">
                        <div className="flex flex-col items-start gap-1 text-left">
                          <span className="text-xs font-medium text-muted-foreground">
                            Module {module.module_number}
                          </span>
                          <span className="text-sm font-medium leading-tight">
                            {module.module_name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {moduleCompletedCount}/{moduleTotal} completed
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-2">
                        <div className="space-y-1 pl-2">
                          {module.videos.map((video) => {
                            const videoId = getVideoId(video);
                            const isCompleted = completedVideos.has(videoId);
                            const isSelected = selectedVideo ? getVideoId(selectedVideo) === videoId : false;
                            const typeInfo = getVideoTypeInfo(video);
                            const TypeIcon = typeInfo.icon;

                            return (
                              <button
                                key={videoId}
                                onClick={() => handleVideoSelect(video)}
                                className={`group flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors ${
                                  isSelected
                                    ? theme === 'dark'
                                      ? 'bg-primary/20 border-l-2 border-primary'
                                      : 'bg-blue-50 border-l-2 border-blue-600'
                                    : theme === 'dark'
                                    ? 'hover:bg-muted/50'
                                    : 'hover:bg-gray-100'
                                }`}
                              >
                                <div className="mt-0.5">
                                  {isCompleted ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <Circle className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium leading-tight ${isSelected ? 'text-primary' : ''}`}>
                                    {video.title?.replace(' - Video', '').replace(' - Reading', '')}
                                  </p>
                                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                    <TypeIcon className="h-3 w-3" />
                                    <span>{typeInfo.label}</span>
                                    {typeInfo.duration && (
                                      <>
                                        <span>•</span>
                                        <span>{typeInfo.duration}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </ScrollArea>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl p-4 lg:p-8">
            {selectedVideo ? (
              <div className="space-y-6">
                {/* Video Player */}
                <div className={`overflow-hidden rounded-2xl border shadow-lg ${theme === 'dark' ? 'border-border/50 bg-background' : 'border-gray-200 bg-white'}`}>
                  <div className="relative aspect-video w-full bg-black">
                    <iframe
                      src={getEmbedUrl(selectedVideo.youtube_url)}
                      title={selectedVideo.title}
                      className="absolute inset-0 h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>

                {/* Video Title & Actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold">
                      {selectedVideo.title?.replace(' - Video', '').replace(' - Reading', '')}
                    </h2>
                    {selectedVideo.module_info && (
                      <p className="text-sm text-muted-foreground">
                        Module {selectedVideo.module_info.module_number} • {selectedVideo.module_info.module_name}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="gap-2">
                      <Bookmark className="h-4 w-4" />
                      Save note
                    </Button>
                  </div>
                </div>

                {/* Coach Section */}
                <div className={`rounded-xl border p-4 ${theme === 'dark' ? 'border-border/50 bg-muted/30' : 'border-gray-200 bg-gray-50'}`}>
                  <Accordion type="single" collapsible defaultValue="coach">
                    <AccordionItem value="coach" className="border-0">
                      <AccordionTrigger className="py-2 hover:no-underline">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                            <Sparkles className="h-4 w-4 text-primary" />
                          </div>
                          <span className="font-semibold">coach</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pt-2">
                          <p className="text-sm text-muted-foreground">
                            Let me know if you have any questions about this material. I'm here to help!
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {coachActions.map((action, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="gap-2 rounded-full"
                                onClick={action.action}
                              >
                                <action.icon className="h-4 w-4 text-primary" />
                                {action.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>

                {/* Tabs Section */}
                <div className={`rounded-xl border ${theme === 'dark' ? 'border-border/50 bg-background' : 'border-gray-200 bg-white'}`}>
                  <div className="flex border-b border-border/50">
                    <button className="px-6 py-3 text-sm font-medium border-b-2 border-primary text-primary">
                      Transcript
                    </button>
                    <button className="px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
                      Notes
                    </button>
                    <button className="px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground">
                      Downloads
                    </button>
                  </div>
                  <div className="p-4">
                    {selectedVideo.timestamps && selectedVideo.timestamps.length > 0 ? (
                      <div className="space-y-2">
                        {selectedVideo.timestamps.map((timestamp, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/50 cursor-pointer"
                          >
                            <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                              {timestamp.time}
                            </Badge>
                            <span className="text-sm">{timestamp.label}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Transcript will be available after the video loads.
                      </p>
                    )}
                  </div>
                </div>

                {/* Next Item Button */}
                <div className="flex justify-end">
                  <Button onClick={handleGoToNextItem} className="gap-2">
                    Go to next item
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Video Description */}
                {selectedVideo.description && (
                  <div className={`rounded-xl border p-6 ${theme === 'dark' ? 'border-border/50 bg-background' : 'border-gray-200 bg-white'}`}>
                    <h3 className="mb-3 font-semibold">About this lesson</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                      {selectedVideo.description}
                    </p>
                    {selectedVideo.tags && selectedVideo.tags.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {selectedVideo.tags.slice(0, 5).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
                <VideoIcon className="h-16 w-16 text-muted-foreground/50" />
                <div>
                  <p className="text-lg font-medium">No video selected</p>
                  <p className="text-sm text-muted-foreground">
                    Select a video from the sidebar to start learning
                  </p>
                </div>
              </div>
            )}
          </div>
        </main>

        {/* Mobile Module Selector (Bottom Sheet style on small screens) */}
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                Module {selectedVideo?.module_info?.module_number || 1}
              </p>
              <p className="text-xs text-muted-foreground">
                {completedCount}/{totalVideos} completed
              </p>
            </div>
            <Button onClick={handleGoToNextItem} size="sm" className="gap-2">
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
