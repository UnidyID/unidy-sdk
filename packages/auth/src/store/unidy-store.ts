import { createStore } from "@stencil/store";

export interface State {
  apiKey: string;
  baseUrl: string;
}

const initialState: State = {
  apiKey: "",
  baseUrl: "",
};

const { state, reset, onChange } = createStore<State>(initialState);

export { state as unidyState, reset, onChange };
