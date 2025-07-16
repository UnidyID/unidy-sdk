import { Component, h, Prop } from "@stencil/core";
import { newsletterStore } from "../../store";

@Component({
  tag: "newsletter-checkbox",
  shadow: true,
})
export class NewsletterCheckbox {
  @Prop() label: string;
  @Prop() internalName: string;
  @Prop() checked: boolean;

  private handleChange = (e: Event) => {
    const isChecked = (e.target as HTMLInputElement).checked;

    if (isChecked) {
      newsletterStore.set("checkedNewsletters", [...newsletterStore.get("checkedNewsletters"), this.internalName]);
    } else {
      newsletterStore.set(
        "checkedNewsletters",
        newsletterStore.get("checkedNewsletters").filter((name) => name !== this.internalName),
      );
    }
  };

  render() {
    return (
      <label>
        <input type="checkbox" checked={this.checked} onChange={this.handleChange} />
        {this.label}
      </label>
    );
  }
}
