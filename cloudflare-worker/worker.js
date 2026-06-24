/**
 * Cloudflare Worker — CORS proxy for onlinecompiler.io REST API
 *
 * Deploy steps:
 *  1. Go to https://dash.cloudflare.com → Workers & Pages → Create Worker
 *  2. Paste this entire file into the editor, click "Deploy"
 *  3. Copy your worker URL (e.g. https://compiler-proxy.yourname.workers.dev)
 *  4. In script.js, set PROXY_URL to that URL
 */

const API_KEY      = "d643e748b751a444224385959c431c35";
const UPSTREAM_URL = "https://api.onlinecompiler.io/api/run-code-sync/";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...CORS_HEADERS },
      });
    }

    // Forward to onlinecompiler.io — API key stays server-side (not in browser)
    const upstream = await fetch(UPSTREAM_URL, {
      method:  "POST",
      headers: {
        "Content-Type":  "application/json",
        "Authorization": API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await upstream.text();

    return new Response(data, {
      status:  upstream.status,
      headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    });
  },
};
