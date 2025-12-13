# u-email-field

A unified email field component that automatically detects its context (auth or newsletter) and uses the appropriate store.

## Usage

### In Auth Context (within u-signin-root)

```html
<u-signin-root>
  <u-signin-step>
    <u-email-field class-name="my-custom-class"></u-email-field>
  </u-signin-step>
</u-signin-root>
```

### In Newsletter Context (within u-newsletter-root)

```html
<u-newsletter-root>
  <u-email-field
    class-name="my-custom-class"
    placeholder="Enter your email">
  </u-email-field>
</u-newsletter-root>
```

## Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `class-name` | `string` | `""` | Custom CSS class for styling |
| `placeholder` | `string` | `"Enter your email"` | Placeholder text for the input |
| `aria-label` | `string` | `"Email"` | Accessibility label |
| `disabled` | `boolean` | `false` | Whether the input is disabled (auth context only) |

## Behavior

- **Auto-detects context**: The component checks if it's within `u-signin-root` or `u-newsletter-root`
- **Auth context**: Uses `authStore`, includes form submission, supports disabled states
- **Newsletter context**: Uses `newsletterStore`, simpler input without form wrapper
- **State management**: Automatically syncs with the appropriate store based on context
