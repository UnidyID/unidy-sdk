# u-registration-resume

Displays a button to send a resume link when a registration flow already exists for the entered email. After the link is sent, shows a success message and a resend button with a 60-second cooldown timer.

The component is hidden when there is no conflicting registration flow (`emailAlreadyInFlow` is false).

## Slots

| Slot        | Description                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| (default)   | Content for the initial "send resume link" button.                                                      |
| `success`   | Message shown after the resume link has been sent (e.g. "Check your email").                            |
| `resend`    | Content for the resend button, shown alongside the success message after the initial send.              |

The resend button exposes a `data-countdown` attribute with the remaining seconds while the cooldown is active, which can be used for styling or displaying the timer.

## Usage

```html
<u-registration-resume class-name="mt-4">
  Send resume link
  <p slot="success">Check your email for a link to continue your registration.</p>
  <span slot="resend">Resend link</span>
</u-registration-resume>
```

<!-- Auto Generated Below -->


## Properties

| Property             | Attribute    | Description                                 | Type     | Default     |
| -------------------- | ------------ | ------------------------------------------- | -------- | ----------- |
| `componentClassName` | `class-name` | CSS classes to apply to the button element. | `string` | `undefined` |


## Events

| Event         | Description                                                              | Type                              |
| ------------- | ------------------------------------------------------------------------ | --------------------------------- |
| `resumeError` | Fired when sending the resume link fails. Contains the error identifier. | `CustomEvent<{ error: string; }>` |
| `resumeSent`  | Fired when the resume link email has been sent successfully.             | `CustomEvent<void>`               |


----------------------------------------------

*Built with [StencilJS](https://stenciljs.com/)*
