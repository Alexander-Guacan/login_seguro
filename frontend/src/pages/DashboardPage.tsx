import { useAuth } from "../hooks/auth/useAuth";

export function DashboardPage() {
  const { user } = useAuth();

  return (
    <main className="h-full text-center content-center">
      <h2 className="text-4xl font-semibold">
        Bienvenido, {user?.fullName} 👋
      </h2>
    </main>
  );
}
