import { createStore } from "@stencil/store";

export interface UnidyState {
  mode: "production" | "development";
  apiKey: string;
  baseUrl: string;
  locale: string;
  isConfigured: boolean;

  backendConnected: boolean;
}

const initialState: UnidyState = {
  mode: "production",
  apiKey: "",
  baseUrl: "",
  locale: "en",
  isConfigured: false,

  backendConnected: true,
};

const store = createStore<UnidyState>(initialState);

export const unidyState = store.state;
export const reset = store.reset;
export const onChange: <K extends keyof UnidyState>(prop: K, cb: (value: UnidyState[K]) => void) => () => void = store.onChange;

export function waitForConfig(): Promise<void> {
  if (unidyState.isConfigured) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const unsubscribe = onChange("isConfigured", (value) => {
      if (value) {
        unsubscribe();
        resolve();
      }
    });
  });
}
