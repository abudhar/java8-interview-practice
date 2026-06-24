/**
 * Cloudflare Worker — CORS proxy for onlinecompiler.io REST API
 *
 * Deploy steps:
 *  1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
 *  2. Paste this entire file into the editor, click "Deploy"
 *  3. In the Worker's dashboard, go to Settings → Variables → Add Variable:
 *     - Name: API_KEY
 *     - Type: Secret
 *     - Value: [Paste your onlinecompiler.io API key here]
 *     - Click "Save and deploy"
 *  4. Copy your worker URL (e.g. https://compiler-proxy.yourname.workers.dev)
 *  5. In script.js, set PROXY_URL to that URL
 */

const UPSTREAM_URL = "https://api.onlinecompiler.io/api/run-code-sync/";

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");
    
    // Validate request origin (restrict to production site and local development)
    let isAllowed = false;
    if (origin) {
      if (origin === "https://abudhar.github.io" || 
          /^http:\/\/localhost(:\d+)?$/.test(origin) || 
          /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      return new Response(JSON.stringify({ error: "Forbidden: Origin not allowed" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const corsHeaders = {
      "Access-Control-Allow-Origin":  origin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    // Check payload size to prevent Denial of Service (DoS) / memory abuse (limit: 100KB)
    const contentLength = parseInt(request.headers.get("Content-Length") || "0", 10);
    if (contentLength > 1024 * 100) {
      return new Response(JSON.stringify({ error: "Payload too large (limit 100KB)" }), {
        status: 413,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const apiKey = env.API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API_KEY secret is not configured in Cloudflare Worker settings" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Forward to onlinecompiler.io — API key stays server-side (not in browser)
    const upstream = await fetch(UPSTREAM_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": apiKey,
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.text();

    return new Response(data, {
      status:  upstream.status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  },
};
