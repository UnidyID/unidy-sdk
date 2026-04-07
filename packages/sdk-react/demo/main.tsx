import { createStandaloneClient, UnidyProvider } from "@unidy.io/sdk-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app";
import "./styles.css";

const client = createStandaloneClient({
  baseUrl: import.meta.env.VITE_UNIDY_BASE_URL ?? "http://localhost:3000",
  apiKey: import.meta.env.VITE_UNIDY_API_KEY ?? "public-newsletter-api-key",
});

// biome-ignore lint/style/noNonNullAssertion: root element always exists in index.html
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <UnidyProvider client={client}>
      <App />
    </UnidyProvider>
  </StrictMode>,
);
