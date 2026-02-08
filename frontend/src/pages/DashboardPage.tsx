import { AiOutlineUser } from "react-icons/ai";
import { PageHeader } from "../components/PageSection/PageHeader";
import { useAuth } from "../hooks/auth/useAuth";
import { useUsers } from "../hooks/user/useUsers";

export function DashboardPage() {
  const { user } = useAuth();
  const { total } = useUsers();

  return (
    <main className="flex flex-col gap-y-6">
      <PageHeader
        title={`Bienvenido de vuelta! ${user?.fullName} 👋`}
        breadcrumbsLabels={["Dashboard"]}
      />
      <article>
        <ul>
          <li>
            <section className="card">
              <span className="text-2xl">
                <AiOutlineUser />
              </span>
              <header>
                <h3 className="card__title">Usuarios</h3>
                <span className="card__value">{total}</span>
              </header>
            </section>
          </li>
        </ul>
      </article>
    </main>
  );
}
