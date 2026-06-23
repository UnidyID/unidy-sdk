import type { StandaloneUnidyClient } from "@unidy.io/sdk/standalone";
import { createContext, useContext, useEffect } from "react";
import { startSessionAutoRefresh } from "./auth/token-refresh";
import type { HookCallbacks } from "./types";

const UnidyContext = createContext<StandaloneUnidyClient | null>(null);

export interface UnidyProviderProps {
  client: StandaloneUnidyClient;
  children: React.ReactNode;
  /**
   * Keep the session alive by refreshing the access token shortly before it
   * expires and when the tab regains focus. Default: true.
   */
  autoRefresh?: boolean;
  /** Refresh this many milliseconds before token expiry. Default: 30000. */
  autoRefreshSkewMs?: number;
  /** Success/error callbacks for the background refresh. */
  autoRefreshCallbacks?: HookCallbacks;
}

export function UnidyProvider({ client, children, autoRefresh = true, autoRefreshSkewMs, autoRefreshCallbacks }: UnidyProviderProps) {
  useEffect(() => {
    if (!autoRefresh) return;
    return startSessionAutoRefresh(client, {
      skewMs: autoRefreshSkewMs,
      callbacks: autoRefreshCallbacks,
    });
  }, [client, autoRefresh, autoRefreshSkewMs, autoRefreshCallbacks]);

  return <UnidyContext value={client}>{children}</UnidyContext>;
}

export function useUnidyClient(): StandaloneUnidyClient {
  const client = useContext(UnidyContext);
  if (!client) {
    throw new Error("useUnidyClient must be used within a <UnidyProvider>");
  }
  return client;
}
