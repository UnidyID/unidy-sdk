import type { StandaloneUnidyClient } from "@unidy.io/sdk/standalone";
import { createContext, useContext } from "react";

const UnidyContext = createContext<StandaloneUnidyClient | null>(null);

export function UnidyProvider({ client, children }: { client: StandaloneUnidyClient; children: React.ReactNode }) {
  return <UnidyContext value={client}>{children}</UnidyContext>;
}

export function useUnidyClient(): StandaloneUnidyClient {
  const client = useContext(UnidyContext);
  if (!client) {
    throw new Error("useUnidyClient must be used within a <UnidyProvider>");
  }
  return client;
}
