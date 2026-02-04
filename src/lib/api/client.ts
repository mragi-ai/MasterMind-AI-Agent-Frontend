import axios, { AxiosError, AxiosInstance } from "axios";
import { clearAuth } from "@/lib/auth";

// const serverURL = import.meta.env.VITE_API_SERVER as string | undefined;
// const baseURL = serverURL ? `${serverURL}/api/v1/` : "/api/v1/";

// const baseURL = "http://192.168.3.199:7000/api/v1/";
const baseURL = "https://api.evanstrainer.com/api/v1/";

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 60_000,
});

apiClient.interceptors.request.use((config) => {
  const token =
    (typeof localStorage !== "undefined" && (localStorage as any)?.token) ||
    (typeof sessionStorage !== "undefined" &&
      sessionStorage?.getItem("token")) ||
    (globalThis as any)?.token;

  // Always add ngrok header to bypass warning page
  config.headers = {
    ...config.headers,
    "ngrok-skip-browser-warning": "bypass",
  } as any;

  console.log(`Starting Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);


  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    } as any;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    // Check if response is HTML (ngrok warning page)
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      const data = response.data;
      if (typeof data === 'string' && (data.includes('<!DOCTYPE html>') || data.includes('ngrok'))) {
        throw new Error("Ngrok warning page detected. Please visit the API URL in your browser first to bypass the warning.");
      }
    }
    return response;
  },
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      try {
        clearAuth();
      } catch { }
    }
    return Promise.reject(error);
  }
);

// Separate client for chat API with different base URL
// const chatBaseURL = "https://fireless-axel-agnostically.ngrok-free.dev/api/v1/";
// const chatBaseURL = "https://api.evanstrainer.com/api/v1/";
// const chatBaseURL = "http://192.168.3.199:7000/api/v1/";
const chatBaseURL = "https://api.evanstrainer.com/api/v1/";
export const chatApiClient: AxiosInstance = axios.create({
  baseURL: chatBaseURL,
  timeout: 60_000,
});

// Apply same interceptors to chat client
chatApiClient.interceptors.request.use((config) => {
  const token =
    (typeof localStorage !== "undefined" && (localStorage as any)?.token) ||
    (typeof sessionStorage !== "undefined" &&
      sessionStorage?.getItem("token")) ||
    (globalThis as any)?.token;

  // Always add ngrok header to bypass warning page
  config.headers = {
    ...config.headers,
    "ngrok-skip-browser-warning": "bypass",
  } as any;

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    } as any;
  }

  return config;
});

chatApiClient.interceptors.response.use(
  (response) => {
    // Check if response is HTML (ngrok warning page)
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      const data = response.data;
      if (typeof data === 'string' && (data.includes('<!DOCTYPE html>') || data.includes('ngrok'))) {
        throw new Error("Ngrok warning page detected. Please visit the API URL in your browser first to bypass the warning.");
      }
    }
    return response;
  },
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      try {
        clearAuth();
      } catch { }
    }
    return Promise.reject(error);
  }
);

// Demo API client with local URL for testing
// const demoBaseURL = "http://192.168.3.199:7000/api/v1/";
const demoBaseURL = "https://api.evanstrainer.com/api/v1/";
export const demoApiClient: AxiosInstance = axios.create({
  baseURL: demoBaseURL,
  timeout: 60_000,
});

// Apply same interceptors to demo client
demoApiClient.interceptors.request.use((config) => {
  const token =
    (typeof localStorage !== "undefined" && (localStorage as any)?.token) ||
    (typeof sessionStorage !== "undefined" &&
      sessionStorage?.getItem("token")) ||
    (globalThis as any)?.token;

  // Always add ngrok header to bypass warning page
  config.headers = {
    ...config.headers,
    "ngrok-skip-browser-warning": "bypass",
  } as any;

  console.log(`Starting Demo Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    } as any;
  }

  return config;
});

demoApiClient.interceptors.response.use(
  (response) => {
    const contentType = response.headers['content-type'] || '';
    if (contentType.includes('text/html')) {
      const data = response.data;
      if (typeof data === 'string' && (data.includes('<!DOCTYPE html>') || data.includes('ngrok'))) {
        throw new Error("Ngrok warning page detected. Please visit the API URL in your browser first to bypass the warning.");
      }
    }
    return response;
  },
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      try {
        clearAuth();
      } catch { }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
