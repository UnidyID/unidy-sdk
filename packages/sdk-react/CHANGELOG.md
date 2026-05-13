# Changelog

## [0.3.0](https://github.com/UnidyID/unidy-sdk/compare/@unidy.io/sdk-react-v0.2.0...@unidy.io/sdk-react-v0.3.0) (2026-05-13)


### Features

* [UD-2524] wire ServicesService into React SDK ([#272](https://github.com/UnidyID/unidy-sdk/issues/272)) ([a4e08de](https://github.com/UnidyID/unidy-sdk/commit/a4e08de205fb81b2bfa30f4cb84d96f75011a311))

## [0.2.0](https://github.com/UnidyID/unidy-sdk/compare/@unidy.io/sdk-react-v0.1.0...@unidy.io/sdk-react-v0.2.0) (2026-05-07)


### Features

* add missing hooks for OAuth, transactions, internal matching, jump-to, and login improvements ([52a0743](https://github.com/UnidyID/unidy-sdk/commit/52a07439a620855cee70828665819e506b3712d7))


### Bug Fixes

* treat consent_not_granted as normal flow state in connect() ([0b3d8ae](https://github.com/UnidyID/unidy-sdk/commit/0b3d8aefe618909e56774d0d05537bd2af824464))
* fall back to persisted signInId for reset password actions ([8b87deb](https://github.com/UnidyID/unidy-sdk/commit/8b87deb3080a00fc8ce77a6d5b65ab7bebf8d20e))
* extract fieldErrors in connect() and treat not_found as expected outcome ([38e6d97](https://github.com/UnidyID/unidy-sdk/commit/38e6d97effb10e9745c0079743a60d03f2ad1bdd))
* treat not_found as expected outcome in useInternalMatching ([a1b2571](https://github.com/UnidyID/unidy-sdk/commit/a1b25714ed59f316ed6a69f9e38708f41243b6f9))


### ⚠ BREAKING CHANGES

* **auth:** The `AuthStep` type now includes `"unconfirmed"`. Consumers with exhaustive `switch (step)` checks (the recommended pattern) will see a TypeScript error until they add a case for the new step.

## [0.1.0](https://github.com/UnidyID/unidy-sdk/compare/@unidy.io/sdk-react-v0.0.2...@unidy.io/sdk-react-v0.1.0) (2026-05-07)


### Features

* add missing React SDK hooks for OAuth, transactions, internal matching, jump-to ([#262](https://github.com/UnidyID/unidy-sdk/issues/262)) ([087425c](https://github.com/UnidyID/unidy-sdk/commit/087425cd8af3b4e49115c2902b825ca1ef54796f))
* add passkey support to react-sdk login and registration hooks ([#237](https://github.com/UnidyID/unidy-sdk/issues/237)) ([f19d9ab](https://github.com/UnidyID/unidy-sdk/commit/f19d9ab9d0e46aa7c5450064a797554a158dd6a2))
* add react registration hooks ([#228](https://github.com/UnidyID/unidy-sdk/issues/228)) ([5a22ca9](https://github.com/UnidyID/unidy-sdk/commit/5a22ca97816de67cf5667738d4690157a5c50f64))
* add registration hooks and demo ([5a22ca9](https://github.com/UnidyID/unidy-sdk/commit/5a22ca97816de67cf5667738d4690157a5c50f64))
* react sdk - alpha version ([#205](https://github.com/UnidyID/unidy-sdk/issues/205)) ([70c8240](https://github.com/UnidyID/unidy-sdk/commit/70c8240bcd2fe213d9d8aaeaed7ddf8f9c8a1ca5))
* **sdk-react:** clean up consumer-side hacks in hooks ([#238](https://github.com/UnidyID/unidy-sdk/issues/238)) ([9965a3e](https://github.com/UnidyID/unidy-sdk/commit/9965a3efbe77a9636a6d582c3bcdab9646ac9c30))


### Bug Fixes

* [UD-2405] [UD-2406] registration confirmation event, oauth modal visibility, stale auth state ([#245](https://github.com/UnidyID/unidy-sdk/issues/245)) ([1ec8440](https://github.com/UnidyID/unidy-sdk/commit/1ec84400494dbef2f30b41531c28b38b15c35c67))
* add Vercel SPA rewrite for client-side routing ([#209](https://github.com/UnidyID/unidy-sdk/issues/209)) ([f8739f0](https://github.com/UnidyID/unidy-sdk/commit/f8739f0bd70bb1e9846e6f715d3981bb7548cd2e))
* allow void return in runMutation onSuccess handler ([#206](https://github.com/UnidyID/unidy-sdk/issues/206)) ([0ae0378](https://github.com/UnidyID/unidy-sdk/commit/0ae0378baebaf3a15dbbd5b15266159de5a48e97))
* **ci:** update bun to 1.3.9 and fix workspace filter glob ([#224](https://github.com/UnidyID/unidy-sdk/issues/224)) ([ba97fbb](https://github.com/UnidyID/unidy-sdk/commit/ba97fbbe6766f253f2f4fcd06a0857543c92c9e6))
* resolve [@unidy](https://github.com/unidy).io/sdk/standalone in demo Vercel build ([d5e8649](https://github.com/UnidyID/unidy-sdk/commit/d5e8649c99d0cd3a73bf87fc174577e589c7c035))
* resolve sdk/standalone from source in demo vite config ([#208](https://github.com/UnidyID/unidy-sdk/issues/208)) ([d5e8649](https://github.com/UnidyID/unidy-sdk/commit/d5e8649c99d0cd3a73bf87fc174577e589c7c035))
* tickets SDK breaking cause of price being NULL ([#219](https://github.com/UnidyID/unidy-sdk/issues/219)) ([62036fd](https://github.com/UnidyID/unidy-sdk/commit/62036fd65d1042e52ed830d69b312d9cdd5240e8))
* update preference IDs in demo preference center ([#210](https://github.com/UnidyID/unidy-sdk/issues/210)) ([7f9024f](https://github.com/UnidyID/unidy-sdk/commit/7f9024ffc6321fc495a9c1298bf7877d3e47f83e))
* update preference IDs in simple preference center demo ([7f9024f](https://github.com/UnidyID/unidy-sdk/commit/7f9024ffc6321fc495a9c1298bf7877d3e47f83e))
