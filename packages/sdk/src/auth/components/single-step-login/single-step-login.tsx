import { Component, h } from "@stencil/core";
import { authState } from "../../store/auth-store";
import { Auth } from "../..";

@Component({
  tag: "u-single-step-login",
  shadow: false,
})
export class SingleStepLogin {
  private async handleSignIn(event: Event) {
    event.preventDefault();

    if (authState.loading) return;
    if (!authState.email || !authState.password) return;

    const authInstance = await Auth.getInstance();
    if (!authInstance) {
      console.error("Auth service not initialized");
      return;
    }

    await authInstance.helpers.createSignIn(authState.email, authState.password);
  }

  private isDisabled(): boolean {
    if (authState.loading) return true;
    if (!authState.email || !authState.password) return true;
    return false;
  }

  render() {
    if (authState.step !== "single-login") return null;
    return (
      <div>
        <slot name="form" />

        <button
          type="button"
          onClick={(e) => this.handleSignIn(e)}
          disabled={this.isDisabled()}
          class="px-4 py-2 border text-white bg-blue-500 rounded-lg w-full disabled:opacity-50"
        >
          {authState.loading ? "Signing in..." : "Sign In"}
        </button>
      </div>
    );
  }
}
