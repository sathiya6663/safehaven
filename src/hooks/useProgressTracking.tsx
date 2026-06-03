import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type DailyProgress = {
  date: string;
  sessionsCount: number;
  modulesCount: number;
  alertsCount: number;
  totalScore: number;
};

export type ProgressStats = {
  today: DailyProgress;
  thisWeek: DailyProgress;
  thisMonth: DailyProgress;
  trend: number; // percentage change from previous period
};

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
      const now = new Date();
      const today = new Date(now);
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const lastWeekStart = new Date(weekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch today's data
      const [sessionsRes, modulesRes, alertsRes] = await Promise.all([
        supabase
          .from('counseling_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString()),
        supabase
          .from('learning_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', today.toISOString())
          .lt('completed_at', tomorrow.toISOString()),
        supabase
          .from('safety_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', today.toISOString())
          .lt('created_at', tomorrow.toISOString()),
      ]);

      const todayProgress: DailyProgress = {
        date: today.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        sessionsCount: sessionsRes.count ?? 0,
        modulesCount: modulesRes.count ?? 0,
        alertsCount: alertsRes.count ?? 0,
        totalScore: Math.min(
          100,
          (sessionsRes.count ?? 0) * 20 +
            (modulesRes.count ?? 0) * 25 +
            Math.max(0, 50 - ((alertsRes.count ?? 0) * 10))
        ),
      };

      // Fetch this week's data
      const [weekSessionsRes, weekModulesRes, weekAlertsRes] = await Promise.all([
        supabase
          .from('counseling_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', weekStart.toISOString())
          .lt('created_at', tomorrow.toISOString()),
        supabase
          .from('learning_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', weekStart.toISOString())
          .lt('completed_at', tomorrow.toISOString()),
        supabase
          .from('safety_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', weekStart.toISOString())
          .lt('created_at', tomorrow.toISOString()),
      ]);

      const thisWeekProgress: DailyProgress = {
        date: `Week of ${weekStart.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}`,
        sessionsCount: weekSessionsRes.count ?? 0,
        modulesCount: weekModulesRes.count ?? 0,
        alertsCount: weekAlertsRes.count ?? 0,
        totalScore: Math.min(
          100,
          (weekSessionsRes.count ?? 0) * 20 +
            (weekModulesRes.count ?? 0) * 25 +
            Math.max(0, 50 - ((weekAlertsRes.count ?? 0) * 10))
        ),
      };

      // Fetch this month's data
      const [monthSessionsRes, monthModulesRes, monthAlertsRes] = await Promise.all([
        supabase
          .from('counseling_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', monthStart.toISOString())
          .lt('created_at', tomorrow.toISOString()),
        supabase
          .from('learning_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', monthStart.toISOString())
          .lt('completed_at', tomorrow.toISOString()),
        supabase
          .from('safety_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', monthStart.toISOString())
          .lt('created_at', tomorrow.toISOString()),
      ]);

      const thisMonthProgress: DailyProgress = {
        date: now.toLocaleDateString('en-US', { month: 'long' }),
        sessionsCount: monthSessionsRes.count ?? 0,
        modulesCount: monthModulesRes.count ?? 0,
        alertsCount: monthAlertsRes.count ?? 0,
        totalScore: Math.min(
          100,
          (monthSessionsRes.count ?? 0) * 20 +
            (monthModulesRes.count ?? 0) * 25 +
            Math.max(0, 50 - ((monthAlertsRes.count ?? 0) * 10))
        ),
      };

      // Calculate trend (compare last week to this week)
      const [lastWeekSessionsRes, lastWeekModulesRes] = await Promise.all([
        supabase
          .from('counseling_sessions')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('created_at', lastWeekStart.toISOString())
          .lt('created_at', weekStart.toISOString()),
        supabase
          .from('learning_progress')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .gte('completed_at', lastWeekStart.toISOString())
          .lt('completed_at', weekStart.toISOString()),
      ]);

      const lastWeekScore = Math.min(
        100,
        (lastWeekSessionsRes.count ?? 0) * 20 + (lastWeekModulesRes.count ?? 0) * 25
      );
      const trend =
        lastWeekScore > 0
          ? ((thisWeekProgress.totalScore - lastWeekScore) / lastWeekScore) * 100
          : 0;

      setStats({
        today: todayProgress,
        thisWeek: thisWeekProgress,
        thisMonth: thisMonthProgress,
        trend: Math.round(trend),
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to calculate progress';
      setError(errorMsg);
      console.error('Progress tracking error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      calculateProgress();
    }
  }, [user, calculateProgress]);

  return { stats, loading, error, refetch: calculateProgress };
}
