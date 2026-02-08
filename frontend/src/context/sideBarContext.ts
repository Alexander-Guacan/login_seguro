import { createContext } from "react";

export interface SideBarContextType {
  open: boolean;
  show: () => void;
  hide: () => void;
}

export const SideBarContext = createContext<SideBarContextType | null>(null);
