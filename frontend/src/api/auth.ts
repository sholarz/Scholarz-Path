import { api } from "./client";

export type UserRole = "admin" | "premium" | "free";

export interface AuthUserProfile {
  first_name?: string;
  last_name?: string;
  profile_completion_percentage?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  profile?: AuthUserProfile | null;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  expires_at?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<ApiEnvelope<AuthResponse>>("/auth/login", {
    email,
    password,
  });

  return response.data.data;
};

export const register = async (payload: {
  email: string;
  password: string;
  password_confirmation: string;
  name: string;
  first_name?: string;
  last_name?: string;
}): Promise<AuthResponse> => {
  const response = await api.post<ApiEnvelope<AuthResponse>>("/auth/register", payload);
  return response.data.data;
};

export const logout = async (): Promise<void> => {
  await api.post("/auth/logout");
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  await api.post("/auth/forgot-password", { email });
};

export const getGoogleRedirectUrl = async (): Promise<string> => {
  const response = await api.get<ApiEnvelope<{ redirect_url: string }>>(
    "/auth/google/redirect"
  );
  return response.data.data.redirect_url;
};
