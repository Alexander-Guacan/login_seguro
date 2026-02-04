import { Link, NavLink } from "react-router";
import { useAuth } from "../../hooks/auth/useAuth";
import { useMemo } from "react";
import type { UserRole } from "../../enums/userRole.enum";

interface NavOption {
  label: string;
  to: string;
}

interface NavSection {
  title: string;
  options: NavOption[];
}

export function SideBar() {
  const { user, logout } = useAuth();

  const optionsByRole = useMemo<NavSection[]>(() => {
    if (!user) return [];

    const optionsByRole: Record<UserRole, NavSection[]> = {
      ADMIN: [
        {
          title: "Usuario",
          options: [{ label: "Perfil", to: "/profile" }],
        },
        {
          title: "Seguridad",
          options: [{ label: "Contraseña", to: "/password" }],
        },
        {
          title: "Administración",
          options: [{ label: "Usuarios", to: "/users" }],
        },
      ],
      CLIENT: [
        {
          title: "Usuario",
          options: [{ label: "Perfil", to: "/profile" }],
        },
        {
          title: "Seguridad",
          options: [{ label: "Contraseña", to: "/password" }],
        },
      ],
    };

    return optionsByRole[user.role];
  }, [user]);

  return (
    <header className="h-full px-6 py-5 min-w-60 border-r-gray-600 border-r">
      <nav className="h-full flex flex-col gap-y-6">
        <Link to={"/dashboard"} className="inline-flex items-center w-fit">
          <i className="text-2xl not-italic">🔐</i>
          <h2 className="font-semibold text-2xl">SecLog</h2>
        </Link>
        <div className="grow flex flex-col justify-between">
          <div className="flex flex-col gap-y-6">
            {optionsByRole.map(({ title, options }) => (
              <section
                className="flex flex-col gap-y-3"
                key={`section-${title}`}
              >
                <h2 className="font-semibold">{title}</h2>
                <ul>
                  {options.map(({ label, to }) => (
                    <li key={`label-${label}`}>
                      <NavLink
                        className={({ isActive }) =>
                          `nav-option ${isActive ? "nav-option--selected" : ""}`
                        }
                        to={to}
                      >
                        {label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <button
            className="button button--danger"
            type="button"
            onClick={logout}
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>
    </header>
  );
}
