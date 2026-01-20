import { api } from "@/lib/api/request";
import { chatApiClient } from "@/lib/api/client";

function ensureOnline(): void {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("Please check your internet connection.");
  }
}

function toErrorMessage(error: unknown): string {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    (error as any).response?.data?.message
  ) {
    return (error as any).response.data.message as string;
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

async function handleChat<T>(promise: Promise<{ data: T }>): Promise<T> {
  try {
    const res = await promise;
    const data = res.data;

    // Check if response is HTML (ngrok warning page)
    if (typeof data === 'string' && (data.includes('<!DOCTYPE html>') || data.includes('ngrok'))) {
      throw new Error("Received HTML response (ngrok warning page). Please visit the API URL in your browser first to bypass the warning.");
    }

    return data;
  } catch (err) {
    // Check if error response contains HTML
    if (
      err &&
      typeof err === "object" &&
      "response" in err &&
      (err as any).response?.data &&
      typeof (err as any).response.data === "string" &&
      ((err as any).response.data.includes("<!DOCTYPE html>") || (err as any).response.data.includes("ngrok"))
    ) {
      throw new Error("Ngrok warning page detected. The API endpoint may require browser verification.");
    }
    throw new Error(toErrorMessage(err));
  }
}

export type ChatAskRequest = {
  user_id: string;
  session_id: string;
  agent_id: string; // new field replacing role
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
  ensureOnline();
  return handleChat<ChatAskResponse>(chatApiClient.post<ChatAskResponse>("chat/ask", body));
}

export type AssessmentRequest = {
  user_id: string;
  session_id: string;
  agent_id: string;
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
  agent_id: string;
  question: string;
};

export async function demoAsk(body: DemoAskRequest): Promise<ChatAskResponse> {
  return api.post<ChatAskResponse, DemoAskRequest>("demo/ask", body);
}

export type Agent = {
  _id?: string;
  id: string;
  agent_id?: string;
  name: string;
  instruction: string;
  [key: string]: any;
};

export type AgentsListResponse = {
  status: string;
  data: Agent[];
  [key: string]: any;
};

export async function listAgents(): Promise<AgentsListResponse> {
  return api.get<AgentsListResponse>("agents/list");
}

