import { Component, Host, Prop, h } from "@stencil/core";
import { createStore, type ObservableMap } from "@stencil/store";
import { UnidyClient } from "@unidy.io/sdk-api-client";

type ProfileRaw = Record<string, unknown>;

type Option = { value: string; label: string };
type RadioOption = { value: string; label: string; checked: boolean };

interface ProfileNode {
  value?: unknown;
  type?: string;
  label?: string;
  required?: boolean;
  locked?: boolean;
  locked_text?: string;
  options?: Array<{ value?: unknown; label?: string }>;
  radio_options?: Array<{ value?: unknown; label?: string; checked?: unknown }>;
}

type FieldValue = {
  value: string | string[];
  type: string;
  label: string;
  required: boolean;
  locked: boolean | undefined;
  locked_text: string | undefined;
  options?: Option[];
  radioOptions?: RadioOption[];
};

export type ProfileStore = {
  loading: boolean;
  data: Record<string, FieldValue>;
  configuration: ProfileRaw | undefined;
  errors: Record<string, string | null>;
  idToken: string;
  client?: UnidyClient;
  configUpdateSource?: "fetch" | "submit";
  flashErrors: Record<string, string | null>;
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
    idToken: "",
    client: undefined,
    flashErrors: {},
  });

  @Prop() profileId?: string;
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
      let idToken = "";
      if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        if (params.has("id_token")) {
          idToken = params.get("id_token") || idToken;
          this.store.state.idToken = String(idToken);
        }
      }

      const client = new UnidyClient(this.apiUrl, this.apiKey);
      this.store.state.client = client;
      const resp = await client.profile.fetchProfile(idToken);

      if (resp?.success) {
        this.store.state.configuration = JSON.parse(JSON.stringify(resp.data));
        this.store.state.configUpdateSource = "fetch";
        this.store.state.errors = {};
        this.store.state.flashErrors = {};

        this.store.state.data = this.parseProfileConfig(this.store.state.configuration || {});
      } else {
        this.store.state.flashErrors = { [String(resp?.status)]: String(resp?.error) };
      }
      this.store.state.loading = false;
    } else {
      this.store.state.loading = false;
    }
  }

  componentDidLoad() {
    this.store.onChange("configuration", () => {
      this.store.state.data = this.parseProfileConfig(this.store.state.configuration || {});
    });
  }

parseProfileConfig(config: ProfileRaw): Record<string, FieldValue> {
  const toFieldValue = (node: ProfileNode): FieldValue => {
    let value: string | string[];
      if (node?.value == null) {
        value = "";
      } else if (Array.isArray(node.value)) {
        value = node.value.map(String);
      } else {
        value = String(node.value);
      }
    const type = node?.type ? String(node.type) : "text";
    const label = node?.label ? String(node.label) : "";
    const required = !!node?.required;
    const locked = !!node?.locked;
    const locked_text = node?.locked_text ? String(node.locked_text) : "";

    let options: Option[] | undefined;
    if (Array.isArray(node?.options)) {
      options = node.options.map((o) => ({
        value: String(o.value),
        label: String(o.label),
      }));
    }

    let radioOptions: RadioOption[] | undefined;
    if (Array.isArray(node?.radio_options)) {
      radioOptions = node.radio_options.map((o) => ({
        value: String(o.value),
        label: String(o.label),
        checked: o.checked === true,
      }));
    }

    return { value, type, label, required, locked, locked_text, options, radioOptions };
  };

  const data: Record<string, FieldValue> = {};
  for (const [key, node] of Object.entries(config || {})) {
    if (key !== "custom_attributes") {
      data[key] = toFieldValue(node as ProfileNode);
    }
  }

  const cad = config?.custom_attributes ?? {};
  for (const [key, node] of Object.entries(cad)) {
    data[key] = toFieldValue(node as ProfileNode);
  }

  return data as Record<string, FieldValue>;
}

  render() {
    const hasFieldErrors = Object.values(this.store.state.errors).some(Boolean);
    const errorMsg = Object.values(this.store.state.flashErrors).filter(Boolean).join(", ");
    const wasSubmit = this.store.state.configUpdateSource === "submit";
    return (
      <Host>
        <slot />
        {!hasFieldErrors && errorMsg && <flash-message variant="error" message={errorMsg}/>}
        {wasSubmit && !errorMsg && !hasFieldErrors && <flash-message variant="success" message="Profile is updated"/>}
      </Host>
    );
  }
}
