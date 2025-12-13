import { type FunctionalComponent } from "@stencil/core";
import { authState } from "../../store/auth-store";
import { getParentSigninStep } from "../helpers";
import { t } from "../../../i18n";
import type { SubmitButtonContext } from "../../../shared/components/submit-button/context";

export type AuthButtonFor = "email" | "password" | "resetPassword";

export interface AuthSubmitButtonProps {
  for?: AuthButtonFor;
}

export const AuthSubmitButton: FunctionalComponent<AuthSubmitButtonProps> = (_props, children) => {
  return children;
};

export const authContext: SubmitButtonContext = {
  handleClick: async (event: MouseEvent, el: HTMLElement) => {
    event.preventDefault();
    await getParentSigninStep(el)?.submit();
  },

  isDisabled(forProp?: AuthButtonFor, disabled?: boolean): boolean {
    if (disabled || authState.loading) return true;

    if (authState.step === "email" && forProp === "email") {
      return authState.email === "";
    }

    if (authState.step === "verification" && forProp === "password") {
      return authState.password === "";
    }

    if (authState.step === "reset-password" && forProp === "resetPassword") {
      return !authState.resetPassword.newPassword || !authState.resetPassword.passwordConfirmation;
    }

    return false;
  },

  isLoading(): boolean {
    return authState.loading;
  },

  getButtonText(forProp?: AuthButtonFor, text?: string): string {
    if (text) return text;

    switch (authState.step) {
      case "email":
        return t("buttons.continue");
      case "verification":
        if (forProp === "password") {
          return t("auth.password.buttonText", { defaultValue: "Sign In with Password" });
        }
        return t("buttons.submit");
      case "reset-password":
        if (forProp === "resetPassword") {
          return t("auth.resetPassword.buttonTextSet", { defaultValue: "Set Password" });
        }
        return t("buttons.submit");
      default:
        return t("buttons.submit");
    }
  },

  shouldRender(forProp?: AuthButtonFor): boolean {
    if (!authState.availableLoginOptions?.password && forProp === "password") {
      return false;
    }

    if (authState.step === "email") {
      return forProp === "email";
    }

    if (authState.step === "verification") {
      return forProp === "password" && authState.magicCodeStep !== "sent";
    }

    if (authState.step === "reset-password") {
      return forProp === "resetPassword";
    }

    return false;
  },
};
