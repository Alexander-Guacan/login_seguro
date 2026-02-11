import { useUsers } from "../../hooks/user/useUsers";
import { AiOutlineUser } from "react-icons/ai";

export function AdminDashboard() {
  const { total } = useUsers();

  return (
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
  );
}
