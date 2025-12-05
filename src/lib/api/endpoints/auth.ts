import { api } from "@/lib/api/request";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token?: string;
  message?: string;
  [key: string]: any;
};

export async function login(body: LoginRequest): Promise<LoginResponse> {
  const res = await api.post<LoginResponse, LoginRequest>("auth/login", body);
  // Persist token if returned
  if (res?.token) {
    try {
      localStorage.setItem("token", res.token);
    } catch {}
  }
  return res;
}

export type ForgotPasswordRequest = {
  email: string;
};

export type ForgotPasswordResponse = {
  message?: string;
  [key: string]: any;
};

export async function forgotPassword(
  body: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> {
  return api.post<ForgotPasswordResponse, ForgotPasswordRequest>(
    "auth/forgot-password",
    body
  );
}
