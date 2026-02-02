import { useAuth } from "../hooks/auth/useAuth";

export function Dashboard() {
  const { user } = useAuth();

  return (
    <main className="h-full text-center content-center">
      <h1 className="text-4xl font-semibold">
        Bienvenido, {user?.fullName} 👋
      </h1>
    </main>
  );
}
