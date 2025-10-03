import { Component, h, Prop, Host } from "@stencil/core";
import { authState } from "../../../store/auth-store";

@Component({
  tag: "conditional-render",
  shadow: false,
})
export class ConditionalRender {
  @Prop() when!: string;
  @Prop() is!: "true" | "false";

  componentDidLoad() {
    // TODO: validate 'when' and 'is' and return error if 'expression' is invalid
  }

  private shouldRender(): boolean {
    if (!this.when) return false;

    const compareValue = this.is === "true";

    let actualValue: boolean;

    switch (this.when) {
      case "magicCodeSent":
        actualValue = authState.magicCodeSent;
        break;
      case "loading":
        actualValue = authState.loading;
        break;
      case "authenticated":
        actualValue = authState.authenticated;
        break;
      default:
        console.warn(`Unknown property: ${this.when}`);

        // don't render in case of invalid property
        return false;
    }

    return actualValue === compareValue;
  }

  render() {
    if (!this.shouldRender()) {
      return null;
    }

    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
