/**
 * CONTENT GUARDRAILS
 *
 * This module prevents hallucination of UI elements (menu names, buttons, videos)
 * and ensures only approved content is displayed to trainees.
 *
 * All content must be validated against approved lists before display.
 */

// ============================================================================
// APPROVED CONTENT REGISTRIES
// These registries contain all valid UI elements that can be referenced
// ============================================================================

/**
 * Approved menu items that exist in the application
 * Any menu reference not in this list should be flagged
 */
export const APPROVED_MENUS: Record<
  string,
  {
    label: string;
    path?: string;
    description: string;
  }
> = {
  dashboard: {
    label: "Dashboard",
    path: "/dashboard",
    description: "Main training dashboard with AI assistant",
  },
  "video-lessons": {
    label: "Video Lessons",
    path: "/video-lessons",
    description: "Browse and watch training videos",
  },
  "role-selection": {
    label: "Role Selection",
    path: "/role-selection",
    description: "Select your training persona",
  },
  profile: {
    label: "Profile",
    path: "/profile",
    description: "View and edit your profile settings",
  },
  // Demo menus - commented out for now
  // "demo-chat": {
  //   label: "Demo Chat",
  //   path: "/demo-chat",
  //   description: "Try the AI chat demo",
  // },
  // "demo-call": {
  //   label: "Demo Call",
  //   path: "/demo-call",
  //   description: "Try the voice call demo",
  // },
  call: {
    label: "Call",
    path: "/call",
    description: "Start a voice call with the AI training assistant",
  },
  support: {
    label: "Contact Support",
    description: "Get help from the mentor desk",
  },
  logout: {
    label: "Log Out",
    description: "Sign out of your account",
  },
};

/**
 * Approved button labels that can be used in the UI
 * Prevents invention of non-existent actions
 */
export const APPROVED_BUTTONS: Record<
  string,
  {
    label: string;
    action: string;
    description: string;
  }
> = {
  "start-simulation": {
    label: "Start Simulation",
    action: "open_chat",
    description: "Begin an AI-guided practice session",
  },
  "watch-lesson": {
    label: "Watch Lesson",
    action: "open_video",
    description: "View a training video",
  },
  "call-support": {
    label: "Call Support",
    action: "open_phone",
    description: "Connect with the mentor desk",
  },
  "ask-question": {
    label: "Ask a Question",
    action: "open_chat",
    description: "Get help from the AI assistant",
  },
  "watch-tutorial": {
    label: "Watch a Tutorial",
    action: "open_video",
    description: "View an instructional video",
  },
  "talk-to-someone": {
    label: "Talk to Someone",
    action: "escalate",
    description: "Request human support",
  },
  "try-demo": {
    label: "Try Demo",
    action: "navigate",
    description: "Access the demo experience",
  },
  "sign-in": {
    label: "Sign In",
    action: "submit",
    description: "Log into your account",
  },
  "sign-out": {
    label: "Sign Out",
    action: "logout",
    description: "Log out of your account",
  },
  "open-video": {
    label: "Open Video",
    action: "open_external",
    description: "Open video in new tab",
  },
  "show-details": {
    label: "Show Details",
    action: "expand",
    description: "Expand to see more information",
  },
  "hide-details": {
    label: "Hide Details",
    action: "collapse",
    description: "Collapse to hide information",
  },
};

/**
 * Approved video registry
 * Videos must be registered here to be displayed to users
 * This prevents hallucination of non-existent training videos
 */
export type ApprovedVideo = {
  id: string;
  title: string;
  url: string;
  duration?: string;
  description?: string;
  topics: string[];
  roles: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  isApproved: boolean;
  lastVerified?: string; // ISO date string
};

// Video registry - add approved videos here
const VIDEO_REGISTRY: ApprovedVideo[] = [
  // Note: This is a placeholder registry.
  // In production, this would be populated from a backend API or CMS
  // Videos should only be added after being reviewed and approved
];

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validates if a menu reference exists in the approved list
 */
export function validateMenuReference(menuKey: string): {
  isValid: boolean;
  menu: (typeof APPROVED_MENUS)[string] | null;
  suggestion: string | null;
} {
  const normalizedKey = menuKey.toLowerCase().replace(/\s+/g, "-");

  if (APPROVED_MENUS[normalizedKey]) {
    return {
      isValid: true,
      menu: APPROVED_MENUS[normalizedKey],
      suggestion: null,
    };
  }

  // Try to find a close match
  const keys = Object.keys(APPROVED_MENUS);
  const closeMatch = keys.find(
    (key) => key.includes(normalizedKey) || normalizedKey.includes(key),
  );

  return {
    isValid: false,
    menu: null,
    suggestion: closeMatch ? APPROVED_MENUS[closeMatch].label : null,
  };
}

/**
 * Validates if a button label exists in the approved list
 */
export function validateButtonLabel(buttonKey: string): {
  isValid: boolean;
  button: (typeof APPROVED_BUTTONS)[string] | null;
  suggestion: string | null;
} {
  const normalizedKey = buttonKey.toLowerCase().replace(/\s+/g, "-");

  if (APPROVED_BUTTONS[normalizedKey]) {
    return {
      isValid: true,
      button: APPROVED_BUTTONS[normalizedKey],
      suggestion: null,
    };
  }

  // Try to find a close match
  const keys = Object.keys(APPROVED_BUTTONS);
  const closeMatch = keys.find(
    (key) => key.includes(normalizedKey) || normalizedKey.includes(key),
  );

  return {
    isValid: false,
    button: null,
    suggestion: closeMatch ? APPROVED_BUTTONS[closeMatch].label : null,
  };
}

/**
 * Validates if a video URL is in the approved registry
 */
export function validateVideoUrl(url: string): {
  isValid: boolean;
  video: ApprovedVideo | null;
  reason: string;
} {
  if (!url) {
    return {
      isValid: false,
      video: null,
      reason: "No video URL provided.",
    };
  }

  // Check if URL is in approved registry
  const approvedVideo = VIDEO_REGISTRY.find(
    (v) => v.url === url && v.isApproved,
  );

  if (approvedVideo) {
    return {
      isValid: true,
      video: approvedVideo,
      reason: "Video is approved.",
    };
  }

  // Check if it's a known video platform (YouTube, Vimeo)
  // These are allowed but should be flagged for review
  const isKnownPlatform = /youtube\.com|youtu\.be|vimeo\.com/i.test(url);

  if (isKnownPlatform) {
    return {
      isValid: true, // Allow known platforms but mark as unverified
      video: null,
      reason: "Video is from a known platform but not in approved registry.",
    };
  }

  return {
    isValid: false,
    video: null,
    reason: "Video URL is not in the approved registry.",
  };
}

/**
 * Searches for approved videos matching criteria
 */
export function findApprovedVideo(criteria: {
  topic?: string;
  role?: string;
  difficulty?: string;
}): ApprovedVideo | null {
  if (VIDEO_REGISTRY.length === 0) {
    return null;
  }

  const matches = VIDEO_REGISTRY.filter((video) => {
    if (!video.isApproved) return false;

    let score = 0;

    if (criteria.topic) {
      const topicLower = criteria.topic.toLowerCase();
      if (video.topics.some((t) => t.toLowerCase().includes(topicLower))) {
        score += 10;
      }
    }

    if (criteria.role) {
      const roleLower = criteria.role.toLowerCase();
      if (video.roles.some((r) => r.toLowerCase().includes(roleLower))) {
        score += 5;
      }
    }

    if (criteria.difficulty && video.difficulty === criteria.difficulty) {
      score += 3;
    }

    return score > 0;
  });

  // Sort by relevance and return best match
  if (matches.length > 0) {
    return matches[0];
  }

  return null;
}

// ============================================================================
// GUARDRAIL RESPONSE MESSAGES
// Standard responses when content validation fails
// ============================================================================

export const GUARDRAIL_MESSAGES = {
  // Video not found
  NO_VIDEO_FOUND: {
    title: "No Matching Video Found",
    message:
      "There is no approved training video for this topic yet. Please contact your training coordinator if you need video guidance on this subject.",
    type: "info" as const,
  },

  // Video not approved
  VIDEO_NOT_APPROVED: {
    title: "Video Unavailable",
    message:
      "This video is currently being reviewed and is not yet available. Please check back later or ask your trainer for alternative resources.",
    type: "warning" as const,
  },

  // Menu not found
  MENU_NOT_FOUND: {
    title: "Navigation Not Available",
    message:
      "The requested menu or page does not exist. Please use the main navigation to find what you need.",
    type: "warning" as const,
  },

  // Button/action not available
  ACTION_NOT_AVAILABLE: {
    title: "Action Not Available",
    message:
      "This action is not currently available. Please try a different option or contact support for assistance.",
    type: "warning" as const,
  },

  // Generic content not found
  CONTENT_NOT_FOUND: {
    title: "Content Not Found",
    message:
      "The requested content could not be found. Please try rephrasing your question or contact support.",
    type: "info" as const,
  },
} as const;

// ============================================================================
// CONTENT SANITIZATION
// Functions to clean and validate AI-generated content
// ============================================================================

/**
 * Sanitizes AI response to remove hallucinated UI references
 */
export function sanitizeAIResponse(content: string): {
  sanitizedContent: string;
  removedReferences: string[];
  warnings: string[];
} {
  const removedReferences: string[] = [];
  const warnings: string[] = [];
  let sanitizedContent = content;

  // Pattern to detect potential menu references
  const menuPattern =
    /(?:click|go to|navigate to|open|select)\s+(?:the\s+)?["']?([A-Z][a-zA-Z\s]+)["']?\s+(?:menu|tab|page|section|button)/gi;

  // Pattern to detect potential button references
  const buttonPattern =
    /(?:click|press|tap|select)\s+(?:the\s+)?["']?([A-Z][a-zA-Z\s]+)["']?\s+button/gi;

  // Check menu references
  let menuMatch;
  while ((menuMatch = menuPattern.exec(content)) !== null) {
    const menuName = menuMatch[1].trim();
    const validation = validateMenuReference(menuName);

    if (!validation.isValid) {
      warnings.push(`Referenced menu "${menuName}" does not exist.`);
      removedReferences.push(menuName);

      // Replace with generic instruction or suggestion
      if (validation.suggestion) {
        sanitizedContent = sanitizedContent.replace(
          menuMatch[0],
          `navigate to the ${validation.suggestion} page`,
        );
      } else {
        sanitizedContent = sanitizedContent.replace(
          menuMatch[0],
          "use the main navigation",
        );
      }
    }
  }

  // Check button references
  let buttonMatch;
  while ((buttonMatch = buttonPattern.exec(content)) !== null) {
    const buttonName = buttonMatch[1].trim();
    const validation = validateButtonLabel(buttonName);

    if (!validation.isValid) {
      warnings.push(`Referenced button "${buttonName}" does not exist.`);
      removedReferences.push(buttonName);

      // Replace with generic instruction or suggestion
      if (validation.suggestion) {
        sanitizedContent = sanitizedContent.replace(
          buttonMatch[0],
          `click the ${validation.suggestion} button`,
        );
      } else {
        sanitizedContent = sanitizedContent.replace(
          buttonMatch[0],
          "use the available options",
        );
      }
    }
  }

  return {
    sanitizedContent,
    removedReferences,
    warnings,
  };
}

/**
 * Validates video reference in AI response
 * Returns fallback content if video doesn't exist
 */
export function validateVideoReference(
  videoUrl: string | undefined,
  videoTitle: string | undefined,
  topic?: string,
): {
  isValid: boolean;
  videoUrl: string | null;
  videoTitle: string | null;
  fallbackMessage:
    | (typeof GUARDRAIL_MESSAGES)[keyof typeof GUARDRAIL_MESSAGES]
    | null;
} {
  // If no video provided, check if we have an approved video for the topic
  if (!videoUrl) {
    if (topic) {
      const approvedVideo = findApprovedVideo({ topic });
      if (approvedVideo) {
        return {
          isValid: true,
          videoUrl: approvedVideo.url,
          videoTitle: approvedVideo.title,
          fallbackMessage: null,
        };
      }
    }

    return {
      isValid: false,
      videoUrl: null,
      videoTitle: null,
      fallbackMessage: GUARDRAIL_MESSAGES.NO_VIDEO_FOUND,
    };
  }

  // Validate the provided video URL
  const validation = validateVideoUrl(videoUrl);

  if (validation.isValid) {
    return {
      isValid: true,
      videoUrl: videoUrl,
      videoTitle: validation.video?.title || videoTitle || "Training Video",
      fallbackMessage: null,
    };
  }

  // Video not approved - return fallback
  return {
    isValid: false,
    videoUrl: null,
    videoTitle: null,
    fallbackMessage: GUARDRAIL_MESSAGES.VIDEO_NOT_APPROVED,
  };
}

// ============================================================================
// CONTENT VALIDATION WRAPPER
// High-level function to validate entire AI response
// ============================================================================

export type ValidationResult = {
  isValid: boolean;
  content: string;
  videoUrl: string | null;
  videoTitle: string | null;
  videoDuration: string | null;
  warnings: string[];
  fallbackMessages: Array<
    (typeof GUARDRAIL_MESSAGES)[keyof typeof GUARDRAIL_MESSAGES]
  >;
};

/**
 * Comprehensive validation of AI response content
 * Applies all guardrails and returns sanitized content
 */
export function validateAIResponse(
  content: string,
  videoUrl?: string,
  videoTitle?: string,
  videoDuration?: string,
  topic?: string,
): ValidationResult {
  const warnings: string[] = [];
  const fallbackMessages: Array<
    (typeof GUARDRAIL_MESSAGES)[keyof typeof GUARDRAIL_MESSAGES]
  > = [];

  // Step 1: Sanitize content for hallucinated UI references
  const sanitizationResult = sanitizeAIResponse(content);
  let validatedContent = sanitizationResult.sanitizedContent;
  warnings.push(...sanitizationResult.warnings);

  // Step 2: Validate video reference
  const videoValidation = validateVideoReference(videoUrl, videoTitle, topic);

  if (!videoValidation.isValid && videoValidation.fallbackMessage) {
    fallbackMessages.push(videoValidation.fallbackMessage);
  }

  // Step 3: Return validated result
  return {
    isValid: warnings.length === 0 && fallbackMessages.length === 0,
    content: validatedContent,
    videoUrl: videoValidation.videoUrl,
    videoTitle: videoValidation.videoTitle,
    videoDuration: videoValidation.isValid ? videoDuration || null : null,
    warnings,
    fallbackMessages,
  };
}

// ============================================================================
// APPROVED VIDEO REGISTRY MANAGEMENT
// Functions to manage the video registry (for admin use)
// ============================================================================

/**
 * Adds a video to the approved registry
 * Should only be called by authorized admin functions
 */
export function registerApprovedVideo(
  video: Omit<ApprovedVideo, "isApproved" | "lastVerified">,
): void {
  const existingIndex = VIDEO_REGISTRY.findIndex((v) => v.id === video.id);

  const approvedVideo: ApprovedVideo = {
    ...video,
    isApproved: true,
    lastVerified: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    VIDEO_REGISTRY[existingIndex] = approvedVideo;
  } else {
    VIDEO_REGISTRY.push(approvedVideo);
  }
}

/**
 * Removes a video from the approved registry
 */
export function revokeVideoApproval(videoId: string): boolean {
  const index = VIDEO_REGISTRY.findIndex((v) => v.id === videoId);
  if (index >= 0) {
    VIDEO_REGISTRY[index].isApproved = false;
    return true;
  }
  return false;
}

/**
 * Gets all approved videos (for admin dashboard)
 */
export function getApprovedVideos(): ApprovedVideo[] {
  return VIDEO_REGISTRY.filter((v) => v.isApproved);
}

/**
 * Gets count of approved videos
 */
export function getApprovedVideoCount(): number {
  return VIDEO_REGISTRY.filter((v) => v.isApproved).length;
}
