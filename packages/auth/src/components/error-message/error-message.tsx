import { Component, h, Prop } from "@stencil/core";
import { authState } from "../../store/auth-store";
import { Auth } from "../../auth";

@Component({
  tag: "unidy-auth-error-message",
  shadow: false,
})
export class ErrorMessage {
  @Prop() className = "text-red-500";

  private getErrorMessage(error: string): string {
    switch (error) {
      case Auth.Errors.INVALID_PASSWORD:
        return "Invalid password";
      case Auth.Errors.ACCOUNT_NOT_FOUND:
        return "Account not found";
      case Auth.Errors.ACCOUNT_LOCKED:
        return "Account locked. Try again later";
      default:
        return error || "An error occurred";
    }
  }

  render() {
    if (!authState.error) {
      return null;
    }

    return <span class={this.className}>{this.getErrorMessage(authState.error)}</span>;
  }
}
