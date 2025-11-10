import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { clearAuth } from "@/lib/auth";
import useAppStore from "@/zustand";

export function useLogout() {
  const navigate = useNavigate();

  return useCallback(() => {
    clearAuth();
    try {
      useAppStore.getState().clearSelectedRole();
    } catch {}
    navigate("/", { replace: true });
  }, [navigate]);
}


