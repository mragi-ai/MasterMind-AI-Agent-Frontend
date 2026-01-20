import { api } from "@/lib/api/request";

export async function logout(): Promise<void> {
  await api.post("auth/logout", {});
}

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
    } catch { }
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

export type UserProfileResponse = {
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  password?: string;
  [key: string]: any;
};

export async function getUserProfile(): Promise<UserProfileResponse> {
  return api.get<UserProfileResponse>("auth/me");
}

export type UpdateUserProfileRequest = {
  first_name: string;
  last_name: string;
  phone_number: string;
};

export async function updateUserProfile(
  body: UpdateUserProfileRequest,
  config?: any
): Promise<UserProfileResponse> {
  return api.put<UserProfileResponse, UpdateUserProfileRequest>(
    "auth/profile",
    body,
    config
  );
}




export type ChangePasswordRequest = {
  old_password: string;
  new_password: string;
};

export type ChangePasswordResponse = {
  message?: string;
  [key: string]: any;
};

export async function changePassword(
  body: ChangePasswordRequest
): Promise<ChangePasswordResponse> {
  return api.post<ChangePasswordResponse, ChangePasswordRequest>(
    "auth/change-password",
    body
  );
}

export type ResetPasswordRequest = {
  token: string;
  new_password: string;
};

export type ResetPasswordResponse = {
  message?: string;
  [key: string]: any;
};

export async function resetPassword(
  body: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
  console.log("Authenticating resetPassword API call with:", body); // Debug log
  return api.post<ResetPasswordResponse, ResetPasswordRequest>(
    "auth/reset-password",
    body
  );
}
