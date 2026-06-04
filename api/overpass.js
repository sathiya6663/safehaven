/**
 * Vercel serverless proxy for Overpass API.
 * Runs server-side so there are no CORS restrictions.
 * The Vite SPA rewrite in vercel.json is scoped to exclude /api/*
 * so this function receives the request correctly.
 *
 * POST /api/overpass
 * Body: { query: string }
 */

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Parse body — Vercel auto-parses JSON when Content-Type is application/json
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (_) { /* ignore */ }
  }

  const query = body && body.query;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing or invalid query field" });
  }

  let lastError = "All Overpass mirrors failed";

  for (const mirror of MIRRORS) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 25000);

    try {
      const upstream = await fetch(mirror, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(query),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!upstream.ok) {
        lastError = mirror + " returned HTTP " + upstream.status;
        continue;
      }

      const data = await upstream.json();
      return res.status(200).json(data);
    } catch (err) {
      clearTimeout(timer);
      lastError = err instanceof Error ? err.message : String(err);
      // try next mirror
    }
  }

  return res.status(502).json({ error: lastError });
};
