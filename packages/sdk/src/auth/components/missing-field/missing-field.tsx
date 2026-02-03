import { Component, Element, h, Prop } from "@stencil/core";
import type { ProfileNode } from "../../../profile";
import type { RequiredFieldsResponse } from "../../api/auth";
import { authState } from "../../store/auth-store";

const missingRequiredUserDefaultFields = () => {
  const fields = authState.missingRequiredFields ?? ({} as RequiredFieldsResponse["fields"]);
  const { custom_attributes, ...missingRequiredUserDefaultFields } = fields;
  return missingRequiredUserDefaultFields as Record<string, ProfileNode>;
};

const missingRequiredCustomAttributeFields = () => {
  const fields = authState.missingRequiredFields ?? ({} as RequiredFieldsResponse["fields"]);
  return (fields?.custom_attributes ?? {}) as Record<string, ProfileNode>;
};

const missingFieldNames = () => {
  const userDefaultFields = Object.keys(missingRequiredUserDefaultFields());
  const ca = Object.keys(missingRequiredCustomAttributeFields()).map((k) => `custom_attributes.${k}`);
  return [...userDefaultFields, ...ca];
};

@Component({
  tag: "u-missing-field",
  shadow: false,
})
export class MissingField {
  @Element() el!: HTMLElement;
  @Prop({ attribute: "class-name" }) componentClassName?: string;

  render() {
    if (authState.step !== "missing-fields") return null;

    const fieldNames = missingFieldNames();

    return (
      <div class="missing-fields">
        <form>
          {fieldNames.map((fieldName) => (
            <u-field key={fieldName} field={fieldName} renderDefaultLabel={true} class-name={this.componentClassName} />
          ))}
        </form>
      </div>
    );
  }
}
