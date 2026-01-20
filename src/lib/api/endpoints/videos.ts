import { api } from "@/lib/api/request";

export type TranscriptSegment = {
  text: string;
  start: number; // timestamp in seconds
  duration: number;
};

export type VideoSearchResult = {
  title: string;
  youtube_url: string;
  thumbnail_url: string;
  video_id?: string;
  transcript?: TranscriptSegment[];
};

export type VideoSearchResponse = {
  count: number;
  videos: VideoSearchResult[];
};

export type TranscriptSearchResult = {
  text: string;
  start: number;
  duration: number;
  relevance_score?: number;
};

export type VideoTranscriptSearchResponse = {
  video_id: string;
  title: string;
  youtube_url: string;
  matches: TranscriptSearchResult[];
};

export async function searchVideos(query: string): Promise<VideoSearchResponse> {
  return api.get<VideoSearchResponse>("videos/search", {
    params: { q: query },
  });
}

export async function searchTranscript(
  videoId: string,
  query: string
): Promise<VideoTranscriptSearchResponse> {
  return api.get<VideoTranscriptSearchResponse>(`videos/${videoId}/search`, {
    params: { q: query },
  });
}

export async function getVideoDetails(videoId: string): Promise<VideoSearchResult> {
  return api.get<VideoSearchResult>(`videos/${videoId}`);
}

// Video progress types
export type VideoProgressResponse = {
  userid: string;
  video: string;
  time: number;
};

export type VideoProgressRequest = {
  userid: string;
  video: string;
  time: number;
};

export type VideoProgressSaveResponse = {
  status: string;
  saved_time: number;
};

// All videos response type
export type VideoTimestamp = {
  time: string;
  label: string;
};

export type VideoModuleInfo = {
  module_number: string;
  module_name: string;
  course_name: string;
};

export type AllVideosResponse = {
  count: number;
  videos: Array<{
    _id: string;
    title: string;
    description: string;
    youtube_url: string;
    thumbnail_url: string;
    duration: string;
    tags: string[];
    target_role: string[];
    timestamps: VideoTimestamp[];
    module_info: VideoModuleInfo;
    production_details?: any;
    distribution?: any;
    created_at: string;
    updated_at: string;
  }>;
};

// Get all videos - try main API first, fallback to alternative URL if needed
export async function getAllVideos(): Promise<AllVideosResponse> {
  // First, try using the same apiClient as other endpoints
  // Try different possible endpoint paths
  const possibleEndpoints = ["videos/all", "video/all", "videos"];
  
  for (const endpoint of possibleEndpoints) {
    try {
      console.log(`Trying endpoint: ${endpoint}`);
      const response = await api.get<AllVideosResponse>(endpoint);
      console.log(`✅ Success! Videos API response from ${endpoint}:`, response);
      if (response && (response.videos || response.count !== undefined)) {
        return response;
      }
    } catch (error: any) {
      console.log(`❌ Endpoint ${endpoint} failed:`, error.response?.status, error.message);
      // Continue to next endpoint
    }
  }
  
  // If all main API endpoints failed, try alternative URL
  console.warn("All main API endpoints failed, trying alternative ngrok URL");
  const axios = (await import("axios")).default;
  
  // Get auth token if available
  const token =
    (typeof localStorage !== "undefined" && (localStorage as any)?.token) ||
    (typeof sessionStorage !== "undefined" && sessionStorage?.getItem("token")) ||
    (typeof localStorage !== "undefined" && localStorage?.getItem("auth.access_token")) ||
    (typeof sessionStorage !== "undefined" && sessionStorage?.getItem("auth.access_token"));
  
  const headers: Record<string, string> = {
    "ngrok-skip-browser-warning": "bypass",
  };
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  
  try {
    console.log("Trying alternative URL: https://1ebcbfe8ed8f.ngrok-free.app/api/v1/videos/all");
    const response = await axios.get<AllVideosResponse>(
      "https://1ebcbfe8ed8f.ngrok-free.app/api/v1/videos/all",
      {
        headers,
      }
    );
    console.log("✅ Videos API response (from alternative URL):", response.data);
    return response.data;
  } catch (fallbackError: any) {
    console.error("❌ Error fetching videos from both URLs:", fallbackError);
    console.error("Error details:", {
      message: fallbackError.message,
      response: fallbackError.response?.data,
      status: fallbackError.response?.status,
      url: fallbackError.config?.url,
      headers: fallbackError.config?.headers,
    });
    
    // If it's a CORS error, provide helpful message
    if (fallbackError.code === "ERR_NETWORK" || fallbackError.message?.includes("CORS")) {
      throw new Error("CORS error: The videos endpoint is not accessible. Please check if the endpoint exists on the main API server or configure CORS on the backend.");
    }
    
    throw fallbackError;
  }
}

// Get video progress
export async function getVideoProgress(
  userid: string,
  video: string
): Promise<VideoProgressResponse> {
  return api.get<VideoProgressResponse>("video/progress", {
    params: { userid, video },
  });
}

// Save video progress
export async function saveVideoProgress(
  body: VideoProgressRequest
): Promise<VideoProgressSaveResponse> {
  return api.post<VideoProgressSaveResponse, VideoProgressRequest>(
    "video/progress",
    body
  );
}
