import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "@/lib/auth";

type ProtectedRouteProps = {
  children: ReactNode;
  requireAuth?: boolean;
};

export default function ProtectedRoute({ children, requireAuth = true }: ProtectedRouteProps) {
  const location = useLocation();
  const isAuth = isAuthenticated();

  if (requireAuth && !isAuth) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (!requireAuth && isAuth) {
    return <Navigate to="/role-selection" replace />;
  }

  return <>{children}</>;
}
