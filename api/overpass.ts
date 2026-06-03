/**
 * Vercel serverless proxy for Overpass API.
 * The browser calls /api/overpass instead of overpass-api.de directly,
 * avoiding CORS/mixed-content blocks on the production HTTPS domain.
 *
 * POST /api/overpass
 * Body: { query: string }
 * Returns: Overpass JSON response
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers so the browser fetch succeeds
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { query } = req.body as { query?: string };
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing query" });
  }

  let lastError = "All mirrors failed";

  for (const mirror of MIRRORS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 25_000);

      const upstream = await fetch(mirror, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!upstream.ok) {
        lastError = `${mirror} → ${upstream.status}`;
        continue;
      }

      const data = await upstream.json();
      return res.status(200).json(data);
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      // try next mirror
    }
  }

  return res.status(502).json({ error: lastError });
}
