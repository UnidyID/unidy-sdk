import { UnidyClient } from "./src/client";

const client = new UnidyClient("localhost:3000", "8a4c2291e0c6214751140b7c9f66c92079b40b5ac9cd65d1203492b8144da1a0");

client.newsletters.onSubscriptionsCreated((response) => {
  console.log('Created:', response.created_subscriptions);
  console.log('Invalid', response.invalid_subscriptions)
});

client.newsletters.onInvalidEmailError((error) => {
  console.log('INVALID EMAIL !!!!!!')
});

const response = await client.newsletters.createSubscriptions({
  email: "example+2@mail.com",
  newsletter_subscriptions: [
    { newsletter_internal_name: 'test' },
    { newsletter_internal_name: 'other', preference_identifiers: ['testic'] }
  ]
});

//console.log(response)
