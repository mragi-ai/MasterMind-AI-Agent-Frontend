import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
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
  Play,
  Clock,
  GraduationCap,
  ChevronDown,
  X,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { apiClient } from "@/lib/api/client";

// Video types based on API response
type VideoTimestamp = {
  time: string;
  label: string;
};

type VideoModuleInfo = {
  module_number: string;
  module_name: string;
  course_name: string;
};

type ModuleVideo = {
  id: string;
  _id?: string;
  title: string;
  description?: string;
  youtube_url: string;
  thumbnail_url?: string;
  duration?: string;
  tags?: string[];
  target_role?: string[];
  timestamps?: VideoTimestamp[];
  module_info: VideoModuleInfo;
  model_id: string;
  status?: string;
  created_at: string;
  updated_at: string;
};

type VideoModule = {
  module_number: string;
  module_name: string;
  course_name: string;
  videos: ModuleVideo[];
  isLoading?: boolean;
  isLoaded?: boolean;
};

// API response types
type PaginatedVideosResponse = {
  videos: ModuleVideo[];
  pagination: {
    page: number;
    limit: number;
    total_count: number;
    total_pages: number;
  };
};

type ModuleVideosResponse = {
  model_id: string;
  count: number;
  videos: ModuleVideo[];
};

// Helper to extract YouTube video ID from various URL formats
const extractYouTubeId = (url: string): string | null => {
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

// Helper to get thumbnail from YouTube URL - always constructs a valid YouTube thumbnail URL
const getThumbnailUrl = (youtubeUrl: string, providedThumbnail?: string): string => {
  // First, try to extract video ID from the youtube URL
  let videoId = extractYouTubeId(youtubeUrl);
  
  // If we couldn't get it from youtube URL, try the provided thumbnail URL
  if (!videoId && providedThumbnail) {
    videoId = extractYouTubeId(providedThumbnail);
  }
  
  // If we have a valid video ID, construct the proper thumbnail URL
  if (videoId) {
    // Use hqdefault for better quality (480x360), fallback to mqdefault (320x180)
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  }
  
  // Check if providedThumbnail is a valid non-YouTube URL
  if (providedThumbnail && 
      !providedThumbnail.includes("youtube.com") && 
      !providedThumbnail.includes("ytimg.com") &&
      providedThumbnail.startsWith("http")) {
    return providedThumbnail;
  }
  
  // Return a placeholder gradient as fallback
  return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='180' viewBox='0 0 320 180'%3E%3Crect fill='%23374151' width='320' height='180'/%3E%3Ctext fill='%239CA3AF' font-family='sans-serif' font-size='14' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EVideo%3C/text%3E%3C/svg%3E";
};

// Helper to get video type icon and label
const getVideoTypeInfo = (video: ModuleVideo) => {
  const title = video.title?.toLowerCase() || "";
  if (title.includes("reading") || title.includes("overview")) {
    return { icon: BookOpen, label: "Reading", duration: video.duration || "5 min" };
  }
  if (title.includes("dialogue") || title.includes("coach")) {
    return { icon: MessageSquare, label: "Dialogue", duration: video.duration || "15 min" };
  }
  if (title.includes("activity") || title.includes("practice")) {
    return { icon: FileText, label: "Practice Assignment", duration: null };
  }
  return { icon: VideoIcon, label: "Video", duration: video.duration || "3 min" };
};

// Parse duration string to a friendly format
const formatDuration = (duration?: string): string => {
  if (!duration) return "";
  // Handle formats like "00:06:55" or "6:55"
  const parts = duration.split(":").map(Number);
  if (parts.length === 3) {
    const [hours, minutes] = parts;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes} min`;
  }
  if (parts.length === 2) {
    const [minutes] = parts;
    return `${minutes} min`;
  }
  return duration;
};

export default function PopularVideosSection() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [videos, setVideos] = useState<ModuleVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<ModuleVideo | null>(null);
  const [completedVideos, setCompletedVideos] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  // Helper to get video ID (handles both id and _id from API)
  const getVideoId = (video: ModuleVideo): string => {
    return video.id || video._id || "";
  };

  // Fetch all videos from API with pagination
  const fetchAllVideos = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // First fetch to get pagination info
      const firstResponse = await apiClient.get<PaginatedVideosResponse>("/videos");
      const { videos: firstPageVideos, pagination } = firstResponse.data;
      
      let allVideos = [...firstPageVideos];
      
      // Fetch remaining pages if there are more
      if (pagination && pagination.total_pages > 1) {
        const pagePromises = [];
        for (let page = 2; page <= pagination.total_pages; page++) {
          pagePromises.push(
            apiClient.get<PaginatedVideosResponse>("/videos", {
              params: { page, limit: pagination.limit }
            })
          );
        }
        
        const pageResponses = await Promise.all(pagePromises);
        pageResponses.forEach(response => {
          if (response.data?.videos) {
            allVideos = [...allVideos, ...response.data.videos];
          }
        });
      }
      
      console.log(`Fetched ${allVideos.length} videos total`);
      setVideos(allVideos);
      
    } catch (err: any) {
      console.error("Failed to fetch videos:", err);
      setError("Failed to load videos. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // State to track loaded module details
  const [loadedModules, setLoadedModules] = useState<Set<string>>(new Set());
  const [moduleVideosMap, setModuleVideosMap] = useState<Map<string, ModuleVideo[]>>(new Map());
  const [loadingModules, setLoadingModules] = useState<Set<string>>(new Set());

  // Fetch detailed videos by module/model ID
  const fetchVideosByModuleId = async (modelId: string): Promise<ModuleVideo[]> => {
    try {
      console.log(`Fetching detailed videos for module/model: ${modelId}`);
      const response = await apiClient.get<ModuleVideosResponse>(`/videos/${modelId}`);
      console.log(`Module ${modelId} response:`, response.data);
      
      if (response.data?.videos) {
        return response.data.videos;
      }
      return [];
    } catch (err) {
      console.error(`Failed to fetch videos for module ${modelId}:`, err);
      return [];
    }
  };

  // Fetch video details by module ID (legacy - for single video detail)
  const fetchVideoByModule = async (moduleId: string): Promise<ModuleVideo | null> => {
    try {
      const response = await apiClient.get(`/videos/${moduleId}`);
      if (response.data?.videos && response.data.videos.length > 0) {
        return response.data.videos[0];
      }
      return response.data;
    } catch (err) {
      console.error(`Failed to fetch video for module ${moduleId}:`, err);
      return null;
    }
  };

  // Handle accordion expansion - fetch module videos when expanded
  const handleAccordionChange = async (values: string[]) => {
    setExpandedModules(values);
    
    // Find newly expanded modules
    for (const value of values) {
      const moduleNumber = value.replace("module-", "");
      
      // Check if we already loaded this module's detailed videos
      if (!loadedModules.has(moduleNumber) && !loadingModules.has(moduleNumber)) {
        setLoadingModules(prev => new Set(prev).add(moduleNumber));
        
        // Fetch detailed videos for this module
        const detailedVideos = await fetchVideosByModuleId(moduleNumber);
        
        if (detailedVideos.length > 0) {
          setModuleVideosMap(prev => {
            const newMap = new Map(prev);
            newMap.set(moduleNumber, detailedVideos);
            return newMap;
          });
        }
        
        setLoadedModules(prev => new Set(prev).add(moduleNumber));
        setLoadingModules(prev => {
          const newSet = new Set(prev);
          newSet.delete(moduleNumber);
          return newSet;
        });
      }
    }
  };

  // Group videos by module - using model_id for module grouping
  const modules = useMemo(() => {
    const moduleMap = new Map<string, VideoModule>();

    videos.forEach((video) => {
      if (!video.module_info) return;

      // Use model_id as the module key since the API uses model_id for fetching module videos
      const moduleKey = video.model_id || video.module_info.module_number;
      if (!moduleMap.has(moduleKey)) {
        moduleMap.set(moduleKey, {
          module_number: moduleKey,
          module_name: video.module_info.module_name,
          course_name: video.module_info.course_name,
          videos: [],
          isLoading: loadingModules.has(moduleKey),
          isLoaded: loadedModules.has(moduleKey),
        });
      }
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

    // Replace with detailed videos if loaded
    sortedModules.forEach((module) => {
      const detailedVideos = moduleVideosMap.get(module.module_number);
      if (detailedVideos && detailedVideos.length > 0) {
        module.videos = detailedVideos.map(v => ({
          ...v,
          id: getVideoId(v),
        }));
      }
      
      module.videos.sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      
      module.isLoading = loadingModules.has(module.module_number);
      module.isLoaded = loadedModules.has(module.module_number);
    });

    return sortedModules;
  }, [videos, moduleVideosMap, loadingModules, loadedModules]);

  // Calculate progress
  const totalVideos = videos.length;
  const completedCount = completedVideos.size;
  const progressPercent = totalVideos > 0 ? Math.round((completedCount / totalVideos) * 100) : 0;

  // Load videos on mount
  useEffect(() => {
    fetchAllVideos();
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

  const handleVideoSelect = async (video: ModuleVideo) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
    
    // Optionally fetch detailed video info
    if (video.model_id) {
      const detailedVideo = await fetchVideoByModule(video.model_id);
      if (detailedVideo) {
        setSelectedVideo((prev) => ({ ...prev, ...detailedVideo }));
      }
    }
    
    // Mark as completed after selection
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
    const currentVideoIndex = currentModule.videos.findIndex(
      (v) => getVideoId(v) === selectedVideoId
    );

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

  const closeVideoPlayer = () => {
    setShowVideoPlayer(false);
    setSelectedVideo(null);
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
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className={`p-10 shadow-lg border-2 overflow-hidden relative ${
          theme === "dark" 
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700" 
            : "bg-gradient-to-br from-white via-primary/2 to-accent/2 border-gray-200"
        }`}>
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading video modules...</p>
          </div>
        </Card>
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <Card className={`p-10 shadow-lg border-2 overflow-hidden relative ${
          theme === "dark" 
            ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700" 
            : "bg-gradient-to-br from-white via-primary/2 to-accent/2 border-gray-200"
        }`}>
          <div className="flex flex-col items-center gap-4 text-center py-12">
            <p className="text-lg font-medium text-destructive">{error}</p>
            <Button onClick={fetchAllVideos}>Try Again</Button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <Card className={`p-6 md:p-10 shadow-lg border-2 overflow-hidden relative ${
        theme === "dark" 
          ? "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700" 
          : "bg-gradient-to-br from-white via-primary/2 to-accent/2 border-gray-200"
      }`}>
        {/* Decorative blurs */}
        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 ${
          theme === "dark" ? "bg-primary/5" : "bg-primary/10"
        }`} />
        <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 ${
          theme === "dark" ? "bg-accent/5" : "bg-accent/8"
        }`} />

        <div className="relative">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${theme === "dark" ? "bg-primary/20" : "bg-primary/10"}`}>
                <GraduationCap className="h-6 w-6 text-primary" />
              </div>
              <h2 className={`text-3xl md:text-4xl font-bold ${
                theme === "dark" ? "text-white" : "text-gray-900"
              }`}>
                Training Modules
              </h2>
            </div>
            <p className="text-muted-foreground">
              Explore video lessons organized by module. Click on any module to expand and view its lessons.
            </p>
            
            {/* Progress Bar */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1">
                <Progress value={progressPercent} className="h-2" />
              </div>
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {completedCount}/{totalVideos} completed
              </span>
            </div>
          </div>

          {/* Modules Grid */}
          {modules.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No video modules available</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Accordion
                type="multiple"
                value={expandedModules}
                onValueChange={handleAccordionChange}
                className="space-y-3"
              >
                {modules.map((module) => {
                  const moduleCompletedCount = module.videos.filter((v) =>
                    completedVideos.has(getVideoId(v))
                  ).length;
                  const moduleTotal = module.videos.length;
                  const moduleProgress = moduleTotal > 0 
                    ? Math.round((moduleCompletedCount / moduleTotal) * 100) 
                    : 0;

                  return (
                    <AccordionItem
                      key={module.module_number}
                      value={`module-${module.module_number}`}
                      className={`rounded-xl border overflow-hidden ${
                        theme === "dark"
                          ? "border-gray-700 bg-gray-800/50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <AccordionTrigger className={`px-5 py-4 hover:no-underline transition-colors ${
                        theme === "dark" ? "hover:bg-gray-700/50" : "hover:bg-gray-50"
                      }`}>
                        <div className="flex items-center gap-4 w-full">
                          {/* Module Icon */}
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            moduleProgress === 100
                              ? "bg-green-500/10 text-green-500"
                              : theme === "dark"
                              ? "bg-primary/20 text-primary"
                              : "bg-primary/10 text-primary"
                          }`}>
                            {moduleProgress === 100 ? (
                              <CheckCircle2 className="h-6 w-6" />
                            ) : (
                              <span className="text-xl font-bold">{module.module_number}</span>
                            )}
                          </div>

                          {/* Module Info */}
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium uppercase tracking-wider ${
                                theme === "dark" ? "text-primary/80" : "text-primary"
                              }`}>
                                Module {module.module_number}
                              </span>
                              {moduleProgress === 100 && (
                                <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-xs">
                                  Completed
                                </Badge>
                              )}
                            </div>
                            <h3 className={`text-base md:text-lg font-semibold mt-1 truncate ${
                              theme === "dark" ? "text-white" : "text-gray-900"
                            }`}>
                              {module.module_name}
                            </h3>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {moduleCompletedCount}/{moduleTotal} lessons
                              </span>
                              <div className="flex-1 max-w-32">
                                <Progress value={moduleProgress} className="h-1.5" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </AccordionTrigger>

                      <AccordionContent>
                        <div className={`px-5 pb-4 pt-2 border-t ${
                          theme === "dark" ? "border-gray-700" : "border-gray-100"
                        }`}>
                          {module.isLoading ? (
                            <div className="flex items-center justify-center py-8 gap-3">
                              <Loader2 className="h-5 w-5 animate-spin text-primary" />
                              <span className="text-sm text-muted-foreground">Loading module videos...</span>
                            </div>
                          ) : module.videos.length === 0 ? (
                            <div className="text-center py-8">
                              <p className="text-sm text-muted-foreground">No videos available for this module</p>
                            </div>
                          ) : (
                          <div className="space-y-2">
                            {module.videos.map((video, videoIndex) => {
                              const videoId = getVideoId(video);
                              const isCompleted = completedVideos.has(videoId);
                              const isSelected = selectedVideo 
                                ? getVideoId(selectedVideo) === videoId 
                                : false;
                              const typeInfo = getVideoTypeInfo(video);
                              const TypeIcon = typeInfo.icon;

                              return (
                                <button
                                  key={videoId}
                                  onClick={() => handleVideoSelect(video)}
                                  className={`group flex items-start gap-4 w-full rounded-lg p-3 text-left transition-all duration-200 ${
                                    isSelected
                                      ? theme === "dark"
                                        ? "bg-primary/20 border-l-4 border-primary"
                                        : "bg-blue-50 border-l-4 border-blue-600"
                                      : theme === "dark"
                                      ? "hover:bg-gray-700/50"
                                      : "hover:bg-gray-50"
                                  }`}
                                >
                                  {/* Completion Status */}
                                  <div className="mt-1 flex-shrink-0">
                                    {isCompleted ? (
                                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : (
                                      <Circle className={`h-5 w-5 ${
                                        isSelected ? "text-primary" : "text-muted-foreground"
                                      }`} />
                                    )}
                                  </div>

                                  {/* Video Thumbnail */}
                                  <div className="relative w-24 h-14 rounded-md overflow-hidden flex-shrink-0">
                                    {/* Fallback background with play icon (shows when image fails) */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-500 to-gray-700 z-0">
                                      <Play className="h-5 w-5 text-white/60" fill="currentColor" />
                                    </div>
                                    {/* Actual thumbnail image */}
                                    <img
                                      src={getThumbnailUrl(video.youtube_url, video.thumbnail_url)}
                                      alt={video.title}
                                      className="absolute inset-0 w-full h-full object-cover z-[1]"
                                      loading="lazy"
                                      onError={(e) => {
                                        const img = e.target as HTMLImageElement;
                                        const videoId = extractYouTubeId(video.youtube_url);
                                        if (videoId) {
                                          // Try different YouTube thumbnail qualities
                                          if (img.src.includes("hqdefault")) {
                                            img.src = `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
                                          } else if (img.src.includes("mqdefault")) {
                                            img.src = `https://img.youtube.com/vi/${videoId}/default.jpg`;
                                          } else if (!img.src.includes("default.jpg")) {
                                            img.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                                          } else {
                                            // All attempts failed, hide the image to show fallback
                                            img.style.opacity = "0";
                                          }
                                        } else {
                                          img.style.opacity = "0";
                                        }
                                      }}
                                    />
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-[2]">
                                      <Play className="h-6 w-6 text-white" fill="white" />
                                    </div>
                                  </div>

                                  {/* Video Info */}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium leading-tight line-clamp-2 ${
                                      isSelected 
                                        ? "text-primary" 
                                        : theme === "dark" 
                                        ? "text-white" 
                                        : "text-gray-900"
                                    }`}>
                                      {video.title?.replace(" - Video", "").replace(" - Reading", "")}
                                    </p>
                                    <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground">
                                      <TypeIcon className="h-3.5 w-3.5" />
                                      <span>{typeInfo.label}</span>
                                      {video.duration && (
                                        <>
                                          <span className="text-muted-foreground/50">|</span>
                                          <Clock className="h-3 w-3" />
                                          <span>{formatDuration(video.duration)}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>

                                  {/* Arrow indicator */}
                                  <ChevronRight className={`h-5 w-5 flex-shrink-0 mt-1 transition-transform ${
                                    isSelected 
                                      ? "text-primary translate-x-1" 
                                      : "text-muted-foreground group-hover:translate-x-1"
                                  }`} />
                                </button>
                              );
                            })}
                          </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}
        </div>
      </Card>

      {/* Video Player Modal */}
      {showVideoPlayer && selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4">
          <div className={`relative w-full max-w-6xl max-h-[98vh] sm:max-h-[95vh] mx-auto rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col ${
            theme === "dark" ? "bg-gray-900" : "bg-white"
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-3 sm:p-4 border-b shrink-0 ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}>
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <div className={`p-1.5 sm:p-2 rounded-lg shrink-0 ${
                  theme === "dark" ? "bg-primary/20" : "bg-primary/10"
                }`}>
                  <VideoIcon className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={`font-semibold text-sm sm:text-base truncate ${
                    theme === "dark" ? "text-white" : "text-gray-900"
                  }`}>
                    {selectedVideo.title?.replace(" - Video", "").replace(" - Reading", "")}
                  </h3>
                  {selectedVideo.module_info && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      Module {selectedVideo.module_info.module_number} | {selectedVideo.module_info.module_name}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={closeVideoPlayer}
                className="rounded-full shrink-0 h-8 w-8 sm:h-10 sm:w-10"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>

            {/* Video Player - Responsive container */}
            <div className="relative w-full bg-black flex-1 min-h-0">
              <div className="relative w-full h-0 pb-[56.25%]">
                <iframe
                  src={getEmbedUrl(selectedVideo.youtube_url)}
                  title={selectedVideo.title}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Coach Section */}
            <div className={`p-3 sm:p-4 border-t shrink-0 ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}>
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`p-1.5 rounded-full shrink-0 ${
                  theme === "dark" ? "bg-primary/20" : "bg-primary/10"
                }`}>
                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                </div>
                <span className="font-medium text-xs sm:text-sm">AI Coach</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">- Need help with this content?</span>
              </div>
            </div>

            {/* Navigation Footer */}
            <div className={`flex items-center justify-between p-3 sm:p-4 border-t shrink-0 gap-2 ${
              theme === "dark" ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"
            }`}>
              <Button variant="outline" size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
                <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Save note</span>
                <span className="sm:hidden">Save</span>
              </Button>
              <Button onClick={handleGoToNextItem} size="sm" className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
                <span className="hidden sm:inline">Go to next item</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
