import { Component, h, Prop, State } from "@stencil/core";
import { Registration } from "../../registration";
import { onChange, registrationState, registrationStore } from "../../store/registration-store";

const CODE_LENGTH = 4;

@Component({
  tag: "u-registration-email-verification",
  styleUrl: "registration-email-verification.css",
  shadow: false,
})
export class RegistrationEmailVerification {
  /** Whether to automatically send the verification code when this step becomes active. */
  @Prop({ attribute: "auto-send" }) autoSend = true;

  /** CSS classes to apply to the fieldset container. */
  @Prop({ attribute: "class-name" }) componentClassName?: string;

  /** CSS classes to apply to each individual digit input. */
  @Prop({ attribute: "input-class-name" }) inputClassName?: string;

  @State() code: string[] = Array(CODE_LENGTH).fill("");
  @State() isVerifying = false;

  private registrationInstance: Registration | null = null;
  private inputRefs: HTMLInputElement[] = [];
  private readonly inputKeys = Array.from({ length: CODE_LENGTH }, (_, index) => `digit-${index}`);
  private unsubscribers: (() => void)[] = [];

  async componentWillLoad() {
    this.registrationInstance = await Registration.getInstance();

    if (this.autoSend && !registrationState.verificationCodeSent && registrationState.rid) {
      await this.sendCode();
    }

    // Subscribe to step changes to handle auto-send when this step becomes active
    // (needed for slotted components where componentWillLoad fires before rid is available)
    if (this.autoSend) {
      this.unsubscribers.push(
        onChange("currentStepName", () => {
          this.tryAutoSend();
        }),
      );
    }
  }

  disconnectedCallback() {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
  }

  private tryAutoSend(): void {
    if (!this.autoSend || registrationState.verificationCodeSent || !registrationState.rid) return;
    this.sendCode();
  }

  private async sendCode(): Promise<void> {
    const helpers = this.registrationInstance?.helpers;
    if (!helpers) return;

    await helpers.sendEmailVerificationCode();
  }

  private handleInput = async (index: number, e: Event) => {
    const input = e.target as HTMLInputElement;
    const value = input.value;

    const digit = value.replace(/\D/g, "").slice(-1);

    const newCode = [...this.code];
    newCode[index] = digit;
    this.code = newCode;

    registrationStore.clearFieldError("verificationCode");

    if (digit && index < CODE_LENGTH - 1) {
      this.inputRefs[index + 1]?.focus();
    }

    const fullCode = newCode.join("");
    if (fullCode.length === CODE_LENGTH && !newCode.includes("")) {
      await this.verifyCode(fullCode);
    }
  };

  private handleKeyDown = (index: number, e: KeyboardEvent) => {
    if (e.key === "Backspace" && !this.code[index] && index > 0) {
      this.inputRefs[index - 1]?.focus();
    }
  };

  private handlePaste = async (e: ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData?.getData("text") || "";
    const digits = pastedText.replace(/\D/g, "").slice(0, CODE_LENGTH);

    if (digits.length > 0) {
      const newCode = Array(CODE_LENGTH).fill("");
      for (let i = 0; i < digits.length; i++) {
        newCode[i] = digits[i];
      }
      this.code = newCode;

      const focusIndex = Math.min(digits.length, CODE_LENGTH - 1);
      this.inputRefs[focusIndex]?.focus();

      if (digits.length === CODE_LENGTH) {
        await this.verifyCode(digits);
      }
    }
  };

  private async verifyCode(code: string): Promise<void> {
    if (this.isVerifying) return;

    this.isVerifying = true;
    const helpers = this.registrationInstance?.helpers;

    if (helpers) {
      const success = await helpers.verifyEmail(code);

      if (success) {
        registrationStore.getRootComponentRef()?.advanceToNextStep();
      } else {
        this.code = Array(CODE_LENGTH).fill("");
        this.inputRefs[0]?.focus();
      }
    }

    this.isVerifying = false;
  }

  render() {
    const isLoading = registrationState.loading;

    return (
      <fieldset class={this.componentClassName} aria-label="Verification code" aria-live="polite">
        {this.inputKeys.map((key, index) => (
          <input
            key={key}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autocomplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={this.code[index]}
            disabled={isLoading || this.isVerifying || registrationState.emailVerified}
            class={this.inputClassName}
            onInput={(e) => this.handleInput(index, e)}
            onKeyDown={(e) => this.handleKeyDown(index, e)}
            onPaste={this.handlePaste}
            ref={(el) => {
              if (el) this.inputRefs[index] = el;
            }}
            aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
          />
        ))}
      </fieldset>
    );
  }
}
