import { create } from "zustand";

export const useUserStore = create((set) => ({
  loggedInUserDetails: null,
  setUserDetails: (userData) => set({ loggedInUserDetails: userData }),
  clearUser: () => set({ loggedInUserDetails: null }),
}));
