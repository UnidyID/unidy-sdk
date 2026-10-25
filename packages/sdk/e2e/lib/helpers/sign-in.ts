import { userLogin } from "../../config";

const sdkBaseUrl = process.env.E2E_SDK_BASE_URL || "http://localhost:3000";
const sdkApiKey = process.env.E2E_SDK_API_KEY || "public-newsletter-api-key";

export type SignedInSession = { sid: string; jwt: string; refreshToken: string };

/** Signs the test user in through the SDK API, the way the password step of `<u-signin-root>` does. */
export async function signIn({ email, password } = userLogin): Promise<SignedInSession> {
  const res = await fetch(`${sdkBaseUrl}/api/sdk/v1/sign_ins`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${sdkApiKey}` },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    throw new Error(`Sign-in as ${email} failed with ${res.status}: ${await res.text()}`);
  }

  const { sid, jwt, refresh_token } = (await res.json()) as { sid: string; jwt: string; refresh_token: string };
  return { sid, jwt, refreshToken: refresh_token };
}
