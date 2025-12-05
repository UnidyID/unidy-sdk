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
        <u-email-field
          mode="single-step"
          placeholder="Enter your email"
          class-name="px-4 py-2 mb-2 border border-gray-300 rounded-lg w-full"
          aria-describedby="email-error"
        />

        <u-error-message id="email-error" for="email" class-name="mt-1 mb-4 text-sm text-red-500" />

        <u-password-field
          mode="single-step"
          placeholder="Enter your password"
          class-name="px-4 py-2 mb-1 border border-gray-300 rounded-lg w-full"
          aria-describedby="password-error"
        />

        <u-reset-password-button text="Reset Password" class-name="mb-4 text-sm text-blue-500" />

        <u-error-message id="password-error" for="password" class-name="mt-1 mb-4 text-sm text-red-500" />

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
