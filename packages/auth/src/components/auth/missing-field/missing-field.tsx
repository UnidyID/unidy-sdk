import { Component, h, Element } from "@stencil/core";
import { state as profileState } from "../../../store/profile-store";
import { authState } from "../../../store/auth-store";

@Component({
  tag: "missing-field",
  shadow: false,
})
export class MissingField {
  @Element() el!: HTMLElement;

  private get fields() {
    return authState.missingRequiredFields as
      | { [k: string]: any; custom_attributes?: Record<string, any> }
      | undefined;
  }

  componentWillRender() {
    if (!this.fields) return;

    const ca = this.fields.custom_attributes ?? {};
    const top = Object.fromEntries(Object.entries(this.fields).filter(([k]) => k !== "custom_attributes"));

    profileState.data = {
      ...(profileState.data ?? {}),
      ...top,
      custom_attributes: {
        ...((profileState.data as any)?.custom_attributes ?? {}),
        ...ca,
      },
    } as any;
    console.log("MissingField componentWillRender profileState.data:", profileState.data);
  }

  private fieldPaths(): string[] {
    const f = this.fields;
    console.log("MissingField fieldPaths fields:", f);
    if (!this.fields) return [];

    const topLevel = Object.keys(this.fields).filter((k) => k !== "custom_attributes");
    console.log("MissingField fieldPaths topLevel:", topLevel);
    const ca = this.fields.custom_attributes ?? {};
    const custom = Object.keys(ca).map((k) => `custom_attributes.${k}`);
    return [...topLevel, ...custom];
  }

  render() {
    if (authState.step !== "missing-fields") return null;

    const paths = this.fieldPaths();
    console.log("Rendering MissingField for paths:", paths);

    return (
      <div class="missing-fields">
          <form>
            {paths.map((path) => (
              <u-field
                field={path}
                renderDefaultLabel={true}
              />
            ))}
          </form>
      </div>
    );
  }
}
