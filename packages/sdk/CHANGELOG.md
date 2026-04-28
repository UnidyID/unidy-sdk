# Changelog

## [1.4.3](https://github.com/UnidyID/unidy-sdk/compare/@unidy.io/sdk-v1.4.2...@unidy.io/sdk-v1.4.3) (2026-04-28)


### Bug Fixes

* add icon slot to u-passkey with default passkey SVG ([#257](https://github.com/UnidyID/unidy-sdk/issues/257)) ([7034cab](https://github.com/UnidyID/unidy-sdk/commit/7034cab4d81bb04f6863a08e8fb5c6f0c6be49e7))

## [1.4.2](https://github.com/UnidyID/unidy-sdk/compare/@unidy.io/sdk-v1.4.1...@unidy.io/sdk-v1.4.2) (2026-04-26)


### Bug Fixes

* [UD-2375] value attribute on u-raw-field select does not initialize registration store ([#254](https://github.com/UnidyID/unidy-sdk/issues/254)) ([4aa9190](https://github.com/UnidyID/unidy-sdk/commit/4aa9190ddba00fa4047ec224bbe898aad699b0e2))
* [UD-2419] u-registration-root renders resume button automatically ([#250](https://github.com/UnidyID/unidy-sdk/issues/250)) ([5cb88f7](https://github.com/UnidyID/unidy-sdk/commit/5cb88f793fccf6bc8d6da7f9bb7448a14f8336ca))
* [UD-2432] u-passkey sign-in fails when challenge contains base64url characters ([#252](https://github.com/UnidyID/unidy-sdk/issues/252)) ([20776b4](https://github.com/UnidyID/unidy-sdk/commit/20776b4eec41aa1263da03e504769b6ebc8dbeb2))
* [UD-2437] [UD-2439] discoverable passkey prop, profile custom attribute bugs, and CI fix ([6bc8851](https://github.com/UnidyID/unidy-sdk/commit/6bc8851e625b325a6b8434d1a86515dffe831c9a))

## [1.4.1](https://github.com/UnidyID/unidy-sdk/compare/@unidy.io/sdk-v1.4.0...@unidy.io/sdk-v1.4.1) (2026-04-21)


### Bug Fixes

* [UD-2421] guard auto-send in componentWillLoad against inactive step ([#247](https://github.com/UnidyID/unidy-sdk/issues/247)) ([9fd9159](https://github.com/UnidyID/unidy-sdk/commit/9fd9159ed0f2e5c5fa5348b245c78e2beb1fe660))

## [1.4.0](https://github.com/UnidyID/unidy-sdk/compare/@unidy.io/sdk-v1.3.0...@unidy.io/sdk-v1.4.0) (2026-04-17)


### Features

* [UD-2261] support keyed newsletter consent checkboxes ([#229](https://github.com/UnidyID/unidy-sdk/issues/229)) ([af9fb5c](https://github.com/UnidyID/unidy-sdk/commit/af9fb5c559350efc2bd261b99be644966781ea38))
* [UD-2344] add redirect-uri prop to u-newsletter-root ([#240](https://github.com/UnidyID/unidy-sdk/issues/240)) ([5214e5c](https://github.com/UnidyID/unidy-sdk/commit/5214e5cc8d6f2c2a04b8d4db4a9e51d2065d3adf))
* add u-registration-internal-matching component ([#230](https://github.com/UnidyID/unidy-sdk/issues/230)) ([52b3d4a](https://github.com/UnidyID/unidy-sdk/commit/52b3d4a99287496eb2fd94782ca1385d8a5c45db))


### Bug Fixes

* [UD-2373] only auto-send verification code when verification step is active ([#243](https://github.com/UnidyID/unidy-sdk/issues/243)) ([d522e8b](https://github.com/UnidyID/unidy-sdk/commit/d522e8b708a1ea3e58d5b538604cf9c89b64fa47))
* [UD-2405] [UD-2406] registration confirmation event, oauth modal visibility, stale auth state ([#245](https://github.com/UnidyID/unidy-sdk/issues/245)) ([1ec8440](https://github.com/UnidyID/unidy-sdk/commit/1ec84400494dbef2f30b41531c28b38b15c35c67))
* [URGENT] registration email truncated to first character when transitioning from auth flow ([#231](https://github.com/UnidyID/unidy-sdk/issues/231)) ([76c5494](https://github.com/UnidyID/unidy-sdk/commit/76c5494ec5399df133941b90c1a285898af32b59))
* add optional password confirmation to registration flow ([#217](https://github.com/UnidyID/unidy-sdk/issues/217)) ([74f7571](https://github.com/UnidyID/unidy-sdk/commit/74f75710c6050755204210e15b3fbce1d2290ade))
* add unidy_sid query param parsing and keep the sid as the fallback ([#227](https://github.com/UnidyID/unidy-sdk/issues/227)) ([a6b7598](https://github.com/UnidyID/unidy-sdk/commit/a6b7598cfbb61733e74102432851974f4323c3e8))
* apply nullable price fix to subscriptions ([#234](https://github.com/UnidyID/unidy-sdk/issues/234)) ([5255d68](https://github.com/UnidyID/unidy-sdk/commit/5255d68b0c2281ecf47f770ce586aa8460839eb0))
* button styling ([#241](https://github.com/UnidyID/unidy-sdk/issues/241)) ([a8ab28e](https://github.com/UnidyID/unidy-sdk/commit/a8ab28ea1ffdc862fcf8952c144191964bf9fea1))
* **ci:** update bun to 1.3.9 and fix workspace filter glob ([#224](https://github.com/UnidyID/unidy-sdk/issues/224)) ([ba97fbb](https://github.com/UnidyID/unidy-sdk/commit/ba97fbbe6766f253f2f4fcd06a0857543c92c9e6))
* handle account_locked and account_unconfirmed sign-in errors ([#233](https://github.com/UnidyID/unidy-sdk/issues/233)) ([14a2917](https://github.com/UnidyID/unidy-sdk/commit/14a2917633b68a8bc6808ebef134328d35258ae4))
* phone validation rejecting valid numbers ([#220](https://github.com/UnidyID/unidy-sdk/issues/220)) ([d7fc3f6](https://github.com/UnidyID/unidy-sdk/commit/d7fc3f6b3ead3a79f60d2a1522c1558963ace7a5))
* tickets SDK breaking cause of price being NULL ([#219](https://github.com/UnidyID/unidy-sdk/issues/219)) ([62036fd](https://github.com/UnidyID/unidy-sdk/commit/62036fd65d1042e52ed830d69b312d9cdd5240e8))

## [1.3.0](https://github.com/UnidyID/unidy-sdk/compare/@unidy.io/sdk-v1.2.0...@unidy.io/sdk-v1.3.0) (2026-02-20)


### Features

* [UD-2055] Recover auth step after reload/new tab + add back button to navigate previous step ([#194](https://github.com/UnidyID/unidy-sdk/issues/194)) ([04991e9](https://github.com/UnidyID/unidy-sdk/commit/04991e9e321281376b9d05a296ec9a68ee89f1ee))
* [UD-2127] captcha in SDK ([#204](https://github.com/UnidyID/unidy-sdk/issues/204)) ([507cd60](https://github.com/UnidyID/unidy-sdk/commit/507cd60c34718de9f145aa439f9bd26d7c5d9bf3))
* [UD-2129] OAuth consent flow components ([#190](https://github.com/UnidyID/unidy-sdk/issues/190)) ([cda924e](https://github.com/UnidyID/unidy-sdk/commit/cda924ebd68f9e1c44bfb6f358c5f88c9aa3d63c))
* [UD-2142] partial update for user ([#169](https://github.com/UnidyID/unidy-sdk/issues/169)) ([22e1a45](https://github.com/UnidyID/unidy-sdk/commit/22e1a45b8416385b2ec88e60e63e0924c837c233))
* Add brand connect flow for SDK login ([#191](https://github.com/UnidyID/unidy-sdk/issues/191)) ([24ef87a](https://github.com/UnidyID/unidy-sdk/commit/24ef87ad6861a576b69dde2c1ab3bd3630a4d3af))
* add conventional commits and semantic versioning to generate a CHANGELOG ([#150](https://github.com/UnidyID/unidy-sdk/issues/150)) ([4316308](https://github.com/UnidyID/unidy-sdk/commit/4316308d004ce9c0076ada918f3c835ee796d75d))
* **profile:** add autosave with field-level save indicators ([#175](https://github.com/UnidyID/unidy-sdk/issues/175)) ([3c263fc](https://github.com/UnidyID/unidy-sdk/commit/3c263fc5c22ff0c5f342e9fb41702f1705dbafaa))
* react sdk - alpha version ([#205](https://github.com/UnidyID/unidy-sdk/issues/205)) ([70c8240](https://github.com/UnidyID/unidy-sdk/commit/70c8240bcd2fe213d9d8aaeaed7ddf8f9c8a1ca5))
* registration components in sdk ([#203](https://github.com/UnidyID/unidy-sdk/issues/203)) ([bcc1b3f](https://github.com/UnidyID/unidy-sdk/commit/bcc1b3f6e551bc9cff6ea8b71fbfeadc13efe4d0))


### Bug Fixes

* [UD-2159] send X-ID-Token header on logout  ([#200](https://github.com/UnidyID/unidy-sdk/issues/200)) ([7d1c2a3](https://github.com/UnidyID/unidy-sdk/commit/7d1c2a34e9459c70c448c2af24f119bdd45c6e67))
* [UD-2159] store refresh_token in localStorage and send via request body ([#179](https://github.com/UnidyID/unidy-sdk/issues/179)) ([2dd13b2](https://github.com/UnidyID/unidy-sdk/commit/2dd13b26073e34bbf1e531fbc569315140b47404))
* date formatting breaking with new nested helper ([22e205a](https://github.com/UnidyID/unidy-sdk/commit/22e205ab1604088cf03e94bd676c73b227ea0e4e))
* include docs and license in npm package ([#201](https://github.com/UnidyID/unidy-sdk/issues/201)) ([3d76f0e](https://github.com/UnidyID/unidy-sdk/commit/3d76f0e4d6269075cd7c9d21f6d834baf6a450cb))
* persist step history for back button after page reload ([#198](https://github.com/UnidyID/unidy-sdk/issues/198)) ([4d2b23b](https://github.com/UnidyID/unidy-sdk/commit/4d2b23be439f26501ee998187297d88210c4181f))

## [1.2.0](https://github.com/UnidyID/unidy-sdk/compare/@unidy.io/sdk-v1.1.10...@unidy.io/sdk-v1.2.0) (2026-02-02)


### Features

* [UD-1931] add Sentry to SDK ([#80](https://github.com/UnidyID/unidy-sdk/issues/80)) ([907ea4a](https://github.com/UnidyID/unidy-sdk/commit/907ea4ac7162274508911890b1b6d9e30f4ecf07))
* [UD-1996] let unidyConfig check for active session on baseUrl ([#136](https://github.com/UnidyID/unidy-sdk/issues/136)) ([0c58242](https://github.com/UnidyID/unidy-sdk/commit/0c58242fa32ab0e1e9456ba470b693263091ee85))
* [UD-2002] I18n and added translations ([#91](https://github.com/UnidyID/unidy-sdk/issues/91)) ([eee85ad](https://github.com/UnidyID/unidy-sdk/commit/eee85adefd8a93b55b4a4c8c037b7ee2ac8621f4))
* [UD-2148] support for additional fields in newsletter form ([#165](https://github.com/UnidyID/unidy-sdk/issues/165)) ([95ca937](https://github.com/UnidyID/unidy-sdk/commit/95ca9371c0af00134f8d304fd3f83ca060ef73ea))
* add conventional commits and semantic versioning to generate a CHANGELOG ([#150](https://github.com/UnidyID/unidy-sdk/issues/150)) ([4316308](https://github.com/UnidyID/unidy-sdk/commit/4316308d004ce9c0076ada918f3c835ee796d75d))
* add fr, it, nl_be & ro ([#122](https://github.com/UnidyID/unidy-sdk/issues/122)) ([2610f1b](https://github.com/UnidyID/unidy-sdk/commit/2610f1b22a9837d708a520098a132173a7aae129))
* add slot to logout button ([#140](https://github.com/UnidyID/unidy-sdk/issues/140)) ([6a94870](https://github.com/UnidyID/unidy-sdk/commit/6a948704bb6964cedf61e02614d0b74ed372b3a9))
* extract HasSlotContent mixin for slot content detection ([#185](https://github.com/UnidyID/unidy-sdk/issues/185)) ([3ed1754](https://github.com/UnidyID/unidy-sdk/commit/3ed175487189ee827d85a75b838ec47fbbd6bb31))
* only run sentry on Prod environments ([#87](https://github.com/UnidyID/unidy-sdk/issues/87)) ([9f40c8a](https://github.com/UnidyID/unidy-sdk/commit/9f40c8afaea4fa68e4f7969068efc638144a58a5))
* rename auth-provider ([6b09f87](https://github.com/UnidyID/unidy-sdk/commit/6b09f87287ccd3302f78bc4b54c68c6f53898f1e))
* unified logger ([#108](https://github.com/UnidyID/unidy-sdk/issues/108)) ([f2f2e62](https://github.com/UnidyID/unidy-sdk/commit/f2f2e62299dc6ba82eca717224b3b4824b2c1e3c))


### Bug Fixes

* [UD-2161] missing fields flow ([#173](https://github.com/UnidyID/unidy-sdk/issues/173)) ([5d001fa](https://github.com/UnidyID/unidy-sdk/commit/5d001fa00f739b4ad5065d48f3e90b8f0c69f90c))
* initial FOUC while loading ([#86](https://github.com/UnidyID/unidy-sdk/issues/86)) ([454512f](https://github.com/UnidyID/unidy-sdk/commit/454512fa10ba01bafbdf4af53b96dfea0fe0be3f))
* only fetch profile when authenticated ([#134](https://github.com/UnidyID/unidy-sdk/issues/134)) ([19642a7](https://github.com/UnidyID/unidy-sdk/commit/19642a77eba41ec9f5505d1c21482373d4914119))
* optional does not include null ([#159](https://github.com/UnidyID/unidy-sdk/issues/159)) ([d464253](https://github.com/UnidyID/unidy-sdk/commit/d46425341866da43f0e2637563dbf948e154e31c))
