import { Link, NavLink } from "react-router";

export function NavBar() {
  return (
    <header className="p-8">
      <nav className="flex justify-between">
        <Link to={"/"} className="inline-flex items-center">
          <i className="text-2xl not-italic">🔐</i>
          <h1 className="font-semibold text-2xl">SecLog</h1>
        </Link>
        <ul className="flex gap-x-4">
          <li>
            <NavLink
              className={({ isActive }) => `link ${isActive ? "hidden" : ""}`}
              to={"/login"}
            >
              Iniciar Sesión
            </NavLink>
          </li>
          <li>
            <NavLink
              className={({ isActive }) =>
                `link link--solid ${isActive ? "hidden" : ""}`
              }
              to={"/register"}
            >
              Registrarse
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}
