import { Link } from "react-router";

export function NavBar() {
  return (
    <header className="">
      <nav className="flex justify-between p-8">
        <Link to={"/"} className="inline-flex items-center">
          <i className="text-2xl not-italic">🔐</i>
          <h1 className="font-semibold text-2xl">SecLog</h1>
        </Link>
        <ul className="flex gap-x-4">
          <li>
            <Link className="link" to={"/login"}>
              Iniciar Sesión
            </Link>
          </li>
          <li>
            <Link className="link link--solid" to={"/register"}>
              Registrarse
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
