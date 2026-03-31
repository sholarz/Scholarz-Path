import { api } from "./client";
import type { UserRole } from "./auth";

export interface UserProfile {
  id?: string;
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  date_of_birth?: string | null;
  nationality?: string | null;
  current_country?: string | null;
  gpa?: number | null;
  major?: string | null;
  degree_level?: string | null;
  graduation_year?: number | null;
  profile_completion_percentage?: number;
}

export interface UserLanguage {
  id: string;
  language: string;
  proficiency_level: "beginner" | "intermediate" | "advanced" | "native";
  certification?: string | null;
  score?: string | null;
}

export interface CurrentUser {
  id: string;
  email: string;
  role: UserRole;
  status?: string;
  email_verified_at?: string | null;
  profile?: UserProfile | null;
  languages?: UserLanguage[];
}

interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getCurrentUser = async (): Promise<CurrentUser> => {
  const response = await api.get<ApiEnvelope<CurrentUser>>("/user");
  return response.data.data;
};

export const updateProfile = async (payload: Partial<UserProfile>): Promise<UserProfile> => {
  const response = await api.put<ApiEnvelope<{ profile: UserProfile }>>("/profile", payload);
  return response.data.data.profile;
};

export const updateEmail = async (email: string): Promise<void> => {
  await api.put("/user/email", { email });
};

export const updatePassword = async (payload: {
  current_password: string;
  new_password: string;
  new_password_confirmation: string;
}): Promise<void> => {
  await api.put("/user/password", payload);
};

export const addLanguage = async (payload: Omit<UserLanguage, "id">): Promise<UserLanguage> => {
  const response = await api.post<ApiEnvelope<{ language: UserLanguage }>>(
    "/profile/languages",
    payload
  );
  return response.data.data.language;
};

export const updateLanguage = async (
  languageId: string,
  payload: Partial<Omit<UserLanguage, "id">>
): Promise<UserLanguage> => {
  const response = await api.put<ApiEnvelope<{ language: UserLanguage }>>(
    `/profile/languages/${languageId}`,
    payload
  );
  return response.data.data.language;
};

export const deleteLanguage = async (languageId: string): Promise<void> => {
  await api.delete(`/profile/languages/${languageId}`);
};

export const uploadAvatar = async (file: File): Promise<void> => {
  const formData = new FormData();
  formData.append("avatar", file);

  await api.post("/profile/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};
