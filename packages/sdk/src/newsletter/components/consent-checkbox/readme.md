# Newsletter Consent Checkbox

The `u-newsletter-consent-checkbox` component provides a GDPR-compliant consent checkbox for newsletter subscriptions. Users must check this box before they can subscribe to newsletters.

## Usage

```html
<u-newsletter-root>
  <!-- Other newsletter components -->
  
  <label class="flex items-center gap-2">
    <u-newsletter-consent-checkbox
      class-name="w-4 h-4">
    </u-newsletter-consent-checkbox>
    <span>I agree to receive newsletters and accept the privacy policy</span>
  </label>
  <u-error-message for="consent"></u-error-message>
  
  <u-submit-button>Subscribe</u-submit-button>
</u-newsletter-root>
```

## Properties

| Property     | Type   | Default | Description                           |
| ------------ | ------ | ------- | ------------------------------------- |
| `class-name` | string | `""`    | CSS class name(s) for the checkbox    |

## Behavior

- The checkbox is **unchecked by default** to comply with GDPR requirements (consent must be explicit)
- If the user tries to submit without checking the consent box, an error will be shown
- The error is automatically cleared when the user checks the box
- This checkbox is only required for **new subscriptions**, not when managing existing subscriptions

## Methods

### `toggle()`
Toggles the checkbox state programmatically.

```javascript
const checkbox = document.querySelector('u-newsletter-consent-checkbox');
await checkbox.toggle();
```

### `setChecked(checked: boolean)`
Sets the checkbox state programmatically.

```javascript
const checkbox = document.querySelector('u-newsletter-consent-checkbox');
await checkbox.setChecked(true);
```

### `getConsentGiven()`
Returns the current consent state.

```javascript
const checkbox = document.querySelector('u-newsletter-consent-checkbox');
const hasConsent = await checkbox.getConsentGiven();
```

## Error Handling

Use `<u-error-message for="consent">` to display consent validation errors:

```html
<u-error-message for="consent" class-name="text-red-500 text-sm"></u-error-message>
```

The error message is localized and will display "Please accept the terms and conditions to subscribe" (or the equivalent in the configured language) when consent is not given.
