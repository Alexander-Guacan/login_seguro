import { Outlet } from "react-router";
import { NavBar } from "../../components/NavBar";

export function PublicLayout() {
  return (
    <div className="flex flex-col h-dvh">
      <NavBar />
      <div className="grow">
        <Outlet />
      </div>
    </div>
  );
}
