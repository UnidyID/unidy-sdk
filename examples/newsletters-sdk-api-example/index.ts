import { UnidyClient } from "@unidy.io/sdk-api-client";

const client = new UnidyClient("http://localhost:3000", "8a4c2291e0c6214751140b7c9f66c92079b40b5ac9cd65d1203492b8144da1a0");

client.newsletters.onError((errors) => {
  console.log("Invalid email: ", errors);
}, "invalid_email");

client.newsletters.onError((errors) => {
  console.log("Unconfirmed email: ", errors);
}, "unconfirmed");

client.newsletters.onError((errors) => {
  console.log("Already subscribed: ", errors);
}, "already_subscribed");

client.newsletters.onRateLimitError(() => {
  console.log("Rate limit exceeded - please try again later.");
});

const [error, response] = await client.newsletters.createSubscriptions({
  email: "test-5@unidy.de",
  newsletter_subscriptions: [
    {
      newsletter_internal_name: "test",
      preference_identifiers: ["club_news"],
    },
    {
      newsletter_internal_name: "other",
    },
  ],
});

if (error) {
  console.error("Error:", error);
}

console.log("Response:", response.data);
