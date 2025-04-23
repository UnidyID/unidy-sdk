import { serve } from "bun";

serve({
  port: 3001,
  fetch(req) {
    const url = new URL(req.url);

    let path = url.pathname === "/" ? "/index.html" : url.pathname;

    const file = Bun.file("." + path);
    const response = new Response(file);

    return response;
  }
});