import { randomUUID } from "node:crypto";

export const randomEmail = (args: Partial<{ address: string; domain: string; raw?: true }> = {}) => {
  const { address = "test", domain = "unidy.de", raw = false } = args;
  if (raw) {
    return `${address}@${domain}`;
  }

  return `${address}+${randomUUID()}-SDK@${domain}`;
};
