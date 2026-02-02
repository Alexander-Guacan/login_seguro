import { createContext } from "react";
import type { User } from "../models/user";
import type { LoginRequestDTO } from "../dto/auth";
import type { LoginResult } from "../types/auth";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (values: LoginRequestDTO) => Promise<LoginResult>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);
