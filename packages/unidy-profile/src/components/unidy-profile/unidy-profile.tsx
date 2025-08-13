import { Component, Host, Prop, h } from "@stencil/core";
import { createStore, type ObservableMap } from "@stencil/store";
import { UnidyClient } from "@unidy.io/sdk-api-client";

export type ProfileStore = {
  loading: boolean;
  data: Record<string, string>;
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
      // TODO: Replace output with unidy-field components
      let output = document.getElementById("profile-output");
      if (output) {
        output.innerHTML = `<pre style="white-space: pre-wrap; background: #f5f5f5; padding: 10px; border-radius: 4px;">${JSON.stringify(resp, null, 2)}</pre>`;
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
