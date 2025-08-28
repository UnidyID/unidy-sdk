import { Component, Host, Prop, h } from "@stencil/core";
import { createStore, type ObservableMap } from "@stencil/store";
import { UnidyClient } from "@unidy.io/sdk-api-client";

type ProfileRaw = Record<string, unknown>;

type Option = { value: string; label: string };
type RadioOption = { value: string; label: string; checked: boolean };
type LockedField = {
  locked: boolean;
  locked_text: string;
};

interface ProfileNode {
  value?: unknown;
  type?: string;
  label?: string;
  required?: boolean;
  locked?: LockedField;
  options?: Array<{ value?: unknown; label?: string }>;
  radio_options?: Array<{ value?: unknown; label?: string; checked?: unknown }>;
}

type FieldValue = {
  value: string;
  type: string;
  label: string;
  required: boolean;
  locked: LockedField | undefined;
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
      let idToken = window.UNIDY?.auth?.id_token;
      if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        if (params.has("id_token")) {
          idToken = params.get("id_token") || idToken;
          this.store.state.idToken = String(idToken);
        }
      }
      if (!idToken) {
        this.store.state.loading = false;
        return;
      }
      const client = new UnidyClient(this.apiUrl, this.apiKey);
      this.store.state.client = client;
      const resp = await client.profile.fetchProfile(idToken);
      this.store.state.configuration = JSON.parse(JSON.stringify(resp.data));

      this.store.state.data = this.parseProfileConfig(this.store.state.configuration || {});
      this.store.state.loading = false;
    } else {
      this.store.state.loading = false;
    }
  }

  componentDidLoad() {
    this.store.onChange("configuration", () => {
      this.store.state.data = this.parseProfileConfig(this.store.state.configuration || {});

      const output = document.getElementById("profile-update-message");
      if (output) {
        output.innerHTML = `<div style="
          background: #38d39f;
          color: #fff;
          padding: 14px 18px;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          margin-top: 12px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(56,211,159,0.12);
        ">
          &#10003; Profile is updated
        </div>`;
      }
    });

    this.store.onChange("errors", () => {
      const output = document.getElementById("profile-update-message");
      if (output) {
        output.innerHTML = `<div style="
          background: #f7b7b7;
          color: #721c24;
          padding: 14px 18px;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          margin-top: 12px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(247,183,183,0.12);
        ">
          &#10008; Profile update failed - ${Object.entries(this.store.state.errors)
            .map(([key, value]) => `${key}: ${value}`)
            .join(", ")}
        </div>`;
      }
    });
  }

parseProfileConfig(config: ProfileRaw): Record<string, FieldValue> {
  const toFieldValue = (node: ProfileNode): FieldValue => {
    const value = node?.value == null ? "" : String(node.value);
    const type = node?.type ? String(node.type) : "text";
    const label = node?.label ? String(node.label) : "";
    const required = !!node?.required;

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

    const locked: LockedField | undefined = node?.locked
      ? {
          locked: node.locked.locked === true,
          locked_text:
            typeof node.locked.locked_text === "string"
              ? node.locked.locked_text
              : "",
        }
      : undefined;

    return { value, type, label, required, locked, options, radioOptions };
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
    return (
      <Host>
        <slot />
      </Host>
    );
  }
}
