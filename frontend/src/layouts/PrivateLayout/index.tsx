import { Outlet } from "react-router";
import { SideBar } from "../../components/SideBar";

export function PrivateLayout() {
  return (
    <div className="flex h-dvh">
      <SideBar />
      <div className="grow px-6 py-5">
        <Outlet />
      </div>
    </div>
  );
}
