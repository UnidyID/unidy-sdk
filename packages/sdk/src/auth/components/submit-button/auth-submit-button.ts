import { t } from "../../../i18n";
import type { SubmitButtonContext } from "../../../shared/components/submit-button/context";
import { authState } from "../../store/auth-store";
import { getParentSigninStep } from "../helpers";

export type AuthButtonFor = "email" | "password" | "resetPassword";

export const authContext: SubmitButtonContext<AuthButtonFor> = {
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
          return t("auth.password.button_text", { defaultValue: "Sign In with Password" });
        }
        return t("buttons.submit");
      case "reset-password":
        if (forProp === "resetPassword") {
          return t("auth.resetPassword.button_text_set", { defaultValue: "Set Password" });
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
