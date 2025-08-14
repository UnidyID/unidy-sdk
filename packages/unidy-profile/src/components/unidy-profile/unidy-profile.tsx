import { Component, Host, Prop, h } from "@stencil/core";
import { createStore, type ObservableMap } from "@stencil/store";
import { UnidyClient } from "@unidy.io/sdk-api-client";

type ProfileRaw = Record<string, unknown>;

type Option = { value: string; label: string };
type RadioOption = { value: string; label: string; checked: boolean };

type FieldValue = {
  value: string;
  type: string;
  label: string;
  options?: Option[];
  radioOptions?: RadioOption[];
};

export type ProfileStore = {
  loading: boolean;
  data: Record<string, FieldValue>;
  configuration: ProfileRaw | undefined;
  errors: Record<string, string | null>;
};

@Component({
  tag: "unidy-profile",
  styleUrl: "unidy-profile.css",
  shadow: true,
})
export class UnidyProfile {
  @Prop() store: ObservableMap<ProfileStore> = createStore<ProfileStore>({
    loading: true,
    data: {},
    configuration: {},
    errors: {},
  });

  @Prop() id?: string;
  @Prop() initialData: string | Record<string, string> = "";
  @Prop() useUnidyAuthEnabled?: boolean;
  @Prop() apiUrl?: string;
  @Prop() apiKey?: string;

  async componentWillLoad() {
    if (this.initialData !== "") {
      this.store.state.data =
        typeof this.initialData === "string"
          ? JSON.parse(this.initialData)
          : this.initialData;
      this.store.state.loading = false;
    } else if (this.useUnidyAuthEnabled && this.apiUrl && this.apiKey) {
      let idToken = window.UNIDY?.auth?.id_token;
      if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        if (params.has("id_token")) {
          idToken = params.get("id_token") || idToken;
        }
      }
      if (!idToken) {
        this.store.state.loading = false;
        return;
      }
      const client = new UnidyClient(this.apiUrl, this.apiKey);
      const resp = await client.profile.fetchProfile(idToken);
      this.store.state.configuration = JSON.parse(JSON.stringify(resp.data));

      const toFieldValue = (node: any): FieldValue => {
        const value = node?.value == null ? "" : String(node.value);
        const type = node?.type ? String(node.type) : "text";
        const label = node?.label ? String(node.label) : "";
      
        let options: Option[] | undefined;
        if (Array.isArray(node?.options)) {
          options = node.options.map((o: any) => ({
            value: String(o.value),
            label: String(o.label),
          }));
        }
        let radioOptions: RadioOption[] | undefined;
        if (Array.isArray(node?.radio_options)) {
          radioOptions = node.radio_options.map((o: any) => ({
            value: String(o.value),
            label: String(o.label),
            checked: o.checked === true,
          }));
        }

        return { value, type, label, options, radioOptions };
      };

      const data: Record<string, FieldValue> = {};
      Object.entries(this.store.state.configuration || {})
        .filter(([k]) => k !== "custom_attributes")
        .forEach(([key, node]) => {
          data[key] = toFieldValue(node);
        });

      const cad = this.store.state.configuration?.custom_attributes ?? {};
      Object.entries(cad).forEach(([key, node]) => {
        data[key] = toFieldValue(node);
      });

      this.store.state.data = data as Record<string, FieldValue>;

      // For testing
      let output = document.getElementById("profile-output");
      if (output) {
        output.innerHTML = `<pre style="white-space: pre-wrap; background: #f5f5f5; padding: 10px; border-radius: 4px;">${JSON.stringify(
          this.store.state.configuration,
          null,
          2
        )}</pre>`;
        output.innerHTML += `<pre style="white-space: pre-wrap; background: #f7b7b7; padding: 10px; border-radius: 4px;">${JSON.stringify(
          this.store.state.data,
          null,
          2
        )}</pre>`;
      }
      this.store.state.loading = false;
    } else {
      this.store.state.loading = false;
    }
  }

  render() {
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
