// @ts-nocheck

import { useSyncExternalStore } from "react";

// We should have a <jump-to-service service_id="1"> button, that would log you into unidy, and then hit a oauth service in Unidy (it's connect URI)
// so we could have a 1 button log into Eventim 🤔

// Kinda related, kinda not
// What about "jump-to-unidy", or do we add a before_action on our main routes that if you arrive with an id_token we set a session for you
// or we even build a functionality that we init a session for you along with a long_lived refresh token... did I just say session twice, I did, but 🤔?

// IMPORTANT
// We should also separate our services / api fetchers / schemas, and some of our logic out of components
// into some reusable shit, so it can be used in RN... (once we have that, we could setup an "ai migration/sync" tool to keep our JS SDK in sync with a Swift and Kotlin ones (ok, and dart, despite me hating that language))
// besides just preloading (below), we need to figure out how to allow customers to fetch stuff on the backend (that probably includes making a swagger docs for SDK routes)
// and also making it so that our clients work without access to window/document/that you can communicate between them without any DOM structure

// PRELOAD IDEA
// we could have a "preload" thing, that could be used to speedup fetching for SSRing, but we could make it be an
// endpoint on our server (even faster), that would essentially work like graphql
// you hit it with [auth, 'newsletters?1238132', 'tickets', ...]
// we could also just hit Unidy with 3 requests, HTTP2 kinda makes this a not so big of an issue realistically speaking..., maybe a sprinkle of caching could make this more than ok
// and then we stream you back a JSON response, that you can encode in your HTML when SSRing (i.e. with wordpress)
// and then when the component boots up, it automatically has all the data without an additional roundtrip 🤔

// Guidelines
// - This shit needs to be optimistic AF and the UX should be as good as possible
// I.e. if you have a refresh_token cookie, we assume you're logged in, until proven otherwise
// - We should rewrite some components into native (react/react-native/vue/...) if they won't play well as web-components (i.e. the dom manipulation in ticketables),
// or provide examples with how to build it manually using our APIs (meaning SDK functions that we "use under the hood" to build the components themselves)
// - We should have a 3 types of components
//   "just works" experience (put component, it works)
//   "you can customize it" put a component there and style it or use a raw component and wrap it with things
//   "ok smartass, do it yourself" we provide SDKs that allow you to directly render your own stuff but use our "logic"

// Problems with current SDK that we need to fix by re-bundling
// - The CSS for "which elements" to hide, gets injected at runtime (so after the script is fetched)
// We should ship that as a separate <link> tag when you copy our snippet
// - SDK not really easily reusable outside of components

// IDEA for sharing custom "structured components", What if you could do something like this
// we can then pull this and render this when we need to to (i.e. required_fields, ...)
// we could even allow you to put any element inside of it and we mount listeners on it 🤔 (or require using raw fields 🤔)
// <unidy-config>
//   <unidy-field-template field="custom_attribute_country">
//     <div>
//       <label>THIS IS MY MEGA TURBO COOL LABEL</label>
//       <select name="custom_attributes.custom_attribute_country">
//         <option value="cro">🇭🇷</option>
//       </select>
//     </div>
//   </unidy-field-template>
// </unidy-config>

// <b>Open questions</b>
// How do we do optimistic
// Should reloading during a login flow kill your sign_in token, or keep it?
// Which events do we need to log (analytics)?
// Sentry?
// What other cases do we have?
// Current idea is to use a store and do bottom up approach of everything is pushing data up to the form, how about we try it the other way around? So you can pull data from the store on lower components, but when you click submit, "container" will find all "small" form elements, try and submit them one by one, when hitting an error it will report validity there and abort 🤔 (RHF ref mode)

// Thinks we should figure out / build
// - SWR primitive (or maybe use something of the shelf) for fetching data, should we also refetch on focus? (default of tanstack-query), could we also maybe use tanstack's core?
// - Figure out how to dedupe / cache requests (kinda related to the SWR thing above)
// - Logging, for fuck's sake, we need proper logging infra for this
// - Translations, ideally we'd ship a JSON in our packages for all 4-5 languages we support and allow our customers to put their own JSON into the config (that would just patch our JSON, so they don't need to translate everything)
// - How does forget password functionality work?

// Examples we need to have
// - How to build a dropdown/user thing for if you're logged in (gate / logout button)
// Example of how to make the salutation be a <select> element and not a radio button thing
// Build a demo with a modal for login

// Password reset needs to be fully in SDK
// Try and get registration in SDK :)

// Ticketables need to be able to render metadata/wallet_export data as fields
// Ticketables need to be able to be exported as PKPass / PDF

// Think of a usecase where the user has custom validation on an input field (i.e. validate that the zip code is fine)
// Think of a usecase where we prefil data in the profile component

class UnidySDK {
  constructor(private config: any = {});
}

// I'd "force" react users to do this since this will allow us to way easier do SSR and prefetching
// For web-component users, the <unidy-config> should create a global `window.unidy` that has this
// and window.unidy.auth will allow calling the auth SDK (since it should also somehow be linked under the hood)
const unidySDK = new UnidySDK({
  config: {
    baseUrl: "https://demo.unidy.de",
    apiKey: "public",
  },

  logging: "info",
});

// 🤔
unidySDK.registerComponent("custom_attribute_foo", ({ data, onChange }) => {
  return <ASdasd />;
});

const auth = new UnidyAuthSDK(unidySDK);
const newsletter = new UnidyNewsletterSDK(unidySDK);

// Typescript declaration merging could allow us to easily type this everywhere 🤔
interface CustomAttributeData {
  membership: boolean;
  membership_number: string;
  favorite_player: string;
}

// so that it can be used to automatically rereder stuff 🤔
const useAuth = () => {
  return useSyncExternalStore((onChange) => {
    auth.onChange(onChange);
  });
};

// for server rendering would be dope to have a
const auth = (cookies: {}) => {
  // since our short lived cookies only live for 1min, we could verify them (against our JWKs) and then just say it's valid 🤔
  // we should also allow having a "if this token"
  return "user";
};

// how about we have an endpoint (for gates and useUser), that does the following query, so we don't have N+1
// /api/sdk/v1/auth/user?relationships="newsletters,tickets[state=active;category_id=123]"
const useUser = <T,>(relationships: T) => {};

// This should probably be implemented as both a web component AND as a react component (to get proper SSR of this, or maybe we could somehow do it with WC 🤔)
const AuthGate = <T extends {}>(props: {
  relations: T;
  condition:
    | "signed_in"
    | "signed_out"
    | ((
        user:
          | null
          | ({
              id: string;
              first_name: string | null;
              custom_attributes: Partial<CustomAttributeData>;
            } & (T extends {
              subscriptions: any;
            }
              ? { subscriptions: { id: string }[] }
              : {}) &
              (T extends { newsletters: any } ? { newsletters: { id: number }[] } : {})),
        // we wanna make this return any "boolean-ish" value so it's easier for the customer
      ) => boolean | null | undefined);
}) => {};

const CustomTicketables = () => {
  const [state, setState] = useState<undefined | "active" | "inactive">();

  const pagination = usePagination();
  const ticketables = useTicketables("tickets", {
    pagination,
    filter: {
      category_id: "asdasd",
      state: state,
      expires_at: new Date("2023-01-01"),
      title: "Foo - %",
      _operators: { expires_at: "gt", title: "like" },
    },
  });

  if (ticketables.loading) {
    return <Spinner />;
  }

  if (ticketables.error) {
    return <h1>Sorry...</h1>;
  }

  return (
    <div>
      {ticketables.data.map((ticket) => (
        <div>
          <h2>{ticket.title}</h2>
        </div>
      ))}
    </div>
  );
};

// Before reading this react code, just think about it as a "part react part plain html/non reactive UI framework", cause IMO most of these things
// should be done with hooks / serviceObject calls in react
// i.e. there's no reason to render a <SignOutButton /> when you can just do `const auth = useAuth()` and then `auth.signOut()` as an onClick to your button
// Also, most customers will have their own styled inputs, so maybe just provide hooks and examples for usage 🤔?

// Actually thinking about this a lot, I think we should produce 2 SDKs, the base web-component one and the react one where some components are wrappers, some are re-written to be more react friendly (cause one is targeting only react customers, the other one can be used by anyone [wordpress, shopware, plain html...], we could also maybe build it for vue/other things with some translation layers / AI)
export default function Home() {
  return (
    <UnidyProvider client={unidySDK}>
      <UnidyAuthProvider auth={auth}>
        {/* We should have this prefCenterPath or upgradeToPrefCenter, since if you're not logged in and already have a newsletter, we should give you an option to login / do other things*/}
        <NewsletterSDK preferenceCenterPath="/profile/ns" upgradeToPrefCenter>
          {/* This field will then load from the SDK automatically if you're logged in */}
          <NewsletterEmailField />

          <AdditionalFields>
            {/* Maybe we could implement this unidy-field component as a react component, so it would find first parent that's of type "unidy-store-provider", and i.e. the profile component would wrap it's slot with a <unidy-store-provider> and then field would just save data into that store 🤔 */}
            <Field field="first_name" />
            <Field field="custom_attributes.favorite_player" />
          </AdditionalFields>

          <NewsletterCheckbox newsletter="main" />
          {/* The way this would work is to now even show the children of this component if the "main" is disabled */}
          <NewsletterGate newsletter="main">
            <h1>HEYYYY, YOU HAVE HTE MAIN NEWSLETTER</h1>

            <PreferenceCheckbox newsletter="main" pref="default" />
            <PreferenceCheckbox newsletter="main" pref="daily" />
          </NewsletterGate>

          <AuthGate
            condition={(user) =>
              user &&
              user.first_name === "John" &&
              user.custom_attributes.favorite_player != "Messi" &&
              user.newsletters.find((n) => n.internal_name === "other")?.preferences.find((p) => p.internal_name === "default")?.checked ===
                true
            }
            relations={{
              newsletters: {
                internal_name: "other",
              },
            }}
          >
            <NewsletterCheckbox newsletter="other" />
            {/* We should also build a solution in which we could dynamically disable these if the other is unchecked */}
            <PreferenceCheckbox newsletter="other" pref="default" checked />
            <PreferenceCheckbox newsletter="other" pref="daily" checked />
            <PreferenceCheckbox newsletter="other" pref="weekly" />
            <PreferenceCheckbox newsletter="other" pref="monthly" />
          </AuthGate>

          <SubmitButton />
        </NewsletterSDK>

        <AuthGate auth={false}>
          <Register>
            <RegisterStep step="start">
              <Email />
              <Social />
            </RegisterStep>

            <RegisterStep step="auth">
              <Passkey />
              <Password />
              <MagicCode />
            </RegisterStep>

            {/* Could a customer add their own step here? 🤔 */}
            <RegisterStep step="required_fields" />
            <RegisterStep step="newsletter" />
          </Register>

          {/* IMO, Ideally you should also be able to render the entire thing or each step as a premade component (to make it look like i.e. clerk), just put there and it works */}
          <SignInRoot
            onAuth={(token) => {
              logIntoLocalThing();
            }}
            // What could be cool here, is to have a way of using this but only for your backend login
            // so esentially the idea would be to do the following
            // 1. go to /login
            // 2. fill in data in unidy
            // 4. when you click login, after unidy returns success
            // 5. automatically redirect you to an oauth login start endpoint, which will redirect to unidy, and if it's set to auto_confirm, you'll automatically grant all the things and get redirected back to the app in a logged in state since you'll hit their oauth endpoint
            // I mean a customer could do this themself, but not sure if that's the correct way 🤔?
          >
            <SignInStep step="email">
              <h1>Pls enter your real email address, I promise we won't spam you</h1>
              <Email />
              <SocialLogin />
              <Passkey />
            </SignInStep>

            <SignInStep step="verification">
              <Condition value="code_sent" value="false">
                <Passkey />

                <hr />

                <Password />
                <SubmitButton />

                <hr />

                <SendMagicLinkButton />
              </Condition>

              {/* We should support magic code links in the email, like you click on a link and then it opens unidy, sets cookies and redirects to the customer website */}
              <Condition value="code_sent" value="true">
                <MagicCodeBox />
                <SubmitButton />
              </Condition>
            </SignInStep>

            <SignInStep step="2fa">
              <Passkey />
              <Code />
            </SignInStep>

            <SignInStep step="required_fields">
              <RequiredFieldsPlaceholder containerClass="" elementClass="" />

              {/* or build a component manually like this */}
              {() => {
                const foo = useAuthStep("required_fields");
                return (
                  <form onSubmit={foo.onSubmit}>
                    {foo.fields.map((field) => (
                      <RenderField />
                    ))}

                    <input type="submit">Submit</input>
                  </form>
                );
              }}

              <Submit />
            </SignInStep>
          </SignInRoot>
        </AuthGate>

        <AuthGate condition="signed_in">
          <SignOutButton />

          {/* These things should be able to automatically read the query param of "unidy_preference_token" and "log you in" */}
          {/* We should also allow for an SSR preloader for this (so that you can easily in next push that data from the server) */}
          {/* We should support something like this, just let Unidy render it */}
          <NewsletterPreferenceCenter newsletter="main"></NewsletterPreferenceCenter>

          <NewsletterPreferenceCenterProvider>
            <AuthGate condition={(user) => user && user.custom_attributes.vip === true}>
              <UnsubFrom newsletter="main"></UnsubFrom>
            </AuthGate>

            <AuthGate condition={(user) => user && user.custom_attributes.vip === false}>
              <h1>You're not a VIP, you can't unsubscribe from the newsletter</h1>
            </AuthGate>

            <Checkbox newsletter="main" pref="default" />
            <Checkbox newsletter="main" pref="daily" />
            <Checkbox newsletter="main" pref="weekly" />
          </NewsletterPreferenceCenterProvider>

          {/* here profile would also provide that store container to read from */}
          <Profile>
            <UnidyField field="asdasd" />
            <CustomFieldProvider field="last_name">{({ data, onChange }) => <input value={data} />}</CustomFieldProvider>

            <SubmitButton />
          </Profile>

          {/* WebComponent impl, not sure if this would play well with react, ideally I'd do this one natively in react */}
          <u-ticketable-list
            ticketable-type="ticket"
            // also here we could pass the typed object since we're in charge of the wrapper 🤔
            filter="category_id=49fb3404-808d-4da6-9153-8d0f956d93a0;state=inactive"
            container-class="grid grid-cols-2 gap-4"
            limit="4"
          >
            <template>
              <h2 class="text-2xl font-bold text-gray-900 mb-4">
                <ticketable-value name="title"></ticketable-value>

                {/* We also need to be able to support pdf/pkpass URLs on the object, maybe we could just generate that on the server 🤔 */}

                <a unidy-attr unidy-attr-href="{{button_cta_url}}?utm_origin=website">
                  Edit ticket
                </a>
              </h2>
            </template>
          </u-ticketable-list>

          {/* Maybe a react specific component for this? would be quite nice IMO 🤔, or maybe just a hook, would require a bit more work, but would make it so much more powerful */}
          {/* I think the hook approach here is way better (but maybe ship the pagination component so they don't have to do it manually) */}
          <TicketablesList filter="category_id=123" type="tickets">
            {/* Or maybe pass down entire hook data so loading is handled by the user? */}
            {(ticketables, pagination) => (
              <div>
                {ticketables.map((t) => (
                  <div>
                    <h2>{t.title}</h2>
                  </div>
                ))}

                <Pagination pagination={pagination} />
              </div>
            )}
          </TicketablesList>
        </AuthGate>

        {/* This will be annoying to do in plain webcomponents, maybe we can support some simple comparisons or just do the "attach function to component on render" */}
        <u-gate id="thing">Thingy</u-gate>
        <script>
          {
            // this is wrapped in a block to work with JSX, this would ofc be a plain script block just calling gate
            () => {
              gate("thing", {
                fn: (user) =>
                  !!user.newsletters.find((n) => n.internal_name === "main")?.preferences.find((p) => p.internal_name === "gold"),
                relationships: { newsletters: true },
              });
            }
          }
        </script>

        <AuthGate condition={(user) => user && user.custom_attributes.membership === true}>
          <h1>Hey, you can manage your thing here</h1>
        </AuthGate>

        <AuthGate
          condition={(user) => user && user.subscriptions.length > 0}
          relations={{
            subscriptions: { category_id: "asdasd", state: "active" },
          }}
          else={<h2>You don't have access to this</h2>}
        >
          {/* The webcomponent way could be this 🤔 */}
          <div slot="else">
            <h2>You don't have access to this</h2>
          </div>

          <h1>I see that you have a gold subscription, amazing</h1>
        </AuthGate>
      </UnidyAuthProvider>
    </UnidyProvider>
  );
}
