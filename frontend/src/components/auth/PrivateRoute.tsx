import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../hooks/auth/useAuth";
import { LoadingPage } from "../../pages/LoadingPage";

export function PrivateRoute() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingPage />;

  if (!user) {
    return <Navigate to={"/"} replace />;
  }

  return <Outlet />;
}
