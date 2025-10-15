import { Component, h, Prop } from "@stencil/core";
import { authState } from "../../../store/auth-store";
import { Auth } from "../../../auth";

@Component({
  tag: "error-message",
  shadow: false,
})
export class ErrorMessage {
  @Prop() customStyle = "";
  @Prop() for!: "email" | "magicCode" | "password" | "general";

  private defaultErrorMessage(error: string): string {
    switch (error) {
      case Auth.Errors.email.NOT_FOUND:
        return "Account not found";
      case Auth.Errors.password.INVALID:
        return "Invalid password";
      case Auth.Errors.magicCode.RECENTLY_CREATED:
        return "Magic code already sent. If you didn't receive one, please try again in a minute";
      case Auth.Errors.magicCode.EXPIRED:
        return "Magic code expired";
      case Auth.Errors.magicCode.USED:
        return "Magic code used";
      case Auth.Errors.magicCode.NOT_VALID:
        return "Magic code not valid";
      case Auth.Errors.general.ACCOUNT_LOCKED:
        return "Account locked beacuse of too many failed attempts. Try again later";
      case Auth.Errors.general.SIGN_IN_EXPIRED:
        return "Sign in expired. Please go back and enter your email again";
      default:
        return error || "An error occurred";
    }
  }

  private shouldShowError(error: string): boolean {
    switch (this.for) {
      case "magicCode":
        return (Object.values(Auth.Errors.magicCode) as string[]).includes(error);
      case "email":
        return (Object.values(Auth.Errors.email) as string[]).includes(error);
      case "password":
        return (Object.values(Auth.Errors.password) as string[]).includes(error);
      case "general":
        return (Object.values(Auth.Errors.general) as string[]).includes(error);
      default:
        return true;
    }
  }

  render() {
    if (!authState.error || !this.shouldShowError(authState.error)) {
      return null;
    }

    return <div class={this.customStyle}>{this.defaultErrorMessage(authState.error)}</div>;
  }
}
