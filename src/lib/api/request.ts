import type { AxiosRequestConfig } from "axios";
import apiClient from "./client";

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

async function handle<T>(promise: Promise<{ data: T }>): Promise<T> {
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

export const api = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig) {
    ensureOnline();
    return handle<T>(apiClient.get<T>(url, config));
  },
  post<T = unknown, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) {
    ensureOnline();
    return handle<T>(apiClient.post<T>(url, body, config));
  },
  patch<T = unknown, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) {
    ensureOnline();
    return handle<T>(apiClient.patch<T>(url, body, config));
  },
  put<T = unknown, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) {
    ensureOnline();
    return handle<T>(apiClient.put<T>(url, body, config));
  },
  delete<T = unknown>(url: string, config?: AxiosRequestConfig) {
    ensureOnline();
    return handle<T>(apiClient.delete<T>(url, config));
  },
};

export default api;


