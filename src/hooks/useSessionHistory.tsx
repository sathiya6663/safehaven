import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type SessionRecord = {
  id: string;
  date: string;
  topic: string;
  duration: number;
  emotionalState: string | null;
  summary: string | null;
  crisisDetected: boolean;
};

export type SessionHistory = {
  sessions: SessionRecord[];
  totalSessions: number;
  averageDuration: number;
};

export function useSessionHistory(limit: number = 10) {
  const { user } = useAuth();
  const [history, setHistory] = useState<SessionHistory | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch counseling sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('counseling_sessions')
        .select('id, created_at, topic, duration_minutes, emotional_state, ai_summary, crisis_detected')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (sessionsError) throw sessionsError;

      // Map to SessionRecord type
      const records: SessionRecord[] = (sessions || [])
        .filter((s) => s.topic !== 'Daily Check-in') // Filter out check-ins, focus on actual sessions
        .map((s) => ({
          id: s.id,
          date: new Date(s.created_at!).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          topic: s.topic || 'Untitled',
          duration: s.duration_minutes || 0,
          emotionalState: s.emotional_state,
          summary: s.ai_summary,
          crisisDetected: s.crisis_detected || false,
        }));

      // Calculate total and average
      const totalCount = records.length;
      const avgDuration =
        totalCount > 0
          ? Math.round(records.reduce((sum, s) => sum + s.duration, 0) / totalCount)
          : 0;

      setHistory({
        sessions: records,
        totalSessions: totalCount,
        averageDuration: avgDuration,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load session history';
      setError(errorMsg);
      console.error('Session history error:', err);
    } finally {
      setLoading(false);
    }
  }, [user, limit]);

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user, fetchSessions]);

  return { history, loading, error, refetch: fetchSessions };
}
