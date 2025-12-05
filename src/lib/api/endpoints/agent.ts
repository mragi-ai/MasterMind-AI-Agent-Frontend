import { api } from "@/lib/api/request";

export type ChatAskRequest = {
  user_id: string;
  session_id: string;
  role: string;
  question: string;
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

export type AssessmentRequest = {
  user_id: string;
  session_id: string;
  role: string;
};

export type AssessmentResponse = {
  question?: string;
  questions?: string[];
  message?: string;
  [key: string]: any;
};

export async function getAssessment(body: AssessmentRequest): Promise<AssessmentResponse> {
  return api.post<AssessmentResponse, AssessmentRequest>("assessment/question", body);
}

export type DemoAskRequest = {
  user_id: string;
  role: string;
  question: string;
};

export async function demoAsk(body: DemoAskRequest): Promise<ChatAskResponse> {
  return api.post<ChatAskResponse, DemoAskRequest>("demo/ask", body);
}

