import { UnidyClient } from "./index";

const client = new UnidyClient("http://localhost:3000", "public-newsletter-api-key");

const email = "k.topolovec95@gmail.com";
const [signInError, signInResponse] = await client.auth.createSignIn(email);

if (signInError) {
  console.log("Error:", signInError);
  process.exit(1);
} else {
  console.log("Response:", signInResponse);
}

const [authenticateError, authenticateResponse] = await client.auth.authenticateWithPassword(signInResponse.sid, "Coki123_");

if (authenticateError) {
  console.log("Error:", authenticateError);
  process.exit(1);
}
console.log("Response:", authenticateResponse);

const [refreshTokenError, refreshTokenResponse] = await client.auth.refreshToken(signInResponse.sid, authenticateResponse.refresh_token);

if (refreshTokenError) {
  console.log("Error:", refreshTokenError);
}
console.log("Response:", refreshTokenResponse);
