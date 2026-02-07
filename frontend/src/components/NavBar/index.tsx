import { AiOutlineUser } from "react-icons/ai";
import { RiLoginBoxLine } from "react-icons/ri";
import { Link, NavLink } from "react-router";

export function NavBar() {
  return (
    <header className="p-8">
      <nav className="flex justify-between">
        <Link to={"/"} className="flex gap-x-2 justify-center items-center">
          <i className="text-2xl not-italic">🔐</i>
          <h2 className="font-bold text-2xl">SecLog</h2>
        </Link>
        <ul className="flex gap-x-8 items-center justify-end">
          <li>
            <NavLink
              className={({ isActive }) =>
                `flex gap-x-2 justify-center items-center ${isActive ? "link-outline" : "link-solid"}`
              }
              to={"/login"}
            >
              <RiLoginBoxLine />
              <span>Iniciar Sesión</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              className={({ isActive }) =>
                `flex gap-x-2 justify-center items-center ${isActive ? "link-outline" : "link-solid"}`
              }
              to={"/register"}
            >
              <AiOutlineUser />
              <span>Registrarse</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}
