import { readFileSync } from "node:fs";
import * as path from "node:path";
import type { BrowserContext } from "@playwright/test";

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
