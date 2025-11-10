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
    return res.data;
  } catch (err) {
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
  delete<T = unknown>(url: string, config?: AxiosRequestConfig) {
    ensureOnline();
    return handle<T>(apiClient.delete<T>(url, config));
  },
};

export default api;


