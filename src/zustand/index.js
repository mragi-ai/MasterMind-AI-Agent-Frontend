import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAppStore = create(
  persist(
    (set, get) => ({
      selectedRole: null,
      discover: {
        open: false,
      },
      setSelectedRole: (role) => set({ selectedRole: role }),
      clearSelectedRole: () => set({ selectedRole: null }),
    }),
    {
      name: "app-storage",
      partialize: (state) => ({ selectedRole: state.selectedRole }),
    }
  )
);

export default useAppStore;
