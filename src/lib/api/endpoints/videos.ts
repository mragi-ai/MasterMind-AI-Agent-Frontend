import { api } from "@/lib/api/request";

export type VideoSearchResult = {
  title: string;
  youtube_url: string;
  thumbnail_url: string;
};

export type VideoSearchResponse = {
  count: number;
  videos: VideoSearchResult[];
};

export async function searchVideos(query: string): Promise<VideoSearchResponse> {
  return api.get<VideoSearchResponse>("videos/search", {
    params: { q: query },
  });
}
