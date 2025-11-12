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

export type MicrosoftSSORequest = {
  access_token: string;
  id_token?: string;
  email?: string;
  name?: string;
};

export type MicrosoftSSOResponse = {
  access_token?: string;
  token_type?: string;
  user?: {
    email?: string;
    user_id?: string;
    [key: string]: unknown;
  };
  message?: string;
  [key: string]: any;
};

export async function loginWithMicrosoft(
  body: MicrosoftSSORequest
): Promise<MicrosoftSSOResponse> {
  return api.post<MicrosoftSSOResponse, MicrosoftSSORequest>(
    "auth/microsoft",
    body
  );
}
