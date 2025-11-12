import { Component, h, Prop } from "@stencil/core";
import { newsletterStore } from "../../store/store";

@Component({
  tag: "email-field",
  shadow: false,
})
export class EmailField {
  @Prop() placeholder = "Email";
  @Prop() className: string | undefined;

  render() {
    return (
      <input
        type="email"
        name="email"
        part="input"
        style={{ width: "100%" }}
        autoComplete="email"
        class={this.className}
        placeholder={this.placeholder}
        value={newsletterStore.get("email")}
        onChange={(e) => newsletterStore.set("email", (e.target as HTMLInputElement).value)}
      />
    );
  }
}
