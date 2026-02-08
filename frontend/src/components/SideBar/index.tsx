import { Link, NavLink } from "react-router";
import { useAuth } from "../../hooks/auth/useAuth";
import { useMemo } from "react";
import type { UserRole } from "../../enums/userRole.enum";
import { MdOutlineDevices, MdOutlinePowerSettingsNew } from "react-icons/md";
import { AiOutlineMenu, AiOutlineUser } from "react-icons/ai";
import { IoLockOpenOutline } from "react-icons/io5";
import { PiUsersThree } from "react-icons/pi";
import { useSideBar } from "../../hooks/useSideBar";

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
  const { open, hide } = useSideBar();

  const closeSession = () => {
    logout();
    hide();
  };

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
            {
              label: "Dispositivos",
              to: "/devices",
              icon: <MdOutlineDevices />,
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
            {
              label: "Dispositivos",
              to: "/devices",
              icon: <MdOutlineDevices />,
            },
          ],
        },
      ],
    };

    return optionsByRole[user.role];
  }, [user]);

  return (
    <header className={`sidebar ${open ? "sidebar--open" : "sidebar--closed"}`}>
      <section className="py-5 flex gap-x-3 items-center text-xl">
        <button type="button" className="md:hidden" onClick={hide}>
          <AiOutlineMenu />
        </button>
        <Link to={"/dashboard"} className="flex gap-x-2" onClick={hide}>
          <i className="not-italic">🔐</i>
          <h2 className="font-semibold">SecLog</h2>
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
                      `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
                    }
                    to={to}
                    onClick={hide}
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
        <section className="bg-indigo-500/10 rounded-xl p-4 gap-x-5 flex justify-between items-center">
          <div className="flex gap-x-2 items-center">
            <AiOutlineUser className="text-xl" />
            <header className="flex flex-col justify-between">
              <h3 className="font-semibold text-sm">{user?.fullName}</h3>
              <p className="text-xs text-gray-800/80">{user?.roleName}</p>
            </header>
          </div>
          <button
            className="text-indigo-500 text-xl"
            type="button"
            onClick={closeSession}
            title="Cerrar sesión"
          >
            <MdOutlinePowerSettingsNew />
          </button>
        </section>
      </div>
    </header>
  );
}
