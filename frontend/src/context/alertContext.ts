import { createContext } from "react";
import type {
  AlertType,
  FloatingAlertPosition,
} from "../components/Alert/FloatingAlert";

export interface AlertOptions {
  type?: AlertType;
  position?: FloatingAlertPosition;
  duration?: number;
}

interface AlertContextType {
  showAlert: (message: string, options?: AlertOptions) => void;
  hideAlert: () => void;
}

export const AlertContext = createContext<AlertContextType | null>(null);
