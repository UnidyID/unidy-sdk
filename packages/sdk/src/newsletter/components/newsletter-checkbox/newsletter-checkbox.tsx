import { Component, h, Prop } from "@stencil/core";
import { newsletterStore } from "../../store/store";

@Component({
  tag: "newsletter-checkbox",
  shadow: false,
})
export class NewsletterCheckbox {
  @Prop() label: string;
  @Prop() internalName: string;
  @Prop() checked: boolean;
  @Prop() className: string;

  componentWillLoad() {
    if (this.checked) {
      newsletterStore.set("checkedNewsletters", [...newsletterStore.get("checkedNewsletters"), this.internalName]);
    }
  }

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
      <label part="label" class={this.className}>
        <input type="checkbox" checked={this.checked} onChange={this.handleChange} part="input" />
        {this.label}
      </label>
    );
  }
}
