import { serve } from "bun";

serve({
  port: 3001,
  fetch(req) {
    const url = new URL(req.url);

    const path = url.pathname === "/"
      ? "/examples/demo-newsletter-integration/index.html"
      : url.pathname;

    try {
      return new Response(Bun.file(`../..${path}`));
    } catch {
      return new Response("File not found", { status: 404 });
    }
  },
});