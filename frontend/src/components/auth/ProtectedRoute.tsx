import { Navigate, Outlet } from "react-router";
import { useAuth } from "../../hooks/auth/useAuth";
import type { UserRole } from "../../enums/userRole.enum";

interface Props {
  allowedRoles: UserRole[];
}

export function ProtectedRoute({ allowedRoles }: Props) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={"/"} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={"/dashboard"} replace />;
  }

  return <Outlet />;
}
