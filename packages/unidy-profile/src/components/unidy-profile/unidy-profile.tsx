import { Component, Host, Prop, h } from "@stencil/core";
import { createStore, type ObservableMap } from "@stencil/store";

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

  @Prop() id: string;

  @Prop() initialData: string | Record<string, string> = "";

  componentWillLoad() {
    if (this.initialData !== "") {
      if (typeof this.initialData === "string") {
        this.store.state.data = JSON.parse(this.initialData);
      } else {
        this.store.state.data = this.initialData;
      }

      this.store.state.loading = false;
    } else {
      // pretend we're fetching data
      this.store.state.data = {};
      setTimeout(() => {
        this.store.state.loading = false;
      }, 1000);
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
