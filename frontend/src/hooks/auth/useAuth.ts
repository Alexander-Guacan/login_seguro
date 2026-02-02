import { useContext } from "react";
import { AuthContext } from "../../context/authContext";

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("No provider detected for this context (AuthContext)");
  }

  return context;
}
