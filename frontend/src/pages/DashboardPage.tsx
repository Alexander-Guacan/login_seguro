import { AdminDashboard } from "../components/Dashboard/AdminDashboard";
import { ClientDashboard } from "../components/Dashboard/ClientDashboard";
import { PageHeader } from "../components/PageSection/PageHeader";
import type { UserRole } from "../enums/userRole.enum";
import { useAuth } from "../hooks/auth/useAuth";

export function DashboardPage() {
  const { user } = useAuth();

  const dashboardByRole: Record<UserRole, React.ReactNode> = {
    ADMIN: <AdminDashboard />,
    CLIENT: <ClientDashboard />,
  };

  if (!user) return;

  return (
    <main className="flex flex-col gap-y-6">
      <PageHeader
        title={`Bienvenido de vuelta! ${user?.fullName} 👋`}
        breadcrumbsLabels={["Dashboard"]}
      />
      {dashboardByRole[user?.role]}
    </main>
  );
}
