import { createStore } from "@stencil/store";

export type FlashVariant = "error" | "success" | "info";

export interface FlashMessage {
  id: string;
  text: string;
  variant: FlashVariant;
}

interface FlashState {
  messages: FlashMessage[];
  autoRemoveDelay: number | null;
}

const store = createStore<FlashState>({
  messages: [],
  autoRemoveDelay: null,
});

let idCounter = 0;

class FlashStore {
  get state() {
    return store.state;
  }

  private addMessage(text: string, variant: FlashVariant): string {
    const id = `flash-${++idCounter}`;
    store.state.messages = [...store.state.messages, { id, text, variant }];

    if (store.state.autoRemoveDelay) {
      setTimeout(() => this.remove(id), store.state.autoRemoveDelay);
    }

    return id;
  }

  remove(id: string) {
    store.state.messages = store.state.messages.filter((m) => m.id !== id);
  }

  clear(variant?: FlashVariant) {
    if (variant) {
      store.state.messages = store.state.messages.filter((m) => m.variant !== variant);
    } else {
      store.state.messages = [];
    }
  }

  set success(text: string) {
    this.addMessage(text, "success");
  }

  set error(text: string) {
    this.addMessage(text, "error");
  }

  set info(text: string) {
    this.addMessage(text, "info");
  }
}

export const Flash = new FlashStore();
export const flashState = store.state;
export const onFlashChange: <K extends keyof FlashState>(prop: K, cb: (value: FlashState[K]) => void) => () => void = store.onChange;
