import { Component, h, Element } from "@stencil/core";
import { authState, missingFieldNames } from "../../store/auth-store";

@Component({
  tag: "u-missing-field",
  shadow: false,
})
export class MissingField {
  @Element() el!: HTMLElement;

  componentWillLoad() {}

  render() {
    if (authState.step !== "missing-fields") return null;

    const fieldNames = missingFieldNames();

    return (
      <div class="missing-fields">
        <form>
          {fieldNames.map((fieldName) => (
            <u-field key={fieldName} field={fieldName} renderDefaultLabel={true} />
          ))}
        </form>
      </div>
    );
  }
}
