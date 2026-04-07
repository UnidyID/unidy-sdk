import { authStorage } from "../auth-storage";
import { isTokenExpired } from "./jwt";

export interface SessionSnapshot {
  isAuthenticated: boolean;
  email: string;
  signInId: string | null;
}

export function readSessionSnapshot(): SessionSnapshot {
  const token = authStorage.getToken();

  return {
    isAuthenticated: !!token && !isTokenExpired(token),
    email: authStorage.getEmail() ?? "",
    signInId: authStorage.getSignInId(),
  };
}
