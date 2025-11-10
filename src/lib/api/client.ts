import axios, { AxiosError, AxiosInstance } from "axios";

// const serverURL = import.meta.env.VITE_API_SERVER as string | undefined;
// const baseURL = serverURL ? `${serverURL}/api/v1/` : "/api/v1/";

// const baseURL = "http://192.168.3.230:3000/api/v1/";
const baseURL = " https://fireless-axel-agnostically.ngrok-free.dev/api/v1/";

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

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
      "ngrok-skip-browser-warning": "bypass",
    } as any;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<any>) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      try {
        if (typeof localStorage !== "undefined")
          localStorage.removeItem("token");
      } catch {}
    }
    return Promise.reject(error);
  }
);

export default apiClient;
