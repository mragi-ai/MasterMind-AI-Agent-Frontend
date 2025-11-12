import { api } from "@/lib/api/request";

export type VideoSearchResult = {
  id: string;
  title: string;
  description?: string;
  duration?: string;
  channel?: string;
  published_at?: string;
  thumbnail_url: string;
  views?: number;
  url: string;
};

export type VideoSearchResponse = {
  query: string;
  results: VideoSearchResult[];
  took_ms?: number;
};

export async function searchVideos(query: string): Promise<VideoSearchResponse> {
  return api.get<VideoSearchResponse>("videos/search", {
    params: { query },
  });
}
