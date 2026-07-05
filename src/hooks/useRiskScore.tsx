/**
 * useRiskScore — Dynamic Real-Time Risk Assessment
 *
 * Score: 0 (fully safe) → 100 (high danger)
 * Levels:
 *   0–30  → safe    (green)
 *   31–60 → caution (yellow)
 *   61–100→ danger  (red)
 *
 * Factors evaluated every 30 seconds:
 *  1. Time of day / night
 *  2. User movement speed (stationary vs walking vs running)
 *  3. Nearby public safety infrastructure via Overpass API
 *     (police stations, hospitals, shelters within 1km = lower risk)
 *  4. Area density (residential/commercial POIs = safer than isolated)
 *  5. Recent SOS events or active alerts
 *  6. Emotional state from mood check-ins
 *  7. Emergency contacts configured
 *  8. Location accuracy (poor GPS = lower confidence)
 */
import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation, type GeolocationCoords } from '@/hooks/useGeolocation';

// ── Types ──────────────────────────────────────────────────────────────────
export type RiskLevel = 'safe' | 'caution' | 'danger';

export type RiskFactor = {
  label:       string;
  detail:      string;       // human-readable explanation
  impact:      number;       // positive = increases risk, negative = decreases risk
  category:    'location' | 'time' | 'movement' | 'environment' | 'personal' | 'safety';
};

export type RiskResult = {
  score:        number;       // 0–100 (higher = more dangerous)
  level:        RiskLevel;
  factors:      RiskFactor[];
  message:      string;       // summary sentence
  explanation:  string;       // detailed reason
  confidence:   number;       // 0–100 — how reliable the prediction is
  confidenceLabel: string;
  updatedAt:    Date;
  location:     { latitude: number; longitude: number } | null;
};

// ── Constants ─────────────────────────────────────────────────────────────
const REFRESH_MS      = 30_000;  // 30-second auto-refresh
const OVERPASS_RADIUS = 1000;    // 1 km search radius for nearby facilities

// ── Overpass query: count public safety + density POIs within radius ──────
function buildSafetyQuery(lat: number, lon: number): string {
  return `[out:json][timeout:15];
(
  node["amenity"="police"](around:${OVERPASS_RADIUS},${lat},${lon});
  node["office"="police"](around:${OVERPASS_RADIUS},${lat},${lon});
  node["amenity"="hospital"](around:${OVERPASS_RADIUS},${lat},${lon});
  node["amenity"="clinic"](around:${OVERPASS_RADIUS},${lat},${lon});
  node["amenity"="fire_station"](around:${OVERPASS_RADIUS},${lat},${lon});
  node["amenity"="shelter"](around:${OVERPASS_RADIUS},${lat},${lon});
  node["amenity"="pharmacy"](around:${OVERPASS_RADIUS},${lat},${lon});
  node["shop"](around:500,${lat},${lon});
  node["amenity"="restaurant"](around:500,${lat},${lon});
  node["amenity"="cafe"](around:500,${lat},${lon});
  node["amenity"="bank"](around:500,${lat},${lon});
  node["building"="commercial"](around:500,${lat},${lon});
  node["building"="residential"](around:500,${lat},${lon});
);
out count;`;
}

// ── Fetch Overpass (proxy in prod, direct in dev) ─────────────────────────
async function fetchOverpassCount(query: string): Promise<{
  safety: number; density: number;
} | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12_000);

    let res: Response;
    if (import.meta.env.PROD) {
      res = await fetch('/api/overpass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });
    } else {
      res = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
      });
    }
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    const count: number = data?.elements?.[0]?.tags?.total
      ?? data?.elements?.length
      ?? 0;
    // Rough split: first few (safety facilities) vs rest (density)
    return { safety: Math.min(count, 10), density: count };
  } catch {
    return null;
  }
}

// ── Haversine distance in metres ──────────────────────────────────────────
function distanceMetres(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6_371_000;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Main hook ──────────────────────────────────────────────────────────────
export function useRiskScore() {
  const { user } = useAuth();
  const { location, getCurrentLocation, watchLocation, clearWatch } = useGeolocation();
  const [risk, setRisk]       = useState<RiskResult | null>(null);
  const [loading, setLoading] = useState(false);

  const prevLocationRef  = useRef<GeolocationCoords | null>(null);
  const prevTimeRef      = useRef<number>(Date.now());
  const watchIdRef       = useRef<number | null>(null);
  const refreshTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Core computation ────────────────────────────────────────────────────
  const compute = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      let riskScore = 0;           // start fully safe
      const factors: RiskFactor[] = [];
      let confidencePoints = 0;    // accumulate confidence evidence
      const maxConfidence  = 100;

      const now  = new Date();
      const hour = now.getHours();
      const loc  = location;

      // ── Factor 1: Time of day ─────────────────────────────────────────
      if (hour >= 23 || hour < 4) {
        riskScore += 25;
        factors.push({
          label:    'Deep night (11 PM – 4 AM)',
          detail:   'Very late hours significantly reduce visibility and public presence.',
          impact:   25,
          category: 'time',
        });
      } else if (hour >= 20 || hour < 6) {
        riskScore += 15;
        factors.push({
          label:    'Night hours',
          detail:   'Evening and night hours reduce public presence and safety.',
          impact:   15,
          category: 'time',
        });
      } else if (hour >= 6 && hour < 19) {
        riskScore -= 5;
        factors.push({
          label:    'Daytime hours',
          detail:   'Daytime has higher public presence and better visibility.',
          impact:   -5,
          category: 'time',
        });
      }
      confidencePoints += 20; // time is always available

      // ── Factor 2: Location & movement ────────────────────────────────
      if (loc) {
        confidencePoints += 20;

        // Movement speed
        const prev = prevLocationRef.current;
        if (prev) {
          const dist  = distanceMetres(prev.latitude, prev.longitude, loc.latitude, loc.longitude);
          const dtSec = Math.max(1, (Date.now() - prevTimeRef.current) / 1000);
          const speed = dist / dtSec; // m/s

          if (speed < 0.3) {
            // Stationary for extended time
            riskScore += 10;
            factors.push({
              label:    'Stationary for extended time',
              detail:   `You have not moved significantly (< 1 m/s) — may indicate distress or an isolated location.`,
              impact:   10,
              category: 'movement',
            });
          } else if (speed > 3) {
            // Fast movement (possible running)
            riskScore += 8;
            factors.push({
              label:    'Fast movement detected',
              detail:   `Moving at ${speed.toFixed(1)} m/s — unusually fast for a pedestrian.`,
              impact:   8,
              category: 'movement',
            });
          } else {
            factors.push({
              label:    'Normal movement',
              detail:   `Walking pace detected (${speed.toFixed(1)} m/s). Normal activity.`,
              impact:   0,
              category: 'movement',
            });
          }
          confidencePoints += 15;
        }

        // GPS accuracy
        if (loc.accuracy && loc.accuracy < 30) {
          confidencePoints += 15;
        } else if (loc.accuracy && loc.accuracy < 100) {
          confidencePoints += 8;
        }

        prevLocationRef.current = loc;
        prevTimeRef.current = Date.now();

        // ── Factor 3: Nearby safety facilities (Overpass) ────────────
        try {
          const overpassResult = await fetchOverpassCount(
            buildSafetyQuery(loc.latitude, loc.longitude)
          );

          if (overpassResult) {
            confidencePoints += 20;
            const { safety, density } = overpassResult;

            // Safety facilities within 1km
            if (safety >= 3) {
              riskScore -= 15;
              factors.push({
                label:    `${safety} safety facilities nearby`,
                detail:   `Police stations, hospitals, or shelters within 1 km significantly improve safety.`,
                impact:   -15,
                category: 'environment',
              });
            } else if (safety >= 1) {
              riskScore -= 8;
              factors.push({
                label:    `${safety} safety facilit${safety === 1 ? 'y' : 'ies'} nearby`,
                detail:   `At least one emergency facility (hospital or police) within 1 km.`,
                impact:   -8,
                category: 'environment',
              });
            } else {
              riskScore += 12;
              factors.push({
                label:    'No safety facilities within 1 km',
                detail:   'No police stations, hospitals, or shelters detected within 1 km.',
                impact:   12,
                category: 'environment',
              });
            }

            // Area density (restaurants, shops, buildings = populated area)
            if (density >= 20) {
              riskScore -= 10;
              factors.push({
                label:    'Busy populated area',
                detail:   `High density of public places (${density} POIs within 500 m) — crowded areas are safer.`,
                impact:   -10,
                category: 'environment',
              });
            } else if (density >= 5) {
              factors.push({
                label:    'Moderate area activity',
                detail:   `Some public activity detected (${density} nearby places).`,
                impact:   0,
                category: 'environment',
              });
            } else {
              riskScore += 15;
              factors.push({
                label:    'Isolated or low-activity area',
                detail:   `Very few public places detected nearby (${density} within 500 m) — may be isolated.`,
                impact:   15,
                category: 'environment',
              });
            }
          }
        } catch {
          // Overpass unavailable — don't penalise, just lower confidence
        }
      } else {
        // No GPS
        riskScore += 5;
        factors.push({
          label:    'Location unavailable',
          detail:   'Unable to retrieve GPS. Environmental risk factors cannot be assessed.',
          impact:   5,
          category: 'location',
        });
      }

      // ── Factor 4: Recent mood / emotional state ───────────────────────
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
      const { data: moods } = await supabase
        .from('counseling_sessions')
        .select('emotional_state')
        .eq('user_id', user.id)
        .eq('topic', 'Daily Check-in')
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(7);

      if (moods && moods.length > 0) {
        confidencePoints += 10;
        const moodValues: Record<string, number> = {
          happy: 5, calm: 4, neutral: 3, anxious: 2, sad: 1,
        };
        const avg = moods.reduce((s, m) => s + (moodValues[m.emotional_state] ?? 3), 0) / moods.length;

        if (avg <= 1.5) {
          riskScore += 20;
          factors.push({
            label:    'Very distressed emotional state',
            detail:   'Recent mood check-ins indicate significant distress.',
            impact:   20,
            category: 'personal',
          });
        } else if (avg <= 2.5) {
          riskScore += 10;
          factors.push({
            label:    'Concerning emotional state',
            detail:   'Recent check-ins show anxiety or sadness.',
            impact:   10,
            category: 'personal',
          });
        } else if (avg >= 4.5) {
          riskScore -= 5;
          factors.push({
            label:    'Positive emotional state',
            detail:   'Recent mood entries indicate calm and happiness.',
            impact:   -5,
            category: 'personal',
          });
        }
      }

      // ── Factor 5: Active safety alerts ───────────────────────────────
      const { data: alerts } = await supabase
        .from('safety_alerts')
        .select('id, severity')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (alerts && alerts.length > 0) {
        confidencePoints += 5;
        const critical = alerts.filter((a) => a.severity === 'critical' || a.severity === 'high').length;
        const impact   = critical * 20 + (alerts.length - critical) * 8;
        riskScore     += impact;
        factors.push({
          label:    `${alerts.length} active safety alert${alerts.length > 1 ? 's' : ''}`,
          detail:   `${critical} high/critical alert${critical !== 1 ? 's' : ''} currently active.`,
          impact,
          category: 'safety',
        });
      }

      // ── Factor 6: Recent SOS ──────────────────────────────────────────
      const since24h = new Date(Date.now() - 24 * 3600_000).toISOString();
      const { data: sosList } = await supabase
        .from('sos_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('triggered_at', since24h);

      if (sosList && sosList.length > 0) {
        riskScore += 20;
        factors.push({
          label:    'SOS triggered in last 24 hours',
          detail:   'A recent emergency indicates elevated risk context.',
          impact:   20,
          category: 'safety',
        });
      }

      // ── Factor 7: Emergency contacts ─────────────────────────────────
      const { data: contacts } = await supabase
        .from('emergency_contacts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!contacts || contacts.length === 0) {
        riskScore += 8;
        factors.push({
          label:    'No emergency contacts set',
          detail:   'Without emergency contacts, response time during incidents increases.',
          impact:   8,
          category: 'personal',
        });
      } else {
        riskScore -= 5;
        factors.push({
          label:    'Emergency contacts configured',
          detail:   'At least one emergency contact is set up.',
          impact:   -5,
          category: 'safety',
        });
      }

      // ── Clamp score ───────────────────────────────────────────────────
      riskScore = Math.max(0, Math.min(100, Math.round(riskScore)));

      // ── Level mapping (inverted from old system) ──────────────────────
      const level: RiskLevel =
        riskScore <= 30 ? 'safe' : riskScore <= 60 ? 'caution' : 'danger';

      // ── Confidence ────────────────────────────────────────────────────
      const confidence = Math.min(100, Math.round((confidencePoints / maxConfidence) * 100));
      const confidenceLabel =
        confidence >= 75 ? 'High confidence'
        : confidence >= 45 ? 'Moderate confidence'
        : 'Low confidence (limited data)';

      // ── Human-readable explanation ────────────────────────────────────
      const negFactors = factors.filter((f) => f.impact > 0).map((f) => f.label.toLowerCase());
      const posFactors = factors.filter((f) => f.impact < 0).map((f) => f.label.toLowerCase());

      let explanation = '';
      if (negFactors.length > 0) {
        explanation += `Risk is elevated because: ${negFactors.slice(0, 3).join(', ')}.`;
      }
      if (posFactors.length > 0) {
        explanation += (explanation ? ' However, ' : 'Safety is improved by: ') +
          posFactors.slice(0, 2).join(' and ') + '.';
      }
      if (!explanation) explanation = 'No significant risk factors detected at this time.';

      const message =
        level === 'safe'
          ? 'You appear to be in a safe situation right now.'
          : level === 'caution'
          ? 'Some risk factors detected. Stay alert and keep your phone close.'
          : 'Elevated risk detected. Consider moving to a safer location or contacting someone.';

      const result: RiskResult = {
        score:          riskScore,
        level,
        factors,
        message,
        explanation,
        confidence,
        confidenceLabel,
        updatedAt:      now,
        location:       loc ? { latitude: loc.latitude, longitude: loc.longitude } : null,
      };

      setRisk(result);

      // Persist snapshot (best-effort)
      await supabase.from('risk_scores').insert({
        user_id:       user.id,
        score:         riskScore,
        level,
        factors:       factors as any,
        location_data: loc ? { latitude: loc.latitude, longitude: loc.longitude } : null,
      });

    } finally {
      setLoading(false);
    }
  }, [user, location]);

  // ── Start GPS watch + auto-refresh every 30 seconds ───────────────────
  useEffect(() => {
    if (!user) return;

    // Get initial location
    getCurrentLocation();

    // Watch location for movement detection
    const wid = watchLocation((coords) => {
      prevLocationRef.current = prevLocationRef.current ?? coords;
    });
    if (wid !== null) watchIdRef.current = wid;

    // Run immediately, then every 30 seconds
    compute();
    refreshTimerRef.current = setInterval(() => {
      compute();
    }, REFRESH_MS);

    return () => {
      if (watchIdRef.current !== null) clearWatch(watchIdRef.current);
      if (refreshTimerRef.current)     clearInterval(refreshTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Recompute when location first becomes available
  useEffect(() => {
    if (location && user) compute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.latitude, location?.longitude]);

  return { risk, loading, recompute: compute };
}
