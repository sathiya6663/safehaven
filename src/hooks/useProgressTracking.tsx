import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ────────────────────────────────────────────────────────────────────

export type PeriodStats = {
  label: string;
  // raw counts
  counselingSessions: number;
  learningModules: number;
  communityPosts: number;
  moodCheckIns: number;
  // derived score 0-100
  score: number;
};

export type ProgressStats = {
  today:     PeriodStats;
  thisWeek:  PeriodStats;
  thisMonth: PeriodStats;
  overall: {
    totalSessions:       number;
    totalModules:        number;
    totalCommunityPosts: number;
    totalMoodCheckIns:   number;
    score:               number; // 0–100
  };
  trend: number; // % change this week vs last week
};

// ── Score formula ─────────────────────────────────────────────────────────────
// Points:
//   counseling session  = 20 pts  (max 3/day → 60 pts)
//   learning module     = 25 pts  (max 4/month → 100 pts)
//   community post      = 10 pts  (max 3/period → 30 pts)
//   mood check-in       = 10 pts  (max 1/day → 10 pts)
// Score is capped at 100.
function calcScore(
  sessions: number,
  modules: number,
  posts: number,
  moods: number
): number {
  return Math.min(100, sessions * 20 + modules * 25 + posts * 10 + moods * 10);
}

// ── Date helpers ──────────────────────────────────────────────────────────────
function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfTomorrow(): Date {
  const d = startOfToday();
  d.setDate(d.getDate() + 1);
  return d;
}
function startOfThisWeek(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 6); // last 7 days (rolling)
  d.setHours(0, 0, 0, 0);
  return d;
}
function startOfThisMonth(): Date {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}
function startOfLastWeek(): Date {
  const d = startOfThisWeek();
  d.setDate(d.getDate() - 7);
  return d;
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useProgressTracking() {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateProgress = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      const todayISO      = startOfToday().toISOString();
      const tomorrowISO   = startOfTomorrow().toISOString();
      const weekISO       = startOfThisWeek().toISOString();
      const monthISO      = startOfThisMonth().toISOString();
      const lastWeekISO   = startOfLastWeek().toISOString();

      // ── Run all queries in parallel ────────────────────────────────────────
      const [
        // TODAY
        todaySessions, todayModules, todayPosts, todayMoods,
        // THIS WEEK
        weekSessions, weekModules, weekPosts, weekMoods,
        // LAST WEEK (for trend)
        lastWeekSessions, lastWeekModules, lastWeekPosts,
        // THIS MONTH
        monthSessions, monthModules, monthPosts, monthMoods,
        // OVERALL (all time)
        allSessions, allModules, allPosts, allMoods,
      ] = await Promise.all([
        // TODAY — counseling sessions
        supabase.from('counseling_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .neq('topic', 'Daily Check-in')  // exclude mood check-ins
          .gte('created_at', todayISO).lt('created_at', tomorrowISO),

        // TODAY — completed learning modules
        // Use updated_at as fallback when completed_at is null
        supabase.from('learning_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('last_accessed', todayISO).lt('last_accessed', tomorrowISO),

        // TODAY — community posts
        supabase.from('community_posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', todayISO).lt('created_at', tomorrowISO),

        // TODAY — mood check-ins
        supabase.from('counseling_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('topic', 'Daily Check-in')
          .gte('created_at', todayISO).lt('created_at', tomorrowISO),

        // THIS WEEK — counseling sessions
        supabase.from('counseling_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .neq('topic', 'Daily Check-in')
          .gte('created_at', weekISO).lt('created_at', tomorrowISO),

        // THIS WEEK — completed learning modules
        supabase.from('learning_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('last_accessed', weekISO).lt('last_accessed', tomorrowISO),

        // THIS WEEK — community posts
        supabase.from('community_posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', weekISO).lt('created_at', tomorrowISO),

        // THIS WEEK — mood check-ins
        supabase.from('counseling_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('topic', 'Daily Check-in')
          .gte('created_at', weekISO).lt('created_at', tomorrowISO),

        // LAST WEEK — sessions (for trend)
        supabase.from('counseling_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .neq('topic', 'Daily Check-in')
          .gte('created_at', lastWeekISO).lt('created_at', weekISO),

        // LAST WEEK — modules (for trend)
        supabase.from('learning_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('last_accessed', lastWeekISO).lt('last_accessed', weekISO),

        // LAST WEEK — posts (for trend)
        supabase.from('community_posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', lastWeekISO).lt('created_at', weekISO),

        // THIS MONTH — sessions
        supabase.from('counseling_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .neq('topic', 'Daily Check-in')
          .gte('created_at', monthISO).lt('created_at', tomorrowISO),

        // THIS MONTH — modules
        supabase.from('learning_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('last_accessed', monthISO).lt('last_accessed', tomorrowISO),

        // THIS MONTH — community posts
        supabase.from('community_posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', monthISO).lt('created_at', tomorrowISO),

        // THIS MONTH — mood check-ins
        supabase.from('counseling_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('topic', 'Daily Check-in')
          .gte('created_at', monthISO).lt('created_at', tomorrowISO),

        // ALL TIME — sessions
        supabase.from('counseling_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .neq('topic', 'Daily Check-in'),

        // ALL TIME — completed modules
        supabase.from('learning_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed'),

        // ALL TIME — community posts
        supabase.from('community_posts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id),

        // ALL TIME — mood check-ins
        supabase.from('counseling_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('topic', 'Daily Check-in'),
      ]);

      // ── Extract counts ─────────────────────────────────────────────────────
      const c = (r: { count: number | null }) => r.count ?? 0;

      const ts = c(todaySessions);   const tm = c(todayModules);    const tp = c(todayPosts);   const tmo = c(todayMoods);
      const ws = c(weekSessions);    const wm = c(weekModules);     const wp = c(weekPosts);    const wmo = c(weekMoods);
      const lws = c(lastWeekSessions); const lwm = c(lastWeekModules); const lwp = c(lastWeekPosts);
      const ms = c(monthSessions);   const mm = c(monthModules);    const mp = c(monthPosts);   const mmo = c(monthMoods);
      const as_ = c(allSessions);    const am = c(allModules);      const ap = c(allPosts);     const amo = c(allMoods);

      // ── Scores ─────────────────────────────────────────────────────────────
      const todayScore     = calcScore(ts, tm, tp, tmo);
      const weekScore      = calcScore(ws, wm, wp, wmo);
      const lastWeekScore  = calcScore(lws, lwm, lwp, 0);
      const monthScore     = calcScore(ms, mm, mp, mmo);

      // Overall score: normalised across all activities
      // Max sensible all-time totals per activity
      const overallScore = Math.min(
        100,
        Math.round(
          (as_ > 0 ? Math.min(30, as_ * 5) : 0) +
          (am  > 0 ? Math.min(40, am  * 8) : 0) +
          (ap  > 0 ? Math.min(20, ap  * 4) : 0) +
          (amo > 0 ? Math.min(10, amo * 1) : 0)
        )
      );

      // Trend: % change this week vs last week (0 if last week had no activity)
      const trend = lastWeekScore > 0
        ? Math.round(((weekScore - lastWeekScore) / lastWeekScore) * 100)
        : weekScore > 0 ? 100 : 0;

      setStats({
        today: {
          label:               'Today',
          counselingSessions:  ts,
          learningModules:     tm,
          communityPosts:      tp,
          moodCheckIns:        tmo,
          score:               todayScore,
        },
        thisWeek: {
          label:               'This Week',
          counselingSessions:  ws,
          learningModules:     wm,
          communityPosts:      wp,
          moodCheckIns:        wmo,
          score:               weekScore,
        },
        thisMonth: {
          label:               'This Month',
          counselingSessions:  ms,
          learningModules:     mm,
          communityPosts:      mp,
          moodCheckIns:        mmo,
          score:               monthScore,
        },
        overall: {
          totalSessions:       as_,
          totalModules:        am,
          totalCommunityPosts: ap,
          totalMoodCheckIns:   amo,
          score:               overallScore,
        },
        trend,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to calculate progress';
      setError(msg);
      console.error('useProgressTracking error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) calculateProgress();
  }, [user, calculateProgress]);

  // Real-time refresh when any relevant table changes
  useEffect(() => {
    if (!user) return;
    const tables = ['counseling_sessions', 'learning_progress', 'community_posts'];
    const channels = tables.map((table) =>
      supabase
        .channel(`progress_${table}_${user.id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table, filter: `user_id=eq.${user.id}` },
          () => calculateProgress()
        )
        .subscribe()
    );
    return () => { channels.forEach((ch) => supabase.removeChannel(ch)); };
  }, [user, calculateProgress]);

  return { stats, loading, error, refetch: calculateProgress };
}
