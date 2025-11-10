import { api } from "@/lib/api/request";

export type ChatAskRequest = {
  question: string;
  role: string; // e.g., "dispatcher"
};

export type ChatAskMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  kind?: "text" | "video" | "options";
};

export type ChatAskResponse = {
  messages?: ChatAskMessage[];
  answer?: string; // in case backend returns a simple answer field
  [key: string]: any;
};

export async function chatAsk(body: ChatAskRequest): Promise<ChatAskResponse> {
  return api.post<ChatAskResponse, ChatAskRequest>("chat/ask", body);
}


