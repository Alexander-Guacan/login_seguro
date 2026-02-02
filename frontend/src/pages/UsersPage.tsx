import { useUsers } from "../hooks/user/useUsers";

export function UsersPage() {
  const {
    data: users,
    page,
    totalPages,
    loading,
    nextPage,
    previousPage,
  } = useUsers();

  const prevButtonDisabled = !page || page <= 1;

  const nextButtonDisabled = !page || !totalPages || page >= totalPages;

  return (
    <main className="flex flex-col gap-6 h-full">
      <section className="px-6 py-4 rounded-md bg-sky-800">
        <h2>Bienvenido de vuelta 👋</h2>
      </section>
      <section className="table-container h-full">
        <header>
          <h2>Usuarios</h2>
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
                </tr>
              ))}
            </tbody>
            {!loading && !users?.length && (
              <tfoot>
                <td colSpan={5}>
                  <p>No hay usuarios</p>
                </td>
              </tfoot>
            )}
          </table>
        </div>
        <footer>
          <p>
            Página {page} de {totalPages}
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
