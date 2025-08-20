# React/Next wrapper for [Unidy Newsletter Web Component](https://www.npmjs.com/package/@unidy.io/newsletter)

The Unidy Newsletter SDK provides a react component to easily embed newsletter subscription forms into your web application

## Installation

```bash
npm install @unidy.io/newsletter-react
```

## Basic Usage

```js
import { UnidyNewsletter } from "@unidy.io/newsletter-react";
```

```js
<UnidyNewsletter
  api-key="newsletter-api-key"
  api-url="https://your-unidy-instance.unidy.de"
  email-placeholder="your@email.com"
  newsletters-config-json={JSON.stringify([
    {
      internalName: "main",
      label: "Main Newsletter",
      checked: true,
      preferences: [
        { internalName: "club_news", label: "Club News", checked: true },
        { internalName: "player_news", label: "Player News", checked: true },
      ],
    },
    {
      internalName: "yet-another",
      label: "Another Newsletter",
      checked: false,
      preferences: [],
    },
  ])}
  additional-fields-config-json={JSON.stringify([
    {
      name: "first_name",
      label: "First Name",
      type: "text",
    }
  ])}
  onSuccess={(event) => {
    console.log("success", event);
  }}
  onError={(event) => {
    console.log("error", event);
  }}
>
```

For configuration details, styling, custom content that can be injected into the component and other details take a look into the [README](https://www.npmjs.com/package/@unidy.io/newsletter) of web-component repository