import { jwtDecode } from "jwt-decode";
import type { TokenResponse } from "./api";
import type { TokenPayload } from "./auth";
import { authStore } from "./store/auth-store";

/** Complete a server-authenticated session through the same event path for sign-in and registration. */
export function completeAuthSession(response: TokenResponse): void {
  let payload: TokenPayload | undefined;
  try {
    payload = jwtDecode<TokenPayload>(response.jwt);
  } catch {
    /* Explicit sid also supports opaque tokens. */
  }
  const sid = response.sid || payload?.sid;
  if (sid) authStore.setSignInId(sid);
  if (payload?.email) authStore.setEmail(payload.email);
  authStore.setToken(response.jwt);
  authStore.setRefreshToken(response.refresh_token);
  authStore.setLoading(false);
  const root = authStore.getRootComponentRef();
  if (root) root.onAuth(response);
  else document.dispatchEvent(new CustomEvent("authEvent", { detail: response, bubbles: false }));
}
