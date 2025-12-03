import { createStore } from "@stencil/store";

export interface State {
  apiKey: string;
  baseUrl: string;
  locale: string;
  isConfigured: boolean;

  backendConnected: boolean;
}

const initialState: State = {
  apiKey: "",
  baseUrl: "",
  locale: "en",
  isConfigured: false,

  backendConnected: true,
};

const store = createStore<State>(initialState);

export const unidyState = store.state;
export const reset = store.reset;
export const onChange: <K extends keyof State>(prop: K, cb: (value: State[K]) => void) => () => void = store.onChange;

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
