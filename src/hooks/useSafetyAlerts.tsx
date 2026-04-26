import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type SafetyAlert = Database['public']['Tables']['safety_alerts']['Row'];
type SosLog = Database['public']['Tables']['sos_logs']['Row'];

/**
 * Unified "alert" type combining safety_alerts rows and sos_logs rows so the
 * UI can render a single Recent Alerts feed.
 */
export type UnifiedAlert = {
  id: string;
  source: 'safety_alert' | 'sos';
  title: string;
  description: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  created_at: string;
  raw: SafetyAlert | SosLog;
};

const sosToUnified = (s: SosLog): UnifiedAlert => ({
  id: `sos:${s.id}`,
  source: 'sos',
  title: 'SOS triggered',
  description: s.notes ?? (s.was_offline ? 'Sent from offline queue' : 'Emergency alert sent'),
  severity: 'critical',
  status: s.status,
  created_at: s.triggered_at ?? s.created_at,
  raw: s,
});

const safetyToUnified = (a: SafetyAlert): UnifiedAlert => ({
  id: `alert:${a.id}`,
  source: 'safety_alert',
  title: a.title,
  description: a.description,
  severity: (a.severity as UnifiedAlert['severity']) ?? 'medium',
  status: a.status,
  created_at: a.created_at ?? new Date().toISOString(),
  raw: a,
});

/**
 * Plays a short two-tone chime using WebAudio. No external audio file needed.
 * Wrapped in try/catch — silently no-ops if AudioContext is unavailable
 * (e.g. browser blocks autoplay before any user gesture).
 */
function playChime(intense = false) {
  try {
    const Ctx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const tones = intense ? [880, 1175, 880, 1175] : [880, 1175];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + i * 0.18);
      gain.gain.exponentialRampToValueAtTime(0.25, now + i * 0.18 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.18);
      osc.stop(now + i * 0.18 + 0.18);
    });
    setTimeout(() => ctx.close().catch(() => {}), tones.length * 200 + 200);
  } catch {
    /* noop */
  }
}

/**
 * Sends a browser notification if permission was previously granted.
 * Does not prompt — call requestNotificationPermission() once from a user gesture.
 */
function browserNotify(title: string, body: string) {
  try {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    if (document.visibilityState === 'visible') return; // toast covers foreground
    new Notification(title, { body, icon: '/icon-192.png', tag: 'safehaven-alert' });
  } catch {
    /* noop */
  }
}

export async function requestNotificationPermission() {
  try {
    if (typeof Notification === 'undefined') return 'unsupported';
    if (Notification.permission === 'default') {
      return await Notification.requestPermission();
    }
    return Notification.permission;
  } catch {
    return 'denied';
  }
}

export function useSafetyAlerts() {
  const { user } = useAuth();
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [sosLogs, setSosLogs] = useState<SosLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Avoid sound/notification on the initial load — only for live inserts
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const load = async () => {
      try {
        const [alertsRes, sosRes] = await Promise.all([
          supabase
            .from('safety_alerts')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50),
          supabase
            .from('sos_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('triggered_at', { ascending: false })
            .limit(50),
        ]);
        if (cancelled) return;
        if (alertsRes.error) throw alertsRes.error;
        if (sosRes.error) throw sosRes.error;
        setSafetyAlerts(alertsRes.data ?? []);
        setSosLogs(sosRes.data ?? []);
      } catch (error: any) {
        logger.error('Error fetching alerts', { error: error?.message });
      } finally {
        if (!cancelled) {
          setLoading(false);
          hydratedRef.current = true;
        }
      }
    };

    load();

    const channel = supabase
      .channel(`alerts-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'safety_alerts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as SafetyAlert;
          setSafetyAlerts((prev) =>
            prev.some((a) => a.id === row.id) ? prev : [row, ...prev],
          );
          if (!hydratedRef.current) return;
          const intense = row.severity === 'critical';
          if (row.severity === 'critical' || row.severity === 'high') {
            toast.error(row.title, {
              description: row.description ?? undefined,
              duration: 10000,
            });
            playChime(intense);
            browserNotify(row.title, row.description ?? '');
          } else {
            toast(row.title, { description: row.description ?? undefined });
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'safety_alerts',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as SafetyAlert;
          setSafetyAlerts((prev) =>
            prev.map((a) => (a.id === row.id ? row : a)),
          );
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sos_logs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as SosLog;
          setSosLogs((prev) =>
            prev.some((s) => s.id === row.id) ? prev : [row, ...prev],
          );
          if (!hydratedRef.current) return;
          toast.error('SOS triggered', {
            description: row.was_offline
              ? 'Synced from offline queue'
              : 'Emergency alert sent',
            duration: 10000,
          });
          playChime(true);
          browserNotify('SOS triggered', 'Emergency alert sent');
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sos_logs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const row = payload.new as SosLog;
          setSosLogs((prev) => prev.map((s) => (s.id === row.id ? row : s)));
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Combined, sorted feed
  const unified: UnifiedAlert[] = [
    ...safetyAlerts.map(safetyToUnified),
    ...sosLogs.map(sosToUnified),
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const acknowledgeAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('safety_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      // realtime UPDATE handler will sync state
      toast.success('Alert acknowledged');
    } catch {
      toast.error('Failed to acknowledge alert');
    }
  };

  const resolveAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('safety_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
      toast.success('Alert resolved');
    } catch {
      toast.error('Failed to resolve alert');
    }
  };

  return {
    // Back-compat: existing components read `alerts` as SafetyAlert[]
    alerts: safetyAlerts,
    sosLogs,
    unified,
    loading,
    acknowledgeAlert,
    resolveAlert,
  };
}
