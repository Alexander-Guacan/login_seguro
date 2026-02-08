import { useContext } from "react";
import { AlertContext } from "../context/alertContext";

export function useAlert() {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error("No provider detected for this context (AuthContext)");
  }

  return {
    ...context,
  };
}
