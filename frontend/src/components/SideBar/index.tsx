import { Link, NavLink } from "react-router";
import { useAuth } from "../../hooks/auth/useAuth";
import { useMemo } from "react";
import type { UserRole } from "../../enums/userRole.enum";
import { MdOutlinePowerSettingsNew } from "react-icons/md";
import { AiOutlineUser } from "react-icons/ai";
import { IoLockOpenOutline } from "react-icons/io5";
import { PiUsersThree } from "react-icons/pi";

interface NavOption {
  label: string;
  to: string;
  icon: React.ReactNode;
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
          options: [
            { label: "Perfil", to: "/profile", icon: <AiOutlineUser /> },
            {
              label: "Contraseña",
              to: "/password",
              icon: <IoLockOpenOutline />,
            },
          ],
        },
        {
          title: "Administración",
          options: [
            { label: "Usuarios", to: "/users", icon: <PiUsersThree /> },
          ],
        },
      ],
      CLIENT: [
        {
          title: "Usuario",
          options: [
            { label: "Perfil", to: "/profile", icon: <AiOutlineUser /> },
            {
              label: "Contraseña",
              to: "/password",
              icon: <IoLockOpenOutline />,
            },
          ],
        },
      ],
    };

    return optionsByRole[user.role];
  }, [user]);

  return (
    <header className="h-full px-6 min-w-66 border-r-gray-800/10 border-r grid grid-rows-[auto_1fr_auto] overflow-hidden">
      <section className="py-5">
        <Link to={"/dashboard"} className="flex gap-x-2">
          <i className="text-2xl not-italic">🔐</i>
          <h2 className="font-semibold text-2xl">SecLog</h2>
        </Link>
      </section>
      <nav className="flex flex-col gap-y-6 py-3 overflow-x-auto">
        {optionsByRole.map(({ title, options }) => (
          <section className="flex flex-col gap-y-3" key={`section-${title}`}>
            <h2 className="font-semibold">{title}</h2>
            <ul>
              {options.map(({ label, to, icon }) => (
                <li key={`label-${label}`}>
                  <NavLink
                    className={({ isActive }) =>
                      `nav-option ${isActive ? "nav-option--active" : ""}`
                    }
                    to={to}
                  >
                    {icon}
                    <span>{label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </nav>
      <div className="py-5">
        <section className="bg-indigo-500/10 rounded-xl p-4 flex justify-between items-center">
          <div className="flex gap-x-4 items-center">
            <AiOutlineUser />
            <header className="flex flex-col justify-between">
              <h3 className="font-semibold text-sm">{user?.fullName}</h3>
              <p className="text-xs text-gray-800/80">{user?.roleName}</p>
            </header>
          </div>
          <button
            className="text-indigo-500 text-xl"
            type="button"
            onClick={logout}
            title="Cerrar sesión"
          >
            <MdOutlinePowerSettingsNew />
          </button>
        </section>
      </div>
    </header>
  );
}
