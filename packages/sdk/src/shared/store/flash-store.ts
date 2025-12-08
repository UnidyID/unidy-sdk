import { createStore } from "@stencil/store";

export type FlashVariant = "error" | "success" | "info";

export interface FlashMessage {
  text: string;
  variant: FlashVariant;
}

interface FlashState {
  message: FlashMessage | null;
}

const store = createStore<FlashState>({
  message: null,
});

class FlashStore {
  get state() {
    return store.state;
  }

  private setMessage(text: string, variant: FlashVariant) {
    store.state.message = { text, variant };
  }

  clear() {
    store.state.message = null;
  }

  set info(text: string) {
    this.setMessage(text, "info");
  }

  set success(text: string) {
    this.setMessage(text, "success");
  }

  set error(text: string) {
    this.setMessage(text, "error");
  }
}

export const Flash = new FlashStore();
export const flashState = store.state;
export const onFlashChange: <K extends keyof FlashState>(prop: K, cb: (value: FlashState[K]) => void) => () => void = store.onChange;
