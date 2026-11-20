const UPSTREAM = {
  "/positions": "https://mkuran.pl/gtfs/warsaw/positions.json",
  "/gtfs.zip": "https://mkuran.pl/gtfs/warsaw.zip"
};

const ALLOWED_ORIGIN = "https://oski12226.github.io";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const corsOrigin = origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : "null";

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": corsOrigin,
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin"
        }
      });
    }

    const upstream = UPSTREAM[url.pathname];
    if (!upstream || !["GET", "HEAD"].includes(request.method)) {
      return new Response("Not found", { status: 404 });
    }

    try {
      const response = await fetch(upstream, {
        method: request.method,
        headers: request.method === "HEAD" ? {} : {
          "Accept": url.pathname === "/positions" ? "application/json" : "application/zip"
        },
        cf: {
          cacheTtl: url.pathname === "/positions" ? 5 : 3600,
          cacheEverything: true
        }
      });

      const headers = new Headers(response.headers);
      headers.set("Access-Control-Allow-Origin", corsOrigin);
      headers.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      headers.set("Vary", "Origin");
      headers.set("Cache-Control", url.pathname === "/positions"
        ? "public, max-age=5" : "public, max-age=3600");

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      return new Response(JSON.stringify({
        error: "Upstream fetch failed",
        message: String(error)
      }), {
        status: 502,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": corsOrigin,
          "Vary": "Origin"
        }
      });
    }
  }
};
