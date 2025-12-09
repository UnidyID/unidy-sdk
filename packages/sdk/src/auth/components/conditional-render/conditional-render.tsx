import { Component, h, Prop, Host } from "@stencil/core";
import { authState, type AuthState } from "../../store/auth-store";

const SEMANTIC_SHORTCUTS: Record<string, (state: AuthState) => unknown> = {
  // login options
  passkeyEnabled: (state) => state.availableLoginOptions?.passkey,
  passwordEnabled: (state) => state.availableLoginOptions?.password,
  magicCodeEnabled: (state) => state.availableLoginOptions?.magic_link,
  socialLoginsEnabled: (state) => (state.availableLoginOptions?.social_logins?.length ?? 0) > 0,

  loading: (state) => state.loading,
  authenticated: (state) => state.authenticated,

  magicCodeSent: (state) => state.magicCodeStep === "sent" || state.magicCodeStep === "requested",
  magicCodeRequested: (state) => state.magicCodeStep === "requested",

  resetPasswordSent: (state) => state.resetPasswordStep === "sent" || state.resetPasswordStep === "requested",
  resetPasswordRequested: (state) => state.resetPasswordStep === "requested",
};

function getByPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (current === null || current === undefined) return undefined;
    return (current as Record<string, unknown>)[key];
  }, obj);
}

function isTruthy(value: unknown): boolean {
  return Boolean(value);
}

@Component({
  tag: "u-conditional-render",
  shadow: true,
})
export class ConditionalRender {
  @Prop() when!: string; // condition to check
  @Prop() is?: string; // optional value to compare against
  @Prop() not = false;

  private getValue(): unknown {
    if (!this.when) {
      console.warn("[u-conditional-render] 'when' prop is required");
      return false;
    }

    const shortcut = SEMANTIC_SHORTCUTS[this.when];
    if (shortcut) {
      return shortcut(authState);
    }

    return getByPath(authState, this.when);
  }

  private shouldRender(): boolean {
    const value = this.getValue();

    let result: boolean;

    if (this.is === undefined) {
      result = isTruthy(value);
    } else if (this.is === "enabled" || this.is === "true") {
      result = isTruthy(value);
    } else if (this.is === "disabled" || this.is === "false") {
      result = !isTruthy(value);
    } else {
      result = String(value) === String(this.is); // to compare exact value
    }

    return this.not ? !result : result;
  }

  render() {
    if (!this.shouldRender()) {
      return null;
    }

    return (
      <Host aria-live="polite">
        <slot />
      </Host>
    );
  }
}
