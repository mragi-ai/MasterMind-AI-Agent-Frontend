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
