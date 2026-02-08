import { useState } from "react";
import { AiOutlineMenu, AiOutlineUser } from "react-icons/ai";
import { RiLoginBoxLine } from "react-icons/ri";
import { Link, NavLink } from "react-router";

export function NavBar() {
  const [open, setOpen] = useState(false);

  const hide = () => setOpen(false);

  const show = () => setOpen(true);

  return (
    <header className="navbar">
      <nav className="flex gap-x-5 justify-between">
        <Link
          to={"/"}
          className="flex gap-x-2 justify-center items-center text-2xl"
          onClick={hide}
        >
          <i className="not-italic">🔐</i>
          <h2 className="font-bold">SecLog</h2>
        </Link>

        <button className="md:hidden text-2xl" type="button" onClick={show}>
          <AiOutlineMenu />
        </button>
        <ul
          className={`nav-links ${open ? "nav-links--open" : "nav-links--closed md:flex"}`}
        >
          <li className="flex justify-end">
            <button className="md:hidden text-2xl" type="button" onClick={hide}>
              <AiOutlineMenu />
            </button>
          </li>
          <li>
            <NavLink
              className={({ isActive }) =>
                `${isActive ? "link-outline" : "link-solid"}`
              }
              to={"/login"}
              onClick={hide}
            >
              <RiLoginBoxLine />
              <span>Iniciar Sesión</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              className={({ isActive }) =>
                `${isActive ? "link-outline" : "link-solid"}`
              }
              to={"/register"}
              onClick={hide}
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
