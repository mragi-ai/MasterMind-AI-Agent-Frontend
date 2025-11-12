const env = import.meta.env;

const DEFAULT_AUTHORITY = "https://login.microsoftonline.com/common";
const DEFAULT_REDIRECT_URI =
  typeof window !== "undefined" && window.location.origin
    ? window.location.origin
    : "http://localhost:5173";

export const MICROSOFT_CLIENT_ID = env.VITE_AZURE_CLIENT_ID || "";
export const MICROSOFT_AUTHORITY = DEFAULT_AUTHORITY;
export const MICROSOFT_REDIRECT_URI =
  env.VITE_AZURE_REDIRECT_URI || DEFAULT_REDIRECT_URI;
