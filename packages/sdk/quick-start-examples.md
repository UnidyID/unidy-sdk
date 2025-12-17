← [Back to main documentation](readme.md)

# Quick Start: Examples

This section contains small, self-contained examples that demonstrate common SDK use cases and can be used as a starting point for your own implementation.


## Table of Contents

- [Quick Start: Authentication Flow](#quick-start-authentication-flow)
- [Quick Start: Newsletter implementation](#quick-start-newsletter-implementation)
- [Quick Start: Ticket implementation](#quick-start-ticket-implementation)
- [Quick Start: Profile Icon](#quick-start-profile-icon)


### Quick Start: Authentication Flow

This example demonstrates a complete authentication flow. The SDK automatically shows the correct interface based on the user's authentication status.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Unidy Auth Demo</title>
  <!-- Load Components -->
  <script type="module" src="https://cdn.jsdelivr.net/npm/@unidy.io/sdk@1.0.0-alpha.1/dist/sdk/sdk.esm.js"></script>
</head>
<body>

  <!-- Configure the SDK -->
  <u-config base-url="https://your-unidy-instance.com" api-key="your-api-key"></u-config>

  <!-- This sign-in form is automatically shown to logged-out users -->
  <u-signin-root>
    <u-signin-step name="email">
      <u-email-field placeholder="Enter your email"></u-email-field>
      <u-auth-submit-button for="email" text="Continue"></u-auth-submit-button>
    </u-signin-step>
    <div class="flex flex-col w-full space-y-4">
      <div class="flex items-center my-4">
        <div class="flex-1 border-t border-gray-300"></div>
        <h3 class="px-3 text-gray-600 font-medium">OR</h3>
        <div class="flex-1 border-t border-gray-300"></div>
      </div>

      <u-social-login-button text="Continue with Google" provider="google" theme="dark"></u-social-login-button>
      <u-social-login-button text="Continue with LinkedIn" provider="linkedin"></u-social-login-button>
      <u-social-login-button text="Continue with Unidy" provider="unidy" theme="dark" icon-only="true">
        <img slot="icon" src="https://www.unidy.io/unidy-logo-white.svg" alt="Unidy Logo" class="w-20 h-6" />
      </u-social-login-button>
    </div>
    <u-signin-step name="verification">
      <u-signin-strategy type="password">
        <u-password-field placeholder="Enter your password"></u-password-field>
        <u-auth-submit-button for="password" text="Sign In"></u-auth-submit-button>
      </u-signin-strategy>
    </u-signin-step>
  </u-signin-root>

  <!-- 3. This profile view is automatically shown to logged-in users -->
  <u-signed-in>
    <h2>Welcome!</h2>
    <u-profile>
      <u-field field="first_name" render-default-label="true"></u-field>
      <u-field field="last_name" render-default-label="true"></u-field>
      <u-profile-submit-button>Save Changes</u-profile-submit-button>
    </u-profile>
    <u-logout-button>Sign Out</u-logout-button>
  </u-signed-in>

  <!-- These are alternative implementations of the profile: -->

  <!-- 3.1 Full Profile Component: You can define specific fields. -->
  <u-signed-in>
    <div class="mb-6">
      <u-logout-button text="Logout"
        class-name="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
      </u-logout-button>
      <h3 class="text-xl font-semibold text-gray-800 mt-4">Profile</h3>
      <p class="text-gray-600 text-sm">Manage your key and login data here at a central place.</p>
    </div>
    <u-full-profile language="en" fields="first_name,last_name,custom_attributes.your_custom_attribute_name" country-code-display-option="icon"></u-full-profile>
  </u-signed-in>

  <!-- 3.2  If no fields are provided, the entire profile will be displayed. -->
   <u-signed-in>
    <div class="mb-6">
      <u-logout-button text="Logout"
        class-name="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
      </u-logout-button>
      <h3 class="text-xl font-semibold text-gray-800 mt-4">Profile</h3>
      <p class="text-gray-600 text-sm">Manage your key and login data here at a central place.</p>
    </div>
    <u-full-profile language="en" country-code-display-option="icon"></u-full-profile>
   </u-signed-in>

</body>
</html>
```
### Quick Start: Newsletter implementation

This example demonstrates how to implement a newsletter subscription form using the Unidy SDK.

```html
<!DOCTYPE html>
<html dir="ltr" lang="en">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0" />
  <title>Newsletter Signup</title>

  <script type="module" src="https://cdn.jsdelivr.net/npm/@unidy.io/sdk@1.0.0-alpha.1/dist/sdk/sdk.esm.js"></script>
  <script nomodule src="https://cdn.jsdelivr.net/npm/@unidy.io/sdk@1.0.0-alpha.1/dist/sdk/sdk.js"></script>
</head>

<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
  <div class="bg-white/90 shadow-xl rounded-xl p-8 w-full max-w-2xl flex flex-col gap-6 border border-gray-200">
    <div class="flex flex-col items-center gap-2">
      <h1 class="text-3xl font-bold text-indigo-700">Subscribe to our Newsletter</h1>
    </div>

    <email-field placeholder="Enter your email" class-name="px-4 py-2 border border-gray-300 rounded-lg"></email-field>

    <div class="flex flex-col gap-2">
      <label class="text-gray-500 text-sm">Select newsletters</label>
      <newsletter-checkbox label="Newsletter" internal-name="internal-name-for-newsletter" checked="true"
        class-name="flex items-center gap-2"></newsletter-checkbox>
      <submit-button api-key="your-api-key" api-url="https://your-unidy-instance.com"
        class-name="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg shadow transition border border-indigo-600 mt-4">
        <span>Subscribe</span>
      </submit-button>

      <div id="message-container" class="mt-4 text-center text-sm"></div>
    </div>
</body>
</html>
```
### Quick Start: Ticket implementation

This example demonstrates how to list tickets and subscriptions using the Unidy SDK.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Unidy Ticketable Demo</title>
    <script type="module" src="https://cdn.jsdelivr.net/npm/@unidy.io/sdk@latest/dist/sdk/sdk.esm.js"></script>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@unidy.io/sdk@latest/dist/sdk/sdk.css">
</head>
<body>

    <u-config base-url="https://your-unidy-instance.com" api-key="your-api-key"></u-config>

    <u-signed-in>
        <u-ticketable-list ticketable-type="ticket" limit="5">
            <template>
                <div>
                    <ticketable-value name="title"></ticketable-value>
                    <ticketable-value name="starts_at" date-format="dd.MM.yyyy"></ticketable-value>
                </div>
            </template>
            <div slot="pagination">
                <u-pagination-button direction="prev"></u-pagination-button>
                <u-pagination-page></u-pagination-page>
                <u-pagination-button direction="next"></u-pagination-button>
            </div>
        </u-ticketable-list>
    </u-signed-in>

</body>
</html>
```

### Quick Start: Profile Icon

These examples demonstrate a profile icon that displays the user’s avatar and allows the user to navigate to their profile or log out.

#### Simple Profile Icon with Logout:

```html
<u-signed-in>
  <div id="userMenu" class="flex items-center space-x-2" style="display: none;">
    <a href="profile/index.html" class="flex items-center p-2 rounded hover:bg-gray-100 transition-colors duration-200" aria-label="My Profile" title="My Profile">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </a>

    <u-logout-button></u-logout-button>
  </div>
</u-signed-in>

<script type="module">
  const userMenu = document.getElementById('userMenu');
  const signinRoot = document.getElementById("sign-in-root");

  signinRoot.addEventListener("authEvent", async (event) => {
    if (userMenu) userMenu.style.display = 'flex';
  });

  document.querySelector('u-logout-button')?.addEventListener('logout', () => {
    if (userMenu) userMenu.style.display = 'none';
  });
</script>
```
#### Profile Icon with Hover Dropdown Menu:

```html
<div id="userMenuWrapper" class="flex justify-end mb-4" style="display: none;">
  <div id="userMenu" class="relative inline-block group">
    <button class="flex items-center justify-center p-2 rounded-full bg-white border border-gray-300 shadow hover:bg-gray-50 focus:outline-none" aria-label="User menu">
      <svg class="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="8" r="4"></circle>
        <path d="M4 20c0-3.5 3.5-6 8-6s8 2.5 8 6"></path>
      </svg>
    </button>

    <div class="absolute left-0 right-0 top-full h-2"></div>

    <div class="absolute right-0 top-full z-20 mt-2 hidden w-48 rounded-lg border border-gray-300 bg-white shadow-xl group-hover:block">
      <a href="profile/index.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
        Profile Settings
      </a>

      <div class="border-t border-gray-200"></div>

      <u-logout-button class-name="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"></u-logout-button>
    </div>
  </div>
</div>

<script type="module">
  const userMenu = document.getElementById("userMenuWrapper");
  const signinRoot = document.getElementById("sign-in-root");

  signinRoot.addEventListener("authEvent", async (event) => {
    if (userMenu) userMenu.style.display = 'flex';
  });
</script>
```
