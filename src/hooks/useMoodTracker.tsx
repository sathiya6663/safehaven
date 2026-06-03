import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type MoodEntry = {
  date: string;
  mood: string;
  count: number;
};

export type MoodStats = {
  daily: MoodEntry[];
  weekly: MoodEntry[];
  currentStreak: number;
  averageMood: string | null;
};

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
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Fetch mood entries (counseling sessions with topic "Daily Check-in")
      const { data: sessions, error: sessionsError } = await supabase
        .from('counseling_sessions')
        .select('created_at, emotional_state')
        .eq('user_id', user.id)
        .eq('topic', 'Daily Check-in')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Process daily data (last 7 days)
      const dailyMoods = new Map<string, number>();
      const moodStates: string[] = [];

      sessions?.forEach((session) => {
        const date = new Date(session.created_at!).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        if (new Date(session.created_at!) >= sevenDaysAgo) {
          const count = dailyMoods.get(date) || 0;
          dailyMoods.set(date, count + 1);
        }

        if (session.emotional_state) {
          moodStates.push(session.emotional_state);
        }
      });

      // Convert to array and sort by date
      const dailyArray = Array.from(dailyMoods.entries())
        .map(([date, count]) => ({
          date,
          mood: 'logged',
          count,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Process weekly data (last 30 days)
      const weeklyMoods = new Map<string, number>();
      sessions?.forEach((session) => {
        const sessionDate = new Date(session.created_at!);
        const weekStart = new Date(sessionDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekLabel = `Week of ${weekStart.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}`;

        const count = weeklyMoods.get(weekLabel) || 0;
        weeklyMoods.set(weekLabel, count + 1);
      });

      const weeklyArray = Array.from(weeklyMoods.entries())
        .map(([date, count]) => ({
          date,
          mood: 'logged',
          count,
        }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // Calculate current streak (consecutive days with mood logged)
      let currentStreak = 0;
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);

      while (true) {
        const dateStr = checkDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        if (dailyMoods.has(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Calculate average mood
      const moodValues: { [key: string]: number } = {
        happy: 5,
        calm: 4,
        neutral: 3,
        anxious: 2,
        sad: 1,
      };

      const averageScore =
        moodStates.length > 0
          ? moodStates.reduce((sum, mood) => sum + (moodValues[mood] || 3), 0) /
            moodStates.length
          : 0;

      const moodLabels = ['sad', 'anxious', 'neutral', 'calm', 'happy'];
      const averageMood =
        averageScore > 0 ? moodLabels[Math.round(averageScore) - 1] : null;

      setStats({
        daily: dailyArray,
        weekly: weeklyArray,
        currentStreak,
        averageMood,
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load mood data';
      setError(errorMsg);
      console.error('Mood tracker error:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMoodData();
    }
  }, [user, fetchMoodData]);

  return { stats, loading, error, refetch: fetchMoodData };
}
