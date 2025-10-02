import { Component, Host, Prop, h } from "@stencil/core";
import { createStore, type ObservableMap } from "@stencil/store";
import { UnidyClient } from "@unidy.io/sdk-api-client";
import { Auth } from "../../auth";
import { authStore } from "../../store/auth-store";

type Option = { value: string; label: string; icon?: string | null };
type RadioOption = { value: string; label: string; checked: boolean };

interface ProfileNode {
  value?: string | undefined | string[];
  type?: string;
  label?: string;
  required?: boolean;
  readonly?: boolean;
  locked?: boolean;
  locked_text?: string;
  options?: Option[];
  radio_options?: RadioOption[];
  attr_name?: string;
}

export type ProfileRaw = {
  custom_attributes?: Record<string, ProfileNode>;
} & Record<string, ProfileNode>;

export type ProfileStore = {
  loading: boolean;
  data: ProfileRaw;
  configuration: ProfileRaw;
  errors: Record<string, string | null>;
  idToken: string;
  client?: UnidyClient;
  configUpdateSource?: "fetch" | "submit";
  flashErrors: Record<string, string | null>;
  language?: string;
  phoneValid: boolean;
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
    language: "",
    phoneValid: true,
  });

  @Prop() profileId?: string;
  @Prop() initialData: string | Record<string, string> = "";
  @Prop() apiUrl?: string;
  @Prop() apiKey?: string;
  @Prop() language?: string;

  private authInstance?: Auth;
  private lastFetchedToken?: string;

  async componentWillLoad() {
    this.store.state.language = this.language;

    if (this.initialData !== "") {
      this.store.state.data = typeof this.initialData === "string" ? JSON.parse(this.initialData) : this.initialData;
    } else if (this.apiUrl && this.apiKey) {
      await this.authenticate();
      if (this.store.state.idToken) {
        this.lastFetchedToken = this.store.state.idToken;
        await this.fetchProfileData(this.store.state.idToken);
      }
    }

    this.store.state.loading = false;
  }

  async authenticate() {
    while (!Auth.isInitialized()) {
      await new Promise((r) => setTimeout(r, 10));
    }

    this.authInstance = await Auth.getInstance();

    const res = await this.authInstance.getToken();

    if (res instanceof Error) {
      this.store.state.loading = false;
      return;
    }

    const idToken = res;
    this.store.state.idToken = String(idToken);

    if (!idToken) {
      console.error("idToken not found");
      this.store.state.loading = false;
      return;
    }
  }

  async fetchProfileData(idToken: string) {
    if (!this.apiUrl || !this.apiKey) {
      return;
    }

    const client = new UnidyClient(this.apiUrl, this.apiKey);
    this.store.state.client = client;
    const resp = await client.profile.fetchProfile({ idToken, lang: this.language });

    if (resp.success) {
      this.store.state.configuration = JSON.parse(JSON.stringify(resp.data)) as ProfileRaw;
      this.store.state.configUpdateSource = "fetch";
      this.store.state.errors = {};
      this.store.state.flashErrors = {};

      this.store.state.data = JSON.parse(JSON.stringify(resp.data)) as ProfileRaw;
    } else {
      this.store.state.flashErrors = { [String(resp?.status)]: String(resp?.error) };
    }
  }

  componentDidLoad() {
    this.store.onChange("configuration", (cfg) => {
      this.store.state.data = cfg as ProfileRaw;
    });
  }

  componentWillRender() {
    const currentToken = authStore.state.token ?? "";
    this.store.state.idToken = currentToken;

    // Only fetch profile data if the token has changed and we have a valid token
    if (currentToken && currentToken !== this.lastFetchedToken) {
      this.lastFetchedToken = currentToken;
      this.fetchProfileData(currentToken);
      console.log("fetch profile for new token");
    }

    this.store.state.loading = false;
  }

  render() {
    const hasFieldErrors = Object.values(this.store.state.errors).some(Boolean);
    const errorMsg = Object.values(this.store.state.flashErrors).filter(Boolean).join(", ");
    const wasSubmit = this.store.state.configUpdateSource === "submit";

    if (authStore.state.authenticated) {
      return (
        <Host>
          <slot />
          {!hasFieldErrors && errorMsg && <flash-message variant="error" message={errorMsg} />}
          {wasSubmit && !errorMsg && !hasFieldErrors && <flash-message variant="success" message="Profile is updated" />}
        </Host>
      );
    }

    return <h2>Please sign in to view your profile</h2>;
  }
}
