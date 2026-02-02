import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../hooks/auth/useAuth";

export function PublicRoute() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (user) {
    return <Navigate to={"/dashboard"} replace />;
  }

  return <Outlet />;
}
