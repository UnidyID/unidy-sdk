import { readFileSync } from "node:fs";
import * as path from "node:path";
import type { BrowserContext } from "@playwright/test";
import type { SignedInSession } from "./sign-in";

export type SessionStorageData = Record<string, string>;

export function getSessionStoragePath() {
  return path.resolve(process.cwd(), "playwright/.auth/session.json");
}

export function readSessionStorageFromFile(sessionPath = getSessionStoragePath()): SessionStorageData {
  return JSON.parse(readFileSync(sessionPath, "utf-8")) as SessionStorageData;
}

export async function applySessionStorage(context: BrowserContext, session: SessionStorageData) {
  await context.addInitScript((data) => {
    for (const [key, value] of Object.entries(data)) {
      sessionStorage.setItem(key, String(value));
    }
  }, session);
}

export async function loadAuthenticatedContext(context: BrowserContext, signedIn: SignedInSession, sessionPath = getSessionStoragePath()) {
  await applySessionStorage(context, { ...readSessionStorageFromFile(sessionPath), unidy_token: signedIn.jwt });
  // Replaces the sign-in that the stored state from auth.setup carries.
  await context.addInitScript(({ sid, refreshToken }) => {
    localStorage.setItem("unidy_signin_id", sid);
    localStorage.setItem("unidy_refresh_token", refreshToken);
  }, signedIn);
}
