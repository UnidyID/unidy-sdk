// copied from UnidyCode
const apiURL = process.env.E2E_API_URL || "http://127.0.0.1:3000";
const apiToken = process.env.E2E_API_TOKEN || "";

export class TestApi {
  async fetch<T = object>(url: string, options: Omit<RequestInit, "body"> & { body?: any } = {}, throwOnError = true) {
    const res = await fetch(`${apiURL}/test/${url.startsWith("/") ? url.slice(1) : url}`, {
      ...options,
      ...(options.body && typeof options.body === "object" && { body: JSON.stringify(options.body) }),
      headers: {
        ...(options.body && typeof options.body === "object" && { "Content-Type": "application/json" }),
        ...options.headers,
        "X-Test-Secret": apiToken,
      },
    });

    if (throwOnError && !res.ok) {
      console.log(await res.text());
      throw new Error(`Failed to fetch ${url}`);
    }

    return (await res.json()) as T;
  }
}
