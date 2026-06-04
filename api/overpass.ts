/**
 * Vercel serverless proxy for Overpass API.
 * Runs server-side — no CORS restrictions.
 * Browser calls POST /api/overpass with { query: string }
 */
import type { VercelRequest, VercelResponse } from "@vercel/node";

const MIRRORS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
];

export const config = {
  runtime: "nodejs",
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  let body = req.body;
  // Vercel may not auto-parse if Content-Type isn't set correctly
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { /* ignore */ }
  }

  const query = (body as any)?.query;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Missing or invalid query" });
  }

  let lastError = "All Overpass mirrors failed";

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
        lastError = `${mirror} returned ${upstream.status}`;
        continue;
      }

      const data = await upstream.json();
      return res.status(200).json(data);
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
    }
  }

  return res.status(502).json({ error: lastError });
}
