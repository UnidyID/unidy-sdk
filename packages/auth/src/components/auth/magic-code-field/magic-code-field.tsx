import { Component, h, Prop, State } from "@stencil/core";
import { authState, authStore } from "../../../store/auth-store";
import { Auth } from "../../../auth.js";

@Component({
  tag: "magic-code-field",
  shadow: false,
})
export class MagicCodeField {
  @Prop({ attribute: "class-name" }) componentClassName = "";

  @State() codeDigits: string[] = ["", "", "", ""];

  private inputRefs: HTMLInputElement[] = [];

  private handleInput = (event: Event, index: number) => {
    const target = event.target as HTMLInputElement;
    const value = target.value.replace(/[^0-9]/g, "");

    const newDigits = [...this.codeDigits];
    newDigits[index] = value.slice(-1);
    this.codeDigits = newDigits;

    const fullCode = newDigits.join("");

    if (value && index < 3) {
      const nextInput = this.inputRefs[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }

    if (fullCode.length === 4) {
      this.authenticateWithCode(fullCode);
    }
  };

  private handleKeyDown = (event: KeyboardEvent, index: number) => {
    if (event.key === "Backspace" && !this.codeDigits[index] && index > 0) {
      const prevInput = this.inputRefs[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  private handlePaste = (event: ClipboardEvent) => {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData("text") || "";
    const digits = pastedData
      .replace(/[^0-9]/g, "")
      .slice(0, 4)
      .split("");

    while (digits.length < 4) {
      digits.push("");
    }

    this.codeDigits = digits;

    const firstEmptyIndex = digits.findIndex((digit) => !digit);
    const targetIndex = firstEmptyIndex !== -1 ? firstEmptyIndex : 3;
    if (this.inputRefs[targetIndex]) {
      this.inputRefs[targetIndex].focus();
    }

    const fullCode = digits.join("");
    if (fullCode.length === 4) {
      this.authenticateWithCode(fullCode);
    }
  };

  private authenticateWithCode = async (code: string) => {
    const authInstance = await Auth.getInstance();
    if (!authInstance) {
      console.error("Auth service not initialized");
      return;
    }

    await authInstance.helpers.authenticateWithMagicCode(code);
  };
  render() {
    if (authState.step !== "magic-code") {
      return null;
    }

    return (
      <div class={this.componentClassName} style={{ display: "flex", gap: "2px", width: "100%", justifyContent: "center" }}>
        {this.codeDigits.map((digit, index) => (
          <input
            // biome-ignore lint/suspicious/noArrayIndexKey:
            key={index}
            ref={(el) => {
              if (el) this.inputRefs[index] = el;
            }}
            type="text"
            inputmode="numeric"
            maxlength="1"
            value={digit}
            disabled={authState.loading}
            onInput={(event) => this.handleInput(event, index)}
            onKeyDown={(event) => this.handleKeyDown(event, index)}
            onPaste={index === 0 ? this.handlePaste : undefined}
            style={{
              // TODO refactor this
              width: "50px",
              height: "50px",
              textAlign: "center",
              fontSize: "18px",
              border: "2px solid #e2e8f0",
              borderRadius: "8px",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            class="magic-code-input"
            part="digit-input"
          />
        ))}
      </div>
    );
  }
}
