import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type MoodEntry = {
  date: string;       // display label
  dateISO: string;    // YYYY-MM-DD — used for sorting and streak calculation
  mood: string;       // dominant mood for the day
  count: number;      // total check-ins that day
};

export type MoodStats = {
  daily: MoodEntry[];         // last 30 days, one entry per day
  weekly: MoodEntry[];        // last 12 weeks, one entry per week
  currentStreak: number;      // consecutive days with at least one check-in
  averageMood: string | null; // most common mood label across all entries
  totalEntries: number;       // all-time count of mood check-ins
};

// Mood numeric scores for average calculation
const MOOD_VALUES: Record<string, number> = {
  happy:   5,
  calm:    4,
  neutral: 3,
  anxious: 2,
  sad:     1,
};
const MOOD_LABELS = ['sad', 'anxious', 'neutral', 'calm', 'happy'];

// YYYY-MM-DD string from a Date
function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Display label: "Jun 4"
function toDisplayLabel(dateKey: string): string {
  const [y, m, day] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function useMoodTracker() {
  const { user } = useAuth();
  const [stats, setStats] = useState<MoodStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMoodData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // Fetch ALL mood check-ins ever (no date limit) so streak and total are accurate
      const { data: sessions, error: sessionsError } = await supabase
        .from('counseling_sessions')
        .select('created_at, emotional_state')
        .eq('user_id', user.id)
        .eq('topic', 'Daily Check-in')
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      if (!sessions || sessions.length === 0) {
        setStats({ daily: [], weekly: [], currentStreak: 0, averageMood: null, totalEntries: 0 });
        return;
      }

      // ── Build per-day aggregation (all time) ────────────────────────────
      // dayMap: dateKey (YYYY-MM-DD) → { count, moodScoreSum, dominantMood }
      const dayMap = new Map<string, { count: number; scoreSum: number; moods: string[] }>();

      sessions.forEach((s) => {
        if (!s.created_at) return;
        const dk = toDateKey(new Date(s.created_at));
        const existing = dayMap.get(dk) ?? { count: 0, scoreSum: 0, moods: [] };
        existing.count++;
        if (s.emotional_state) {
          existing.moods.push(s.emotional_state);
          existing.scoreSum += MOOD_VALUES[s.emotional_state] ?? 3;
        }
        dayMap.set(dk, existing);
      });

      const allDayKeys = Array.from(dayMap.keys()).sort(); // ascending YYYY-MM-DD

      // ── Current streak ───────────────────────────────────────────────────
      // Walk backwards from today; count consecutive days that have an entry
      let currentStreak = 0;
      const today = new Date();
      const cursor = new Date(today);
      cursor.setHours(0, 0, 0, 0);

      while (true) {
        const dk = toDateKey(cursor);
        if (dayMap.has(dk)) {
          currentStreak++;
          cursor.setDate(cursor.getDate() - 1);
        } else {
          // Allow today to be missing (user hasn't checked in yet today)
          // but only skip once at the very start
          if (currentStreak === 0 && dk === toDateKey(today)) {
            cursor.setDate(cursor.getDate() - 1);
            const prevDk = toDateKey(cursor);
            if (!dayMap.has(prevDk)) break;
            // yesterday has entry — start counting from yesterday
            currentStreak++;
            cursor.setDate(cursor.getDate() - 1);
          } else {
            break;
          }
        }
      }

      // ── Total entries (all time) ─────────────────────────────────────────
      const totalEntries = sessions.length;

      // ── Average mood (all time) ──────────────────────────────────────────
      const allMoods = sessions.map((s) => s.emotional_state).filter(Boolean) as string[];
      let averageMood: string | null = null;
      if (allMoods.length > 0) {
        const avgScore = allMoods.reduce((s, m) => s + (MOOD_VALUES[m] ?? 3), 0) / allMoods.length;
        averageMood = MOOD_LABELS[Math.round(avgScore) - 1] ?? null;
      }

      // ── Daily view: last 30 calendar days ────────────────────────────────
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      const thirtyKey = toDateKey(thirtyDaysAgo);

      const daily: MoodEntry[] = allDayKeys
        .filter((dk) => dk >= thirtyKey)
        .map((dk) => {
          const d = dayMap.get(dk)!;
          const avgScore = d.moods.length > 0 ? d.scoreSum / d.moods.length : 3;
          const dominantMood = MOOD_LABELS[Math.round(avgScore) - 1] ?? 'neutral';
          return {
            date:    toDisplayLabel(dk),
            dateISO: dk,
            mood:    dominantMood,
            count:   d.count,
          };
        });

      // ── Weekly view: group by week (Sun–Sat), last 12 weeks ──────────────
      const weekMap = new Map<string, { count: number; scoreSum: number; moods: string[]; weekStart: Date }>();

      sessions.forEach((s) => {
        if (!s.created_at) return;
        const dt = new Date(s.created_at);
        const weekStart = new Date(dt);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const wk = toDateKey(weekStart);

        const existing = weekMap.get(wk) ?? { count: 0, scoreSum: 0, moods: [], weekStart };
        existing.count++;
        if (s.emotional_state) {
          existing.moods.push(s.emotional_state);
          existing.scoreSum += MOOD_VALUES[s.emotional_state] ?? 3;
        }
        weekMap.set(wk, existing);
      });

      const twelveWeeksAgo = new Date(today);
      twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 83); // ~12 weeks
      const twelveWeekKey = toDateKey(twelveWeeksAgo);

      const weekly: MoodEntry[] = Array.from(weekMap.entries())
        .filter(([wk]) => wk >= twelveWeekKey)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, d]) => {
          const avgScore = d.moods.length > 0 ? d.scoreSum / d.moods.length : 3;
          const dominantMood = MOOD_LABELS[Math.round(avgScore) - 1] ?? 'neutral';
          return {
            date:    `Week of ${toDisplayLabel(toDateKey(d.weekStart))}`,
            dateISO: toDateKey(d.weekStart),
            mood:    dominantMood,
            count:   d.count,
          };
        });

      setStats({ daily, weekly, currentStreak, averageMood, totalEntries });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load mood data';
      setError(msg);
      console.error('useMoodTracker error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (user) fetchMoodData();
  }, [user, fetchMoodData]);

  // Real-time: refresh whenever a new Daily Check-in is inserted
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`mood_tracker_${user.id}`)
      .on(
        'postgres_changes',
        {
          event:  'INSERT',
          schema: 'public',
          table:  'counseling_sessions',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchMoodData()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchMoodData]);

  return { stats, loading, error, refetch: fetchMoodData };
}
