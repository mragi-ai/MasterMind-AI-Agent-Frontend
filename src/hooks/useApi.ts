import { useCallback, useState } from "react";
import { api } from "@/lib/api/request";

type HttpMethod = "get" | "post" | "patch" | "delete";

export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(
    async <T, B = unknown>(
      method: HttpMethod,
      url: string,
      body?: B
    ): Promise<T> => {
      setLoading(true);
      setError(null);
      try {
        switch (method) {
          case "get":
            return await api.get<T>(url);
          case "post":
            return await api.post<T, B>(url, body);
          case "patch":
            return await api.patch<T, B>(url, body);
          case "delete":
            return await api.delete<T>(url);
          default:
            throw new Error("Unsupported method");
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : "Request failed";
        setError(message);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { loading, error, call } as const;
}


