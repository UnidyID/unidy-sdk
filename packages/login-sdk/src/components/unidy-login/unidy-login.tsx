import { Component, h, Prop, State, Listen, Element, Method, Event, type EventEmitter } from "@stencil/core";

@Component({
  tag: "unidy-login",
  styleUrl: "unidy-login.css",
  shadow: true,
})
export class UnidyLogin {
  @Element() el!: HTMLElement;

  @Prop() baseUrl = "";
  @Prop() clientId = "";
  @Prop() scope = "openid profile email";
  @Prop() responseType = "id_token";
  @Prop() prompt = "login";

  @State() isVisible = false;
  @State() iframeUrl = null;

  @Event() onAuth: EventEmitter<{ token: string }>;

  private dialogRef?: HTMLDialogElement;

  @Listen("keydown", { target: "document" })
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" && this.isVisible) {
      this.hide();
    }
  }

  componentDidLoad() {
    this.dialogRef = this.el.shadowRoot.querySelector("dialog") as HTMLDialogElement;
  }

  @Method()
  async show() {
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: this.scope,
      response_type: this.responseType,
      prompt: this.prompt,
      redirect_uri: window.location.origin,
    });

    this.iframeUrl = `${this.baseUrl}/oauth/authorize?${params.toString()}`;

    this.dialogRef.showModal();
    this.isVisible = true;
  }

  @Method()
  async hide() {
    this.dialogRef.close();
    this.isVisible = false;
  }

  private handleIframeLoad(event: Event) {
    const iframe = event.target as HTMLIFrameElement;

    try {
      // TODO figure out 'blocked href access of cross-origin frame blabla...'
      // TODO also blocked focus of input element in frame :sa

      const url = new URL(iframe.contentWindow?.location.href || "");

      if (url.origin === window.location.origin) {
        const token = url.hash
          .substring(1)
          .split("&")
          .find((param) => param.startsWith("id_token="))
          ?.split("=")[1];

        if (token) {
          this.hide();
          this.onAuth.emit({ token });
        }
      }
    } catch (error) {
      console.error("Error handling iframe load:", error);
    }
  }

  render() {
    return (
      <dialog class="unidy-dialog">
        <div class="dialog-content">
          <button type="button" class="close-button" onClick={() => this.hide()}>
            ×
          </button>
          <iframe src={this.iframeUrl} onLoad={(e) => this.handleIframeLoad(e)} class="login-iframe" title="Unidy Login" scrolling="no" />
        </div>
      </dialog>
    );
  }
}
