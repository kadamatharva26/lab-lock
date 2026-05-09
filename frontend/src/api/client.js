import axios from "axios";
import { useAuth } from "../store/auth";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:4000",
});

api.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      // token invalid — clear session
      useAuth.getState().logout();
    }
    return Promise.reject(err);
  }
);

export function apiError(err) {
  return (
    err?.response?.data?.error?.message ||
    err?.message ||
    "Something went wrong"
  );
}

export default api;
