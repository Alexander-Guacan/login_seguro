import { useState } from "react";
import { SideBarContext } from "../../context/sideBarContext";

export function SideBarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const show = () => setOpen(true);

  const hide = () => setOpen(false);

  return (
    <SideBarContext
      value={{
        open,
        show,
        hide,
      }}
    >
      {children}
    </SideBarContext>
  );
}
