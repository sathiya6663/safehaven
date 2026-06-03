import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useGeolocation } from '@/hooks/useGeolocation';

export type RiskLevel = 'safe' | 'caution' | 'danger';

export type RiskResult = {
  score: number; // 0-100, higher = safer
  level: RiskLevel;
  factors: { label: string; impact: number }[];
  message: string;
};

/**
 * Lightweight client-side risk model. Combines:
 *  - Time of day (late night raises caution)
 *  - Recent active safety alerts
 *  - Recent SOS events in last 24h
 *  - Whether user has at least one emergency contact configured
 *  - Geolocation availability
 * Server-side ML model can replace this later via an edge function.
 */
export function useRiskScore() {
  const { user } = useAuth();
  const { location, getCurrentLocation } = useGeolocation();
  const [risk, setRisk] = useState<RiskResult | null>(null);
  const [loading, setLoading] = useState(false);

  const compute = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let score = 95;
      const factors: { label: string; impact: number }[] = [];

      // Time of day
      const hour = new Date().getHours();
      if (hour >= 22 || hour < 5) {
        score -= 15;
        factors.push({ label: 'Late-night hours', impact: -15 });
      } else if (hour >= 19 || hour < 7) {
        score -= 7;
        factors.push({ label: 'Evening hours', impact: -7 });
      }

      // Recent mood data
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600_000).toISOString();
      const { data: moods } = await supabase
        .from('counseling_sessions')
        .select('emotional_state')
        .eq('user_id', user.id)
        .eq('topic', 'Daily Check-in')
        .gte('created_at', sevenDaysAgo);

      if (moods && moods.length > 0) {
        const moodValues: { [key: string]: number } = {
          happy: 5,
          calm: 4,
          neutral: 3,
          anxious: 2,
          sad: 1,
        };

        const moodScore =
          moods.reduce((sum, m) => sum + (moodValues[m.emotional_state] || 3), 0) / moods.length;
        
        if (moodScore <= 1.5) {
          score -= 20;
          factors.push({ label: 'Very distressed emotional state', impact: -20 });
        } else if (moodScore <= 2.5) {
          score -= 10;
          factors.push({ label: 'Concerning emotional state', impact: -10 });
        } else if (moodScore >= 4.5) {
          score += 5;
          factors.push({ label: 'Positive emotional state', impact: 5 });
        }

        // Check for crisis in sessions
        const { data: crisisSessions } = await supabase
          .from('counseling_sessions')
          .select('id')
          .eq('user_id', user.id)
          .eq('crisis_detected', true)
          .gte('created_at', sevenDaysAgo);

        if (crisisSessions && crisisSessions.length > 0) {
          const crisisImpact = -(crisisSessions.length * 10);
          score += crisisImpact;
          factors.push({ label: `${crisisSessions.length} crisis event(s) detected`, impact: crisisImpact });
        }
      }

      // Active alerts
      const { data: alerts } = await supabase
        .from('safety_alerts')
        .select('id, severity')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (alerts && alerts.length > 0) {
        const critical = alerts.filter((a) => a.severity === 'critical' || a.severity === 'high').length;
        const impact = -(critical * 25 + (alerts.length - critical) * 10);
        score += impact;
        factors.push({ label: `${alerts.length} active safety alert(s)`, impact });
      }

      // Recent SOS
      const since = new Date(Date.now() - 24 * 3600_000).toISOString();
      const { data: sos } = await supabase
        .from('sos_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('triggered_at', since);

      if (sos && sos.length > 0) {
        score -= 20;
        factors.push({ label: 'Recent SOS in last 24h', impact: -20 });
      }

      // Emergency contacts
      const { data: contacts } = await supabase
        .from('emergency_contacts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!contacts || contacts.length === 0) {
        score -= 10;
        factors.push({ label: 'No emergency contacts set', impact: -10 });
      } else {
        factors.push({ label: 'Emergency contacts configured', impact: 0 });
      }

      score = Math.max(0, Math.min(100, score));
      const level: RiskLevel = score >= 75 ? 'safe' : score >= 50 ? 'caution' : 'danger';
      const message =
        level === 'safe'
          ? 'You are in a safe state. Stay aware.'
          : level === 'caution'
          ? 'Stay cautious. Keep your phone close and review safety tips.'
          : 'Elevated risk detected. Consider checking in with a trusted contact.';

      const result: RiskResult = { score, level, factors, message };
      setRisk(result);

      // Persist (best-effort)
      await supabase.from('risk_scores').insert({
        user_id: user.id,
        score,
        level,
        factors: factors as any,
        location_data: location
          ? { latitude: location.latitude, longitude: location.longitude }
          : null,
      });
    } finally {
      setLoading(false);
    }
  }, [user, location]);

  useEffect(() => {
    if (user) {
      getCurrentLocation();
      compute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return { risk, loading, recompute: compute };
}
