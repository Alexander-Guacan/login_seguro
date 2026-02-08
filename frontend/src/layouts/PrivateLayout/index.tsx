import { Link, Outlet } from "react-router";
import { SideBar } from "../../components/SideBar";
import { useSideBar } from "../../hooks/useSideBar";
import { AiOutlineMenu } from "react-icons/ai";

export function PrivateLayout() {
  const { show } = useSideBar();

  return (
    <div className="flex h-dvh">
      <SideBar />
      <div className="grow px-6 py-5 flex flex-col gap-y-6 overflow-x-hidden">
        <menu className="md:hidden">
          <li className="flex gap-x-3 items-center text-xl">
            <button type="button" onClick={show}>
              <AiOutlineMenu />
            </button>
            <Link to={"/dashboard"} className="flex gap-x-2">
              <i className="not-italic">🔐</i>
              <h2 className="font-semibold">SecLog</h2>
            </Link>
          </li>
        </menu>
        <Outlet />
      </div>
    </div>
  );
}
