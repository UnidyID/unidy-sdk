// google-login-button.tsx
import { Component, h, Prop, getAssetPath } from "@stencil/core";
import { unidyState } from "../../../store/unidy-store";

@Component({
  tag: "google-login-button",
  shadow: false,
  assetsDirs: ['assets']
})
export class GoogleLoginButton {
  @Prop() text = "Continue with Google";
  @Prop() customStyle = "";
  @Prop() googleIcon = "google-icon.svg";

  private onClick = async () => {
    const baseUrl = unidyState.baseUrl;
    window.location.href = `${baseUrl}/users/auth/google_oauth2?sdk_redirect_uri=http%3A%2F%2Flocalhost%3A3333`;
  };

  private imageSrc = getAssetPath(`./assets/${this.googleIcon}`);
  render() {
    
    return (
      <button type="button" class={this.customStyle} onClick={this.onClick}>
        <img src={this.imageSrc} alt="Google Icon" class="w-5 h-5 object-contain"/>
        <span>{this.text}</span>
      </button>
    );
  }
}
