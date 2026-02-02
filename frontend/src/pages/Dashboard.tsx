import { useAuth } from "../hooks/auth/useAuth";

export function Dashboard() {
  const { user } = useAuth();

  return (
    <main>
      <h1>
        Hello {user?.firstName} {user?.lastName}
      </h1>
    </main>
  );
}
