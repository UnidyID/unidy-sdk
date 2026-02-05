← [Back to main documentation](readme.md)

# Quick Start: Examples

This section contains small, self-contained examples that demonstrate common SDK use cases and can be used as a starting point for your own implementation.

Table of Contents

- [Quick Start: Examples](#quick-start-examples)
    - [Quick Start: Authentication Flow](#quick-start-authentication-flow)
    - [Quick Start: Newsletter implementation](#quick-start-newsletter-implementation)
    - [Quick Start: Ticket implementation](#quick-start-ticket-implementation)
    - [Quick Start: Profile Icon](#quick-start-profile-icon)
      - [Simple Profile Icon with Logout:](#simple-profile-icon-with-logout)
      - [Profile Icon with Hover Dropdown Menu:](#profile-icon-with-hover-dropdown-menu)
    - [Quick Start: Modal login](#quick-start-modal-login)
    - [Quick Start: Account Deletion](#quick-start-account-deletion)
    - [Quick Start: Profile QR Code](#quick-start-profile-qr-code)



### Quick Start: Authentication Flow

This example demonstrates a complete authentication flow. The SDK automatically shows the correct interface based on the user's authentication status.

> **Note:** This example uses [Tailwind CSS](https://tailwindcss.com/) utility classes for styling. You can replace these with your own CSS classes or include Tailwind in your project.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Unidy Auth Demo</title>
  <!-- Load Components -->
  <script type="module" src="https://cdn.jsdelivr.net/npm/@unidy.io/sdk@latest/dist/sdk/sdk.esm.js"></script>
</head>
<body>

  <!-- Configure the SDK -->
  <u-config base-url="https://your-unidy-instance.com" api-key="your-api-key"></u-config>

  <!-- This sign-in form is automatically shown to logged-out users -->
  <u-signin-root>
    <u-signin-step name="email">
      <u-email-field placeholder="Enter your email"></u-email-field>
      <u-submit-button for="email" text="Continue"></u-submit-button>
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
      <u-back-button class-name="mb-4 text-sm text-blue-500 hover:text-blue-700">← Back</u-back-button>
      <u-conditional-render when="auth.passwordEnabled">
        <u-password-field placeholder="Enter your password"></u-password-field>
        <u-submit-button for="password" text="Sign In"></u-submit-button>
      </u-conditional-render>
      <u-conditional-render when="auth.magicCodeEnabled">
        <u-send-magic-code-button class-name="mt-2 text-sm text-blue-500">Send Magic Code Instead</u-send-magic-code-button>
      </u-conditional-render>
    </u-signin-step>

    <u-signin-step name="magic-code">
      <u-back-button class-name="mb-4 text-sm text-blue-500 hover:text-blue-700">← Back</u-back-button>
      <p class="mb-4 text-gray-600">Enter the code sent to your email</p>
      <u-magic-code-field></u-magic-code-field>
      <u-error-message for="magicCode" class-name="text-red-500 text-sm mt-2"></u-error-message>
    </u-signin-step>

    <u-signin-step name="reset-password">
      <u-back-button restart class-name="mb-4 text-sm text-blue-500 hover:text-blue-700">← Start over</u-back-button>
      <p class="mb-4 text-gray-600">Enter your new password</p>
      <u-password-field for="new-password" placeholder="New password"></u-password-field>
      <u-password-field for="password-confirmation" placeholder="Confirm password"></u-password-field>
      <u-error-message for="resetPassword" class-name="text-red-500 text-sm mt-2"></u-error-message>
      <u-submit-button for="resetPassword" text="Reset Password"></u-submit-button>
    </u-signin-step>
  </u-signin-root>

  <!--
    PROFILE VIEW OPTIONS (choose ONE of the following three approaches):

    Option A: Custom profile with u-profile and u-field components
    Option B: u-full-profile with specific fields
    Option C: u-full-profile showing all fields
  -->

  <!-- Option A: Custom profile using u-profile and u-field for full control -->
  <u-signed-in>
    <h2>Welcome!</h2>
    <u-profile>
      <u-field field="first_name" render-default-label="true"></u-field>
      <u-field field="last_name" render-default-label="true"></u-field>
      <u-submit-button>Save Changes</u-submit-button>
    </u-profile>
    <u-logout-button>Sign Out</u-logout-button>
  </u-signed-in>

  <!-- Option B: u-full-profile with specific fields only -->
  <!--
  <u-signed-in>
    <div class="mb-6">
      <u-logout-button
        class-name="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
        Logout
      </u-logout-button>
      <h3 class="text-xl font-semibold text-gray-800 mt-4">Profile</h3>
      <p class="text-gray-600 text-sm">Manage your key and login data here at a central place.</p>
    </div>
    <u-full-profile fields="first_name,last_name,custom_attributes.your_custom_attribute_name" country-code-display-option="icon"></u-full-profile>
  </u-signed-in>
  -->

  <!-- Option C: u-full-profile showing all available fields -->
  <!--
  <u-signed-in>
    <div class="mb-6">
      <u-logout-button
        class-name="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
        Logout
      </u-logout-button>
      <h3 class="text-xl font-semibold text-gray-800 mt-4">Profile</h3>
      <p class="text-gray-600 text-sm">Manage your key and login data here at a central place.</p>
    </div>
    <u-full-profile country-code-display-option="icon"></u-full-profile>
  </u-signed-in>
  -->

</body>
</html>
```
### Quick Start: Newsletter implementation

This example demonstrates how to implement a newsletter subscription form using the Unidy SDK.

> **Note:** This example uses [Tailwind CSS](https://tailwindcss.com/) utility classes for styling.

```html
<!DOCTYPE html>
<html dir="ltr" lang="en">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=5.0" />
  <title>Newsletter Signup</title>

  <script type="module" src="https://cdn.jsdelivr.net/npm/@unidy.io/sdk@latest/dist/sdk/sdk.esm.js"></script>
  <script nomodule src="https://cdn.jsdelivr.net/npm/@unidy.io/sdk@latest/dist/sdk/sdk.js"></script>
</head>

<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
  <u-config base-url="https://your-unidy-instance.com" api-key="your-api-key"></u-config>

  <div class="bg-white/90 shadow-xl rounded-xl p-8 w-full max-w-2xl flex flex-col gap-6 border border-gray-200">
    <div class="flex flex-col items-center gap-2">
      <h1 class="text-3xl font-bold text-indigo-700">Subscribe to our Newsletter</h1>
    </div>

    <u-newsletter-root>
      <u-email-field placeholder="Enter your email" class-name="px-4 py-2 border border-gray-300 rounded-lg"></u-email-field>

      <div class="flex flex-col gap-2">
        <label class="text-gray-500 text-sm">Select newsletters</label>
        <u-newsletter-checkbox internal-name="internal-name-for-newsletter" checked="true"
          class-name="flex items-center gap-2"></u-newsletter-checkbox>
        <u-submit-button
          class-name="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 rounded-lg shadow transition border border-indigo-600 mt-4">
          Subscribe
        </u-submit-button>

        <div id="message-container" class="mt-4 text-center text-sm"></div>
      </div>
    </u-newsletter-root>
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
                <div class="ticket-card">
                    <h3><ticketable-value name="title"></ticketable-value></h3>
                    <p><ticketable-value name="starts_at" date-format="dd.MM.yyyy HH:mm"></ticketable-value></p>
                    <p><ticketable-value name="price" format="Price: {{value}}"></ticketable-value></p>

                    <!-- Access nested metadata properties -->
                    <p><ticketable-value name="metadata.category" default="General"></ticketable-value></p>

                    <!-- Conditional rendering based on metadata -->
                    <ticketable-conditional when="metadata.vip">
                        <span class="vip-badge">VIP</span>
                    </ticketable-conditional>

                    <!-- Export buttons (only show wallet if exportable) -->
                    <div class="actions">
                        <u-ticketable-export format="pdf">Download PDF</u-ticketable-export>
                        <ticketable-conditional when="exportable_to_wallet">
                            <u-ticketable-export format="pkpass">Add to Wallet</u-ticketable-export>
                        </ticketable-conditional>
                    </div>

                    <!-- Dynamic link using unidy-attr -->
                    <a unidy-attr unidy-attr-href="{{button_cta_url}}">View Details</a>
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

**Template Features:**

- `<ticketable-value>` - Display values with support for nested paths (`metadata.category`), date formatting, and default values
- `<ticketable-conditional>` - Conditionally render content based on property truthiness (e.g., show VIP badge only if `metadata.vip` exists)
- `unidy-attr` - Dynamically set HTML attributes from ticket data (e.g., `unidy-attr-href="{{button_cta_url}}"`)
- `<u-ticketable-export>` - Export tickets to PDF or Apple Wallet (pkpass)

### Quick Start: Profile Icon

These examples demonstrate a profile icon that displays the user's avatar and allows the user to navigate to their profile or log out.

> **Note:** These examples use [Tailwind CSS](https://tailwindcss.com/) utility classes for styling. The examples assume you have a `<u-signin-root id="sign-in-root">` element elsewhere on the page.

#### Simple Profile Icon with Logout:

```html
<!-- Your sign-in root (place elsewhere on the page) -->
<u-signin-root id="sign-in-root">
  <!-- ... sign-in steps ... -->
</u-signin-root>

<!-- Profile icon menu -->
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

### Quick Start: Modal login

This example demonstrates how to implement a modal login form using the Unidy SDK.

> **Note:** This example uses [Tailwind CSS](https://tailwindcss.com/) utility classes for styling.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Unidy Modal login Demo</title>
  <!-- Load Components -->
  <script type="module" src="https://cdn.jsdelivr.net/npm/@unidy.io/sdk@latest/dist/sdk/sdk.esm.js"></script>
</head>
<body class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">

    <!-- Configure the SDK -->
    <u-config base-url="https://your-unidy-instance.com" api-key="your-api-key"></u-config>

    <button id="loginBtn" class="hidden fixed top-6 right-6 z-50 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2">
        Sign In
    </button>

    <div id="loginModal" class="fixed inset-0 z-50 hidden items-center justify-center">
      <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      <div class="relative z-10 w-full max-w-md h-[520px] rounded-xl bg-white p-6 shadow-2xl">
        <button id="modal_close" aria-label="Close modal" class="absolute right-4 top-4 text-2xl text-gray-400 transition hover:text-gray-600">
          ×
        </button>
        <div class="h-full w-full grid place-items-center px-6 py-6">
          <u-signin-root id="signinRoot" language="en" class="block w-full max-h-full space-y-6">

            <!-- Email Step -->
            <u-signin-step name="email">
              <div class="flex flex-col items-center space-y-3 text-center">
                <h2 class="text-xl font-semibold text-gray-900">Welcome</h2>
                <p class="text-sm text-gray-500">Sign in and create a free account</p>
              </div>

              <div class="mt-6 space-y-4">
                <u-social-login-button provider="google"></u-social-login-button>
                <u-social-login-button provider="apple" theme="dark"></u-social-login-button>

                <div class="my-4 flex items-center">
                  <div class="flex-grow border-t border-gray-200"></div>
                  <span class="mx-3 text-xs font-medium text-gray-400">OR</span>
                  <div class="flex-grow border-t border-gray-200"></div>
                </div>

                <u-email-field class-name="px-4 py-2 mt-4 mb-2 border border-gray-300 rounded-lg w-full"></u-email-field>
                <u-error-message for="email"></u-error-message>
                <u-submit-button for="email" text="Weiter" class-name="px-4 py-2 border text-white bg-blue-500 rounded-lg disabled:opacity-50 w-full"></u-submit-button>
              </div>
            </u-signin-step>

            <!-- Registration Step -->
            <u-signin-step name="registration">
              <u-registration-button for="email" class-name="px-4 py-2 border text-white bg-blue-500 rounded-lg w-full">
                <div slot="registration-content">
                  <u-email-field class-name="px-4 py-2 mb-2 border border-gray-300 bg-gray-100 cursor-not-allowed w-full" aria-describedby="email-error"/>
                  <u-error-message id="email-error" for="email" class-name="mt-1 mb-4 text-sm text-red-500" />
                </div>
              </u-registration-button>
            </u-signin-step>

            <!-- Verification Step -->
            <u-signin-step name="verification">
              <u-conditional-render when="auth.passwordEnabled">
                <u-password-field placeholder="Enter your password"
                  class-name="px-4 py-2 mb-1 border border-gray-300 rounded-lg w-full"
                  aria-describedby="password-error"></u-password-field>
                <u-reset-password-button class-name="mb-4 text-sm text-blue-500">
                </u-reset-password-button>
                <u-error-message id="password-error" for="password" class-name="mt-1 mb-4 text-sm text-red-500"></u-error-message>
                <u-error-message for="resetPassword" class-name="mt-1 mb-4 text-sm text-red-500"></u-error-message>

                <u-submit-button for="password"
                  class-name="px-4 py-2 border text-white bg-blue-500 rounded-lg w-full"></u-submit-button>
              </u-conditional-render>

              <u-conditional-render when="auth.magicCodeEnabled">
                <u-conditional-render when="auth.magicCodeSent" is="false">
                  <div class="my-4 flex items-center">
                    <div class="flex-grow border-t border-gray-200"></div>
                    <span class="mx-3 text-xs font-medium text-gray-400">OR</span>
                    <div class="flex-grow border-t border-gray-200"></div>
                  </div>

                  <u-send-magic-code-button
                    class-name="px-4 py-2 border text-blue-500 bg-blue-50 rounded-lg text-center w-full"></u-send-magic-code-button>
                </u-conditional-render>
              </u-conditional-render>
            </u-signin-step>

            <!-- Magic Code Step -->
            <u-signin-step name="magic-code">
              <h3 class="text-center text-gray-600 my-4">Enter magic code you received in email</h3>

              <u-magic-code-field class-name="px-4 py-2 mb-2 rounded-lg"
                aria-describedby="magic-code-error"></u-magic-code-field>

              <u-error-message id="magic-code-error" for="magicCode"
                class-name="mt-1 mb-4 text-sm text-center text-red-500"></u-error-message>

              <u-send-magic-code-button
                class-name="px-4 py-2 border text-blue-500 bg-blue-50 rounded-lg text-center disabled:opacity-50 w-full"></u-send-magic-code-button>
            </u-signin-step>

            <!-- Missing Fields -->
            <u-signin-step name="missing-fields">
                      <div class="space-y-3 text-center">
                <h2 class="text-xl font-semibold text-gray-900">One last step!</h2>
                <p class="text-sm text-gray-500">Please complete your profile.</p>
              </div>
              <u-missing-field></u-missing-field>
              <u-missing-fields-submit-button></u-missing-fields-submit-button>
            </u-signin-step>

          </u-signin-root>
        </div>
      </div>
    </div>

    <u-signed-in>
      <div class="container">
        <div class="mb-6">
          <u-logout-button id="logout-button"
            class-name="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
          </u-logout-button>
          <h3 class="text-xl font-semibold text-gray-800 mt-4">Profile</h3>
          <p class="text-gray-600 text-sm">Manage your key and login data here at a central place.</p>
        </div>
        <u-full-profile country-code-display-option="icon"></u-full-profile>
      </div>
    </u-signed-in>

  <script type="module">
    import { Auth } from "https://cdn.jsdelivr.net/npm/@unidy.io/sdk@latest/dist/sdk/index.esm.js";

    const loginBtn = document.getElementById('loginBtn');
    const loginModal = document.getElementById('loginModal');
    const modalClose = document.getElementById('modal_close');
    const overlay = loginModal.querySelector(".absolute.inset-0");
    const signinRoot = document.getElementById("signinRoot");

    function openModal() {
      loginModal?.classList.remove('hidden');
      loginModal?.classList.add('flex');
    }

    function closeModal() {
      loginModal?.classList.remove('flex');
      loginModal?.classList.add('hidden');
    }

    loginBtn?.addEventListener('click', openModal);
    modalClose?.addEventListener('click', closeModal);
    overlay.addEventListener("click", closeModal);

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });

    signinRoot.addEventListener("authEvent", async (event) => {
      console.log("Auth event:", event.detail);
      loginBtn.classList.add('hidden');
      closeModal();
    });

    async function checkAuthState() {
      try {
        const auth = await Auth.getInstance();
        const isAuth = await auth.isAuthenticated();

        console.log('🔐 Auth check:', isAuth ? 'authenticated' : 'not authenticated');

        if (isAuth) {
          loginBtn.classList.add('hidden');
            closeModal();
        } else {
          loginBtn.classList.remove('hidden');
        }
      } catch (error) {
        console.error('❌ Auth check error:', error);
        loginBtn.classList.remove('hidden');
      }
    }

    // Initialize after DOM and Unidy SDK are ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(checkAuthState, 500);
      });
    } else {
      setTimeout(checkAuthState, 500);
    }
  </script>
</body>
</html>
```

### Quick Start: Account Deletion

This example demonstrates how to allow users to delete their own account by redirecting them to the Unidy profile page where the account deletion option is available.

The `u-jump-to-unidy` component handles authentication automatically - when clicked, it generates a one-time login token and redirects the user to the specified Unidy page.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Account Deletion Demo</title>
  <script type="module" src="https://cdn.jsdelivr.net/npm/@unidy.io/sdk@latest/dist/sdk/sdk.esm.js"></script>
</head>
<body>

  <!-- Configure the SDK -->
  <u-config base-url="https://your-unidy-instance.com" api-key="your-api-key"></u-config>

  <!-- Only show to authenticated users -->
  <u-signed-in>
    <div class="account-settings">
      <h2>Account Settings</h2>
      <p>Manage your account or permanently delete it.</p>

      <!-- Button to navigate to Unidy profile page where account deletion is available -->
      <u-jump-to-unidy
        path="/profile#logindata"
        class-name="delete-account-button">
        Delete My Account
      </u-jump-to-unidy>
    </div>
  </u-signed-in>

  <!-- Show login prompt for unauthenticated users -->
  <u-signed-in not>
    <p>Please sign in to manage your account.</p>
  </u-signed-in>

  <style>
    .account-settings {
      max-width: 400px;
      margin: 2rem auto;
      padding: 1.5rem;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
    }

    .delete-account-button {
      display: inline-block;
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background-color: #dc2626;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .delete-account-button:hover {
      background-color: #b91c1c;
    }

    .delete-account-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  </style>

</body>
</html>
```

**Notes:**
- The `path="/profile"` directs users to the Unidy profile page where the "Delete Account" option is located
- The button shows a loading state while generating the authentication token
- You can also open the page in a new tab by adding the `newtab` attribute: `<u-jump-to-unidy path="/profile" newtab>`
- For pages that don't require authentication (like terms of service), use the `no-auth` attribute

### Quick Start: Profile QR Code

This example demonstrates how to generate a QR code containing user profile data. The QR code encodes a greeting message with the user's name.

> **Note:** This example uses [Tailwind CSS](https://tailwindcss.com/) utility classes for styling and the [qrcode](https://www.npmjs.com/package/qrcode) library loaded from esm.sh CDN.

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Profile QR Code Demo</title>
  <script type="module" src="https://cdn.jsdelivr.net/npm/@unidy.io/sdk@latest/dist/sdk/sdk.esm.js"></script>
</head>
<body class="min-h-screen flex flex-col bg-gray-100 font-sans text-gray-800">
  <main class="flex-1 p-8">

    <!-- Configure the SDK -->
    <u-config base-url="https://your-unidy-instance.com" api-key="your-api-key" check-signed-in="true"></u-config>

    <div class="max-w-2xl mx-auto">
      <!-- Show this message when user is NOT signed in -->
      <u-signed-in not>
        <div class="mx-auto px-6 py-8 bg-white rounded-[18px] shadow-xl mt-6">
          <div class="mb-6">
            <h3 class="text-xl font-semibold text-gray-800">Profile QR</h3>
            <p class="text-gray-600 text-sm">Demonstrates generating a QR code externally.</p>
          </div>
          <p class="text-gray-700">Please sign in to view your profile QR code.</p>
        </div>
      </u-signed-in>

      <!-- Show the QR code canvas when user IS signed in -->
      <u-signed-in>
        <div class="mx-auto px-6 py-8 bg-white rounded-[18px] shadow-xl mt-6">
          <div class="mb-6">
            <h3 class="text-xl font-semibold text-gray-800">Profile QR</h3>
            <p class="text-gray-600 text-sm">Demonstrates generating a QR code externally.</p>
          </div>
          <!-- Canvas where the QR code will be rendered -->
          <canvas id="profile-qr" width="256" height="256"></canvas>
        </div>
      </u-signed-in>
    </div>
  </main>

  <script type="module">
    import QRCode from "https://esm.sh/qrcode@1.5.4";
    import { Auth, getUnidyClient } from "https://cdn.jsdelivr.net/npm/@unidy.io/sdk@latest/dist/sdk/index.esm.js";

    const auth = await Auth.getInstance();

    async function generateProfileQR() {
      const canvas = document.querySelector("#profile-qr");
      if (!canvas) return;

      try {
        const [error, user] = await getUnidyClient().profile.get();
        if (error || !user) return;

        const firstName = user.first_name?.value ?? "";
        const lastName = user.last_name?.value ?? "";

        const text = `hello ${firstName} ${lastName}`;

        await QRCode.toCanvas(canvas, text, {
          width: 256,
          margin: 2,
          errorCorrectionLevel: "M",
        });
      } catch (e) {
        console.error(e);
      }
    }

    window.addEventListener("appload", () => {

      auth.isAuthenticated().then((isAuthenticated) => {
        if (isAuthenticated) {
          generateProfileQR();
        }
      });
    });
  </script>
</body>
</html>
```

**Notes:**
- The QR code encodes a simple greeting with the user's first and last name
- The `qrcode` library is loaded from esm.sh CDN
- The QR code is generated on `appload` if the user is authenticated
- You can adjust QR code options like `width`, `margin`, and `errorCorrectionLevel` as needed
