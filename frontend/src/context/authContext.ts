import { createContext } from "react";
import type { User } from "../models/user";
import type { LoginRequestDTO } from "../dto/auth";
import type { OperationResult } from "../types";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (values: LoginRequestDTO) => Promise<OperationResult>;
  logout: () => void;
  reloadSession: () => Promise<OperationResult>;
}

export const AuthContext = createContext<AuthContextType | null>(null);
