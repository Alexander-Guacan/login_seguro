import { useContext } from "react";
import { SideBarContext } from "../context/sideBarContext";

export function useSideBar() {
  const context = useContext(SideBarContext);

  if (!context) {
    throw new Error("No provider detected for this context (SideBarContext)");
  }

  return { ...context };
}
