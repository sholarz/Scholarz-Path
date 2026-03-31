import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

const AUTH_TOKEN_KEY = "token";

const canUseStorage = typeof window !== "undefined" && !!window.localStorage;

export const getStoredToken = (): string | null => {
  if (!canUseStorage) {
    return null;
  }

  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setStoredToken = (token: string | null): void => {
  if (!canUseStorage) {
    return;
  }

  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    delete api.defaults.headers.common.Authorization;
  }
};

const existingToken = getStoredToken();
if (existingToken) {
  setStoredToken(existingToken);
}
