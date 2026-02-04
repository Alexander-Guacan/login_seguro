import { Link } from "react-router";
import { useUsers } from "../hooks/user/useUsers";
import { useAuth } from "../hooks/auth/useAuth";
import { PageHeader } from "../components/PageSection/PageHeader";

export function UsersPage() {
  const {
    data: users,
    page,
    totalPages,
    loading,
    total,
    nextPage,
    previousPage,
    search,
    resetSearch,
  } = useUsers();

  const { user: authUser } = useAuth();

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const target = event.currentTarget;
    const form = Object.fromEntries(new FormData(target));
    const { search: searchInput } = form;
    const searchText = searchInput.toString().trim().toLocaleLowerCase();
    search(searchText);
  };

  const hasResults = users && users.length > 0;

  const prevButtonDisabled = !page || page <= 1;

  const nextButtonDisabled = !page || !totalPages || page >= totalPages;

  return (
    <main className="flex flex-col gap-6 h-full">
      <PageHeader title="Usuarios" />
      <section className="table-container h-full">
        <header className="flex flex-col gap-y-4">
          <h2 className="table-container__title">Usuarios</h2>
          <article className="flex justify-between items-center">
            <Link className="link link--solid" to={"/user/create"}>
              Crear usuario
            </Link>
            <form
              className="flex gap-x-4 items-center"
              onSubmit={handleSearch}
              onReset={resetSearch}
            >
              <input
                type="search"
                name="search"
                id="search"
                placeholder="John Doe"
              />
              <button type="submit">🔎</button>
              <button type="reset">⟳</button>
            </form>
          </article>
        </header>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Activo</th>
                <th>Nombre completo</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Fecha de creación</th>
                {hasResults && <th>&nbsp;</th>}
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user.id}>
                  <td>{user.isActive ? "✅" : "❌"}</td>
                  <td>{user.fullName}</td>
                  <td>{user.email}</td>
                  <td>{user.roleName}</td>
                  <td>
                    <time dateTime={user.createdAt.toISOString()}>
                      {user.createdAt.toLocaleDateString("es-EC")}
                    </time>
                  </td>

                  <td>
                    <ul>
                      <li>
                        <Link
                          className="link link--solid"
                          to={
                            user.id === authUser?.id
                              ? "/profile"
                              : `/users/${user.id}`
                          }
                        >
                          Editar
                        </Link>
                      </li>
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
            {!loading && !users?.length && (
              <tfoot>
                <tr>
                  <td colSpan={5}>
                    <p>No hay usuarios</p>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
        <footer>
          <p>
            {users?.length} de {total} resultados
          </p>
          <ul>
            <li>
              <button
                className="button"
                disabled={prevButtonDisabled}
                type="button"
                onClick={previousPage}
              >
                Anterior
              </button>
            </li>
            <li>{page}</li>
            <li>
              <button
                className="button"
                disabled={nextButtonDisabled}
                type="button"
                onClick={nextPage}
              >
                Siguiente
              </button>
            </li>
          </ul>
        </footer>
      </section>
    </main>
  );
}
