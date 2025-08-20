"use client";

import { UnidyNewsletter } from "newsletter-react";

export default function Home() {
  return (
    <div>
      <UnidyNewsletter
        api-key="public-newsletter-api-key"
        api-url="http://localhost:3000"
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
          },
          {
            name: "last_name",
            label: "Last Name",
            type: "text",
          },
        ])}
        onSuccess={(event) => {
          console.log("success", event);
        }}
        onError={(event) => {
          console.log("error", event);
        }}
      >
        <div slot="header">
          <h1>Newsletter header</h1>
        </div>
      </UnidyNewsletter>
    </div>
  );
}
