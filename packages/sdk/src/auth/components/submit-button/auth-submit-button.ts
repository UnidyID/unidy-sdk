import { t } from "../../../i18n";
import type { SubmitButtonContext } from "../../../shared/components/submit-button/context";
import { findParentSigninRoot, findParentSigninStep } from "../../../shared/context-utils";
import { authState } from "../../store/auth-store";

export type AuthButtonFor = "email" | "password" | "resetPassword" | "single-login";

function getEmailInput(el: HTMLElement) {
  const signinRoot = findParentSigninRoot(el) || findParentSigninStep(el);
  const emailField = signinRoot?.querySelector("u-email-field");
  return emailField?.querySelector('input[type="email"]') as HTMLInputElement | null;
}

export const authContext: SubmitButtonContext<AuthButtonFor> = {
  handleClick: async (event: MouseEvent, el: HTMLElement, _forProp?: AuthButtonFor) => {
    event.preventDefault();

    const emailInput = getEmailInput(el);
    if (emailInput && !emailInput.checkValidity()) {
      emailInput.reportValidity();
      return;
    }

    await findParentSigninStep(el)?.submit();
  },

  isDisabled(forProp?: AuthButtonFor, disabled?: boolean): boolean {
    if (disabled || authState.loading) return true;

    if (authState.step === "email" && forProp === "email") {
      return authState.email === "";
    }

    if (authState.step === "single-login" && forProp === "single-login") {
      return authState.email === "" || authState.password === "";
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
          return t("auth.resetPassword.save_new_password", { defaultValue: "Set Password" });
        }
        return t("buttons.submit");
      case "single-login":
        if (forProp === "single-login") {
          return t("auth.single-login.button_text", { defaultValue: "Sign In" });
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

    if (authState.step === "single-login") {
      return forProp === "single-login";
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
