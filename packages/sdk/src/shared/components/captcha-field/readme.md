# u-captcha-field



<!-- Auto Generated Below -->


## Overview

Captcha field component that renders a captcha widget when required

Usage:
```html
<u-captcha-field feature="login"></u-captcha-field>
```

The component automatically:
- Hides itself when captcha is not configured or not enabled for the feature
- Shows a widget for challenge-based providers (Turnstile, hCaptcha, Friendly Captcha)
- Is invisible for reCAPTCHA v3 (score-based)

## Properties

| Property             | Attribute    | Description                                                         | Type                                        | Default                   |
| -------------------- | ------------ | ------------------------------------------------------------------- | ------------------------------------------- | ------------------------- |
| `ariaLabel`          | `aria-label` | Accessible label for the captcha                                    | `string`                                    | `"Security verification"` |
| `componentClassName` | `class-name` | Custom CSS class for the container                                  | `string`                                    | `""`                      |
| `feature`            | `feature`    | The feature this captcha protects (login, registration, newsletter) | `"login" \| "newsletter" \| "registration"` | `"login"`                 |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
