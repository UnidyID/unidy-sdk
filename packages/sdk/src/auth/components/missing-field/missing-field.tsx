import { Component, h, Element } from "@stencil/core";
import { state as profileState } from "../../../profile/store/profile-store";
import { authState, missingFieldNames } from "../../store/auth-store";

@Component({
  tag: "u-missing-field",
  shadow: false,
})
export class MissingField {
  @Element() el!: HTMLElement;

  componentWillRender() {
    console.log("MissingField componentWillRender profileState.data:", profileState.data);
  }

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
