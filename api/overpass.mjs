/**
 * Vercel serverless proxy for Overpass API.
 * .mjs extension = explicit ES module (works regardless of package.json "type").
 * Runs server-side — no CORS, no mixed-content issues.
 *
 * POST /api/overpass
 * Body (JSON): { query: string }
 */

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (_) { /* ignore */ }
  }

  const query = body?.query;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing 'query' in request body" });
  }

  let lastError = "All mirrors failed";

  for (const mirror of MIRRORS) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 25000);
    try {
      const up = await fetch(mirror, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "data=" + encodeURIComponent(query),
        signal: ac.signal,
      });
      clearTimeout(t);
      if (!up.ok) { lastError = `${mirror} → HTTP ${up.status}`; continue; }
      const text = await up.text();
      if (!text.trim().startsWith("{")) { lastError = `${mirror} returned non-JSON`; continue; }
      return res.status(200).json(JSON.parse(text));
    } catch (e) {
      clearTimeout(t);
      lastError = e instanceof Error ? e.message : String(e);
    }
  }

  return res.status(502).json({ error: lastError });
}
