import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp } from 'lucide-react';
import { useMoodTracker } from '@/hooks/useMoodTracker';
import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { cn } from '@/lib/utils';

type ViewMode = 'daily' | 'weekly';

export function MoodTrackerChart() {
  const { stats, loading, error } = useMoodTracker();
  const [viewMode, setViewMode] = useState<ViewMode>('daily');

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="p-5 border-destructive/30 bg-destructive/5">
        <p className="text-sm text-destructive">{error || 'Unable to load mood data'}</p>
      </Card>
    );
  }

  const data = viewMode === 'daily' ? stats.daily : stats.weekly;
  const isEmpty = !data || data.length === 0;

  const moodEmoji: { [key: string]: string } = {
    happy: '😊',
    calm: '😌',
    neutral: '😐',
    anxious: '😰',
    sad: '😢',
  };

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-heading font-semibold">Mood Tracker</h3>
        </div>
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'daily' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('daily')}
          >
            Daily
          </Button>
          <Button
            variant={viewMode === 'weekly' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('weekly')}
          >
            Weekly
          </Button>
        </div>
      </div>

      {isEmpty ? (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">No mood entries yet</p>
          <p className="text-xs text-muted-foreground">
            Start logging your daily check-ins to see trends
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'daily' ? (
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                    }}
                    formatter={(value) => [`${value} check-in(s)`, 'Entries']}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              ) : (
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                    }}
                    formatter={(value) => [`${value} check-in(s)`, 'Weekly Total']}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    dot={{ fill: 'hsl(var(--primary))' }}
                    strokeWidth={2}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground mb-1">Current Streak</p>
              <p className="text-2xl font-bold text-primary">{stats.currentStreak}</p>
              <p className="text-xs text-muted-foreground">days</p>
            </div>
            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
              <p className="text-xs text-muted-foreground mb-1">Average Mood</p>
              <p className="text-xl">{stats.averageMood ? moodEmoji[stats.averageMood] : '—'}</p>
              <p className="text-xs text-muted-foreground capitalize">{stats.averageMood || 'No data'}</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/5 border border-secondary/20">
              <p className="text-xs text-muted-foreground mb-1">Total Entries</p>
              <p className="text-2xl font-bold text-secondary">
                {stats.daily.reduce((sum, d) => sum + d.count, 0)}
              </p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {viewMode === 'daily'
              ? `Showing last 7 days of mood check-ins. Keep logging daily to build your streak!`
              : `Showing last 4 weeks of mood trends. Track your emotional patterns over time.`}
          </p>
        </>
      )}
    </Card>
  );
}
