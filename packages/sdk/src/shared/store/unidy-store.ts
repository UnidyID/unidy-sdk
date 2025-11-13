import { createStore } from "@stencil/store";

export interface State {
  apiKey: string;
  baseUrl: string;
}

const initialState: State = {
  apiKey: "",
  baseUrl: "",
};

const store = createStore<State>(initialState);

export const unidyState = store.state;
export const reset = store.reset;
export const onChange: <K extends keyof State>(
  prop: K,
  cb: (value: State[K]) => void,
) => () => void = store.onChange;
