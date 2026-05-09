import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuth = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      login: ({ user, token }) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      isAdmin: () => false, // placeholder, replaced by selector below
    }),
    { name: "lablock-auth" }
  )
);

export const selectIsAdmin = (s) => s.user?.role === "admin";
export const selectIsSupervisor = (s) =>
  s.user?.role === "supervisor" || s.user?.role === "admin";
