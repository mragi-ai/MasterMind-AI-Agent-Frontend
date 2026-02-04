import { useState } from "react";
import { 
  Lightbulb, 
  PlayCircle, 
  ListChecks, 
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Target,
  Clock,
  CheckCircle2,
  Info,
  VideoOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  validateAIResponse, 
  GUARDRAIL_MESSAGES,
  type ValidationResult 
} from "@/lib/guardrails";

// ============================================================================
// SECTION CONFIGURATION
// Detailed guidance on structuring each section with goals, timing, and outcomes
// ============================================================================

type SectionConfig = {
  title: string;
  goal: string;
  estimatedTime: string;
  expectedOutcome: string;
  icon: React.ReactNode;
  styles: {
    bg: string;
    border: string;
    icon: string;
    title: string;
    goalBg: string;
  };
};

// Section configurations with goals, timing, and outcomes
const SECTION_CONFIGS: Record<string, SectionConfig> = {
  overview: {
    title: "Summary",
    goal: "Understand the main topic and what you will learn.",
    estimatedTime: "1-2 min read",
    expectedOutcome: "You will know what this topic is about and why it matters.",
    icon: <Lightbulb className="h-5 w-5" />,
    styles: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
      icon: "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400",
      title: "text-blue-900 dark:text-blue-100",
      goalBg: "bg-blue-100/50 dark:bg-blue-900/50",
    },
  },
  video: {
    title: "Video Guide",
    goal: "Watch a short video that shows how to do this task.",
    estimatedTime: "3-5 min watch",
    expectedOutcome: "You will see the steps performed and understand the process.",
    icon: <PlayCircle className="h-5 w-5" />,
    styles: {
      bg: "bg-purple-50 dark:bg-purple-950/30",
      border: "border-purple-200 dark:border-purple-800",
      icon: "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400",
      title: "text-purple-900 dark:text-purple-100",
      goalBg: "bg-purple-100/50 dark:bg-purple-900/50",
    },
  },
  steps: {
    title: "Step-by-Step Instructions",
    goal: "Follow clear steps to complete the task.",
    estimatedTime: "5-10 min to complete",
    expectedOutcome: "You will be able to do this task on your own.",
    icon: <ListChecks className="h-5 w-5" />,
    styles: {
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200 dark:border-green-800",
      icon: "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400",
      title: "text-green-900 dark:text-green-100",
      goalBg: "bg-green-100/50 dark:bg-green-900/50",
    },
  },
  considerations: {
    title: "Key Points to Remember",
    goal: "Review important tips and common mistakes to avoid.",
    estimatedTime: "1-2 min read",
    expectedOutcome: "You will know what to watch out for and how to succeed.",
    icon: <AlertTriangle className="h-5 w-5" />,
    styles: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800",
      icon: "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400",
      title: "text-amber-900 dark:text-amber-100",
      goalBg: "bg-amber-100/50 dark:bg-amber-900/50",
    },
  },
};

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type AnswerCardSection = {
  title: string;
  content: string;
  type: "overview" | "video" | "steps" | "considerations";
  videoUrl?: string;
  videoTitle?: string;
  videoDuration?: string;
  isYoutube?: boolean;
  // Optional custom metadata
  customGoal?: string;
  customTime?: string;
  customOutcome?: string;
};

export type AnswerCardProps = {
  sections: AnswerCardSection[];
  timestamp?: string;
  showMetadata?: boolean; // Show goals, timing, outcomes
};

// ============================================================================
// VIDEO SELECTION LOGIC
// Determines the best video format and display based on URL type
// ============================================================================

type VideoType = "youtube" | "vimeo" | "direct" | "external";

function detectVideoType(url: string): VideoType {
  if (!url) return "external";
  if (/youtube\.com|youtu\.be/i.test(url)) return "youtube";
  if (/vimeo\.com/i.test(url)) return "vimeo";
  if (/\.(mp4|webm|ogg|mov)$/i.test(url)) return "direct";
  return "external";
}

function getYouTubeEmbedUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  return null;
}

function getVimeoEmbedUrl(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match && match[1]) {
    return `https://player.vimeo.com/video/${match[1]}`;
  }
  return null;
}

// ============================================================================
// NEUTRAL LANGUAGE HELPERS
// Non-inventive, clear language for UI labels and steps
// ============================================================================

const UI_LABELS = {
  expand: "Show details",
  collapse: "Hide details",
  openVideo: "Open video in new tab",
  watchVideo: "Watch video",
  readMore: "Read more",
  goal: "Goal",
  time: "Time",
  outcome: "What you will learn",
  responseHeader: "Training Response",
  noContent: "No content available.",
} as const;

// Format step text with neutral, clear language
function formatStepText(stepNumber: number, text: string): string {
  // Remove any existing step numbering
  const cleanText = text.replace(/^(step\s*)?\d+[.:]\s*/i, "").trim();
  return `<strong>Step ${stepNumber}:</strong> ${cleanText}`;
}

// ============================================================================
// CONTENT FORMATTING
// Converts markdown-like content to HTML with neutral language
// ============================================================================

function formatContent(content: string, sectionType: string): string {
  if (!content) return "";
  
  let html = content;
  
  // Convert markdown bold to HTML
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");
  
  // Convert markdown italic to HTML  
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
  html = html.replace(/_(.*?)_/g, "<em>$1</em>");
  
  // Handle numbered steps with neutral language
  if (sectionType === "steps") {
    let stepCounter = 0;
    html = html.replace(/^(\d+)\.\s+(.*)$/gm, (_, __, stepText) => {
      stepCounter++;
      return `<li>${formatStepText(stepCounter, stepText)}</li>`;
    });
    
    // Also handle lines that look like steps but aren't numbered
    html = html.replace(/^[-•]\s+(.*)$/gm, (_, text) => {
      if (!text.includes("<li>")) {
        stepCounter++;
        return `<li>${formatStepText(stepCounter, text)}</li>`;
      }
      return `<li>${text}</li>`;
    });
  } else {
    // Standard bullet points for non-step sections
    html = html.replace(/^\s*[-•]\s+(.*)$/gm, "<li>$1</li>");
    html = html.replace(/^(\d+)\.\s+(.*)$/gm, "<li>$2</li>");
  }
  
  // Wrap consecutive <li> items in appropriate list tags
  html = html.replace(/(<li>[\s\S]*?<\/li>\n?)+/g, (match) => {
    if (sectionType === "steps") {
      return `<ol class="list-decimal space-y-3">${match}</ol>`;
    }
    return `<ul class="list-disc space-y-2">${match}</ul>`;
  });
  
  // Convert line breaks to <br> if not in list
  if (!html.includes("<li>") && !html.includes("<p>")) {
    html = html.replace(/\n/g, "<br />");
  }
  
  return html;
}

// ============================================================================
// FALLBACK MESSAGE COMPONENT
// Displays when video or content is not available (guardrail response)
// ============================================================================

type FallbackMessageProps = {
  title: string;
  message: string;
  type: "info" | "warning" | "error";
};

function FallbackMessage({ title, message, type }: FallbackMessageProps) {
  const styles = {
    info: {
      bg: "bg-blue-50 dark:bg-blue-950/30",
      border: "border-blue-200 dark:border-blue-800",
      icon: "text-blue-600 dark:text-blue-400",
      title: "text-blue-900 dark:text-blue-100",
    },
    warning: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800",
      icon: "text-amber-600 dark:text-amber-400",
      title: "text-amber-900 dark:text-amber-100",
    },
    error: {
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-800",
      icon: "text-red-600 dark:text-red-400",
      title: "text-red-900 dark:text-red-100",
    },
  };

  const style = styles[type];

  return (
    <div className={cn(
      "rounded-lg border-2 p-4",
      style.bg,
      style.border
    )}>
      <div className="flex items-start gap-3">
        <div className={cn("shrink-0 mt-0.5", style.icon)}>
          {type === "info" ? (
            <Info className="h-5 w-5" />
          ) : type === "warning" ? (
            <AlertTriangle className="h-5 w-5" />
          ) : (
            <VideoOff className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={cn("font-semibold text-sm mb-1", style.title)}>
            {title}
          </h4>
          <p className="text-sm text-foreground/80 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// NO VIDEO FOUND COMPONENT
// Standard response when no approved video exists for a topic
// ============================================================================

function NoVideoFound({ topic }: { topic?: string }) {
  return (
    <FallbackMessage
      title={GUARDRAIL_MESSAGES.NO_VIDEO_FOUND.title}
      message={
        topic 
          ? `There is no approved training video for "${topic}" yet. Please contact your training coordinator if you need video guidance on this subject.`
          : GUARDRAIL_MESSAGES.NO_VIDEO_FOUND.message
      }
      type={GUARDRAIL_MESSAGES.NO_VIDEO_FOUND.type}
    />
  );
}

// ============================================================================
// VIDEO PLAYER COMPONENT
// Renders video based on detected type with appropriate controls
// Includes guardrails for missing/unapproved videos
// ============================================================================

function VideoPlayer({ 
  url, 
  title, 
  duration,
  showFallback = true,
  topic
}: { 
  url?: string | null; 
  title?: string; 
  duration?: string;
  showFallback?: boolean;
  topic?: string;
}) {
  // If no URL provided, show fallback message
  if (!url) {
    if (showFallback) {
      return <NoVideoFound topic={topic} />;
    }
    return null;
  }

  const videoType = detectVideoType(url);

  return (
    <div className="rounded-lg overflow-hidden border border-border bg-black">
      {/* Video embed based on type */}
      {videoType === "youtube" && (
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={`${getYouTubeEmbedUrl(url)}?rel=0&modestbranding=1`}
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={title || "Video Guide"}
          />
        </div>
      )}

      {videoType === "vimeo" && (
        <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
          <iframe
            src={getVimeoEmbedUrl(url) || url}
            className="absolute top-0 left-0 w-full h-full"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            title={title || "Video Guide"}
          />
        </div>
      )}

      {videoType === "direct" && (
        <video
          controls
          playsInline
          preload="metadata"
          className="w-full"
        >
          <source src={url} type="video/mp4" />
          Your browser does not support video playback.
        </video>
      )}

      {videoType === "external" && (
        <div className="p-6 bg-card flex flex-col items-center justify-center gap-3">
          <PlayCircle className="h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            This video opens in a new window.
          </p>
        </div>
      )}

      {/* Video info bar */}
      <div className="p-3 bg-card border-t border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            {title && (
              <p className="font-medium text-sm truncate">{title}</p>
            )}
            {duration && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {duration}
              </p>
            )}
          </div>
          <Button
            size="sm"
            variant="outline"
            asChild
            className="shrink-0"
          >
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              {UI_LABELS.openVideo}
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SECTION METADATA COMPONENT
// Displays goal, time, and outcome for each section
// ============================================================================

function SectionMetadata({ 
  config, 
  section 
}: { 
  config: SectionConfig; 
  section: AnswerCardSection;
}) {
  const goal = section.customGoal || config.goal;
  const time = section.customTime || config.estimatedTime;
  const outcome = section.customOutcome || config.expectedOutcome;

  return (
    <div className={cn(
      "rounded-lg p-3 mb-3 space-y-2",
      config.styles.goalBg
    )}>
      {/* Goal */}
      <div className="flex items-start gap-2">
        <Target className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {UI_LABELS.goal}
          </span>
          <p className="text-sm text-foreground/90">{goal}</p>
        </div>
      </div>

      {/* Time */}
      <div className="flex items-start gap-2">
        <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {UI_LABELS.time}
          </span>
          <p className="text-sm text-foreground/90">{time}</p>
        </div>
      </div>

      {/* Outcome */}
      <div className="flex items-start gap-2">
        <CheckCircle2 className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
        <div>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {UI_LABELS.outcome}
          </span>
          <p className="text-sm text-foreground/90">{outcome}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// INDIVIDUAL SECTION COMPONENT
// ============================================================================

function AnswerSection({ 
  section, 
  defaultExpanded = true,
  showMetadata = true
}: { 
  section: AnswerCardSection; 
  defaultExpanded?: boolean;
  showMetadata?: boolean;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const config = SECTION_CONFIGS[section.type] || SECTION_CONFIGS.overview;

  return (
    <div className={cn(
      "rounded-xl border-2 overflow-hidden transition-all duration-200",
      config.styles.bg,
      config.styles.border
    )}>
      {/* Section Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={cn(
          "w-full flex items-center justify-between p-4",
          "hover:bg-black/5 dark:hover:bg-white/5 transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-inset"
        )}
        aria-expanded={expanded}
        aria-label={expanded ? UI_LABELS.collapse : UI_LABELS.expand}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            config.styles.icon
          )}>
            {config.icon}
          </div>
          <div className="text-left">
            <h3 className={cn("font-semibold text-base", config.styles.title)}>
              {section.title || config.title}
            </h3>
            {!expanded && (
              <p className="text-xs text-muted-foreground mt-0.5">
                {config.estimatedTime}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {expanded ? UI_LABELS.collapse : UI_LABELS.expand}
          </span>
          {expanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Section Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Section metadata (goals, timing, outcomes) */}
          {showMetadata && (
            <SectionMetadata config={config} section={section} />
          )}

          {/* Video player if present, or fallback message if not */}
          {section.type === "video" && (
            <VideoPlayer 
              url={section.videoUrl}
              title={section.videoTitle}
              duration={section.videoDuration}
              showFallback={true}
              topic={section.content}
            />
          )}

          {/* Text content */}
          {section.content && (
            <div 
              className={cn(
                "text-sm leading-relaxed text-foreground/90",
                "prose prose-sm max-w-none dark:prose-invert",
                "[&_ul]:space-y-2 [&_ul]:pl-4 [&_ul]:my-2",
                "[&_ol]:space-y-3 [&_ol]:pl-4 [&_ol]:my-2",
                "[&_li]:text-sm [&_li]:leading-relaxed",
                "[&_strong]:text-foreground [&_strong]:font-semibold",
                "[&_p]:mb-2 [&_p]:last:mb-0"
              )}
              dangerouslySetInnerHTML={{ 
                __html: formatContent(section.content, section.type) 
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN ANSWER CARD COMPONENT
// ============================================================================

export default function AnswerCard({ 
  sections, 
  timestamp,
  showMetadata = true 
}: AnswerCardProps) {
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 w-full">
      {/* Card header with neutral language */}
      <div className="flex items-center gap-2 px-1">
        <div className="h-1 flex-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-full" />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {UI_LABELS.responseHeader}
        </span>
        <div className="h-1 flex-1 bg-gradient-to-l from-primary/50 to-accent/50 rounded-full" />
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {sections.map((section, index) => (
          <AnswerSection 
            key={index} 
            section={section} 
            defaultExpanded={index < 2}
            showMetadata={showMetadata}
          />
        ))}
      </div>

      {/* Timestamp */}
      {timestamp && (
        <div className="text-right">
          <span className="text-[10px] text-muted-foreground">{timestamp}</span>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// RESPONSE PARSING FUNCTION
// Parses AI response text into structured sections
// Applies guardrails to prevent hallucinated content
// ============================================================================

export function parseResponseToSections(
  responseText: string, 
  videoUrl?: string, 
  videoTitle?: string,
  videoDuration?: string,
  options?: {
    applyGuardrails?: boolean;
    topic?: string;
  }
): AnswerCardSection[] {
  const sections: AnswerCardSection[] = [];
  const applyGuardrails = options?.applyGuardrails !== false; // Default to true
  const topic = options?.topic;
  
  if (!responseText || !responseText.trim()) {
    return sections;
  }

  // Apply guardrails to validate content
  let validatedContent = responseText;
  let validatedVideoUrl = videoUrl;
  let validatedVideoTitle = videoTitle;
  let validatedVideoDuration = videoDuration;

  if (applyGuardrails) {
    const validation = validateAIResponse(
      responseText,
      videoUrl,
      videoTitle,
      videoDuration,
      topic
    );
    
    validatedContent = validation.content;
    validatedVideoUrl = validation.videoUrl || undefined;
    validatedVideoTitle = validation.videoTitle || undefined;
    validatedVideoDuration = validation.videoDuration || undefined;
  }

  // Section title patterns (case-insensitive)
  const patterns = {
    overview: /(?:^|\n)(?:summary|overview|introduction|what you need to know)[:\s]*([\s\S]*?)(?=(?:\n(?:video|steps|instructions|considerations|important|key points)|$))/i,
    steps: /(?:^|\n)(?:steps|instructions|how to|procedure|process)[:\s]*([\s\S]*?)(?=(?:\n(?:considerations|important|key points|tips|remember)|$))/i,
    considerations: /(?:^|\n)(?:considerations|important|key points|tips|remember|notes|warnings)[:\s]*([\s\S]*?)$/i,
  };

  // Try to extract sections using patterns
  const overviewMatch = validatedContent.match(patterns.overview);
  const stepsMatch = validatedContent.match(patterns.steps);
  const considerationsMatch = validatedContent.match(patterns.considerations);

  const hasStructuredContent = overviewMatch || stepsMatch || considerationsMatch;

  if (hasStructuredContent) {
    // Build sections from matched patterns
    if (overviewMatch && overviewMatch[1]?.trim()) {
      sections.push({
        title: SECTION_CONFIGS.overview.title,
        content: overviewMatch[1].trim(),
        type: "overview",
      });
    }

    // Add video section - will show fallback if no approved video
    sections.push({
      title: SECTION_CONFIGS.video.title,
      content: validatedVideoTitle 
        ? `This video demonstrates: ${validatedVideoTitle}` 
        : topic 
          ? `Video guidance for: ${topic}`
          : "Watch this video to see the process.",
      type: "video",
      videoUrl: validatedVideoUrl,
      videoTitle: validatedVideoTitle,
      videoDuration: validatedVideoDuration,
      isYoutube: validatedVideoUrl ? /youtube\.com|youtu\.be/i.test(validatedVideoUrl) : false,
    });

    if (stepsMatch && stepsMatch[1]?.trim()) {
      sections.push({
        title: SECTION_CONFIGS.steps.title,
        content: stepsMatch[1].trim(),
        type: "steps",
      });
    }

    if (considerationsMatch && considerationsMatch[1]?.trim()) {
      sections.push({
        title: SECTION_CONFIGS.considerations.title,
        content: considerationsMatch[1].trim(),
        type: "considerations",
      });
    }
  } else {
    // Fallback: Split response into logical paragraphs
    const paragraphs = validatedContent
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
    
    if (paragraphs.length === 0) {
      paragraphs.push(validatedContent.trim());
    }

    // First paragraph becomes overview
    if (paragraphs.length >= 1) {
      sections.push({
        title: SECTION_CONFIGS.overview.title,
        content: paragraphs[0],
        type: "overview",
      });
    }

    // Add video section - will show fallback if no approved video
    sections.push({
      title: SECTION_CONFIGS.video.title,
      content: validatedVideoTitle 
        ? `This video demonstrates: ${validatedVideoTitle}` 
        : topic 
          ? `Video guidance for: ${topic}`
          : "Watch this video to see the process.",
      type: "video",
      videoUrl: validatedVideoUrl,
      videoTitle: validatedVideoTitle,
      videoDuration: validatedVideoDuration,
      isYoutube: validatedVideoUrl ? /youtube\.com|youtu\.be/i.test(validatedVideoUrl) : false,
    });

    // Middle paragraphs become steps (if they look like instructions)
    if (paragraphs.length >= 2) {
      const middleContent = paragraphs.slice(1, paragraphs.length > 2 ? -1 : undefined);
      const stepsContent = middleContent.join("\n\n");
      
      if (stepsContent) {
        sections.push({
          title: SECTION_CONFIGS.steps.title,
          content: stepsContent,
          type: "steps",
        });
      }
    }

    // Last paragraph becomes considerations (if different from steps)
    if (paragraphs.length >= 3) {
      sections.push({
        title: SECTION_CONFIGS.considerations.title,
        content: paragraphs[paragraphs.length - 1],
        type: "considerations",
      });
    }
  }

  // Ensure at least overview section exists
  if (sections.length === 0) {
    sections.push({
      title: SECTION_CONFIGS.overview.title,
      content: validatedContent,
      type: "overview",
    });
  }

  return sections;
}

// ============================================================================
// VALIDATED RESPONSE PARSING
// Parses and validates AI response with full guardrail application
// Returns both sections and any warnings/fallback messages
// ============================================================================

export type ParsedResponseWithValidation = {
  sections: AnswerCardSection[];
  isValid: boolean;
  warnings: string[];
  fallbackMessages: Array<{
    title: string;
    message: string;
    type: "info" | "warning" | "error";
  }>;
};

export function parseAndValidateResponse(
  responseText: string,
  videoUrl?: string,
  videoTitle?: string,
  videoDuration?: string,
  topic?: string
): ParsedResponseWithValidation {
  // First validate the raw content
  const validation = validateAIResponse(
    responseText,
    videoUrl,
    videoTitle,
    videoDuration,
    topic
  );

  // Then parse into sections (guardrails already applied)
  const sections = parseResponseToSections(
    validation.content,
    validation.videoUrl || undefined,
    validation.videoTitle || undefined,
    validation.videoDuration || undefined,
    { applyGuardrails: false, topic } // Already validated
  );

  return {
    sections,
    isValid: validation.isValid,
    warnings: validation.warnings,
    fallbackMessages: validation.fallbackMessages.map(msg => ({
      title: msg.title,
      message: msg.message,
      type: msg.type,
    })),
  };
}

// ============================================================================
// VIDEO SELECTION HELPER
// Logic for selecting appropriate video based on content and context
// ============================================================================

export type VideoSelectionCriteria = {
  topic?: string;
  role?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  duration?: "short" | "medium" | "long"; // short: <3min, medium: 3-10min, long: >10min
};

export function selectVideoForTopic(
  availableVideos: Array<{
    url: string;
    title: string;
    duration?: string;
    topics?: string[];
    roles?: string[];
    difficulty?: string;
  }>,
  criteria: VideoSelectionCriteria
): { url: string; title: string; duration?: string } | null {
  if (!availableVideos || availableVideos.length === 0) {
    return null;
  }

  // Score each video based on criteria match
  const scoredVideos = availableVideos.map(video => {
    let score = 0;

    // Topic match (highest priority)
    if (criteria.topic && video.topics) {
      const topicLower = criteria.topic.toLowerCase();
      if (video.topics.some(t => t.toLowerCase().includes(topicLower))) {
        score += 10;
      }
    }

    // Role match
    if (criteria.role && video.roles) {
      const roleLower = criteria.role.toLowerCase();
      if (video.roles.some(r => r.toLowerCase().includes(roleLower))) {
        score += 5;
      }
    }

    // Difficulty match
    if (criteria.difficulty && video.difficulty) {
      if (video.difficulty.toLowerCase() === criteria.difficulty) {
        score += 3;
      }
    }

    // Duration preference
    if (criteria.duration && video.duration) {
      const minutes = parseDurationToMinutes(video.duration);
      const matchesDuration = 
        (criteria.duration === "short" && minutes < 3) ||
        (criteria.duration === "medium" && minutes >= 3 && minutes <= 10) ||
        (criteria.duration === "long" && minutes > 10);
      
      if (matchesDuration) {
        score += 2;
      }
    }

    return { video, score };
  });

  // Sort by score and return best match
  scoredVideos.sort((a, b) => b.score - a.score);
  
  if (scoredVideos[0].score > 0) {
    return {
      url: scoredVideos[0].video.url,
      title: scoredVideos[0].video.title,
      duration: scoredVideos[0].video.duration,
    };
  }

  // Return first video as fallback
  return {
    url: availableVideos[0].url,
    title: availableVideos[0].title,
    duration: availableVideos[0].duration,
  };
}

// Helper to parse duration string to minutes
function parseDurationToMinutes(duration: string): number {
  const match = duration.match(/(\d+):(\d+)/);
  if (match) {
    return parseInt(match[1]) + parseInt(match[2]) / 60;
  }
  const minMatch = duration.match(/(\d+)\s*min/i);
  if (minMatch) {
    return parseInt(minMatch[1]);
  }
  return 5; // Default assumption
}
