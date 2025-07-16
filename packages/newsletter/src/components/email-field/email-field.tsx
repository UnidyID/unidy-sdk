import { Component, h, Prop } from "@stencil/core";
import { newsletterStore } from "../../store";

@Component({
  tag: "email-field",
  shadow: true,
})
export class EmailField {
  @Prop() placeholder = "Email";

  render() {
    return (
      <input
        type="email"
        placeholder={this.placeholder}
        value={newsletterStore.get("email")}
        onChange={(e) => newsletterStore.set("email", (e.target as HTMLInputElement).value)}
      />
    );
  }
}
