import { Link } from "react-router";
import { useUsers } from "../hooks/user/useUsers";
import { useAuth } from "../hooks/auth/useAuth";
import { PageHeader } from "../components/PageSection/PageHeader";
import { LuUserRoundPlus, LuUserRoundX } from "react-icons/lu";
import { VscError } from "react-icons/vsc";
import { IoCheckmarkCircleOutline, IoSearch } from "react-icons/io5";
import { GoPencil } from "react-icons/go";
import { GrNext, GrPrevious } from "react-icons/gr";
import { RiResetLeftFill } from "react-icons/ri";
import { ImSpinner2 } from "react-icons/im";

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
    const searchText = searchInput.toString();
    search(searchText);
  };

  const hasResults = users && users.length > 0;

  const prevButtonDisabled = !page || page <= 1;

  const nextButtonDisabled = !page || !totalPages || page >= totalPages;

  return (
    <main className="flex flex-col gap-6 h-full overflow-y-hidden">
      <PageHeader
        title="Usuarios"
        breadcrumbsLabels={["Dashboard", "Usuarios"]}
      />
      <section className="table-container h-full">
        <header className="flex flex-col gap-y-4">
          <div className="flex justify-between items-center gap-x-4">
            <h2 className="table-container__title">Usuarios</h2>
            <Link
              className="link-solid flex gap-x-2 items-center text-sm"
              to={"/users/create"}
            >
              <LuUserRoundPlus />
              <span>Agregar</span>
            </Link>
          </div>
          <article className="flex justify-between items-center md:self-end">
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
              <button type="submit">
                <IoSearch />
              </button>
              <button type="reset">
                <RiResetLeftFill />
              </button>
            </form>
          </article>
        </header>
        <div className="table-wrapper">
          {!users ? (
            <div className="flex flex-col items-center justify-center">
              {loading ? (
                <>
                  <ImSpinner2 className="text-4xl text-gray-500/80 animate-spin" />
                  <p className="text-gray-500/80">Cargando usuarios</p>
                </>
              ) : (
                <>
                  <LuUserRoundX className="text-4xl text-gray-500/80" />
                  <p className="text-gray-500/80">No hay usuarios</p>
                </>
              )}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nombre completo</th>
                  <th>Email</th>
                  <th>Fecha de creación</th>
                  <th className="text-center">Activo</th>
                  {hasResults && <th className="text-center">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {users?.map((user) => (
                  <tr
                    key={user.id}
                    className={user.isActive ? "" : "text-gray-400"}
                  >
                    <td className="flex flex-col">
                      <span className="font-semibold">{user.fullName}</span>
                      <span className="text-gray-700/60 text-xs">
                        {user.roleName}
                      </span>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <time dateTime={user.createdAt.toISOString()}>
                        {user.createdAt.toLocaleDateString("es-EC")}
                      </time>
                    </td>
                    <td className="text-xl">
                      <span className="flex justify-center items-center">
                        {user.isActive ? (
                          <IoCheckmarkCircleOutline className="text-green-500" />
                        ) : (
                          <VscError className="text-red-500" />
                        )}
                      </span>
                    </td>
                    <td className="text-lg">
                      <ul className="flex justify-center items-center">
                        <li>
                          <Link
                            className="text-black"
                            to={
                              user.id === authUser?.id
                                ? "/profile"
                                : `/users/${user.id}`
                            }
                            title="Editar usuario"
                          >
                            <GoPencil />
                          </Link>
                        </li>
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <footer className="flex justify-between items-center text-sm">
          <p>
            {users?.length ?? 0} de {total ?? 0} resultados
          </p>
          <ul className="flex gap-x-4 items-center">
            <li className="flex items-center">
              <button
                disabled={prevButtonDisabled}
                type="button"
                title="Anterior página"
                onClick={previousPage}
              >
                <GrPrevious />
              </button>
            </li>
            <li>{page ?? 1}</li>
            <li className="flex items-center">
              <button
                disabled={nextButtonDisabled}
                type="button"
                title="Siguiente página"
                onClick={nextPage}
              >
                <GrNext />
              </button>
            </li>
          </ul>
        </footer>
      </section>
    </main>
  );
}
