import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, RefreshCw } from 'lucide-react';
import { useMoodTracker } from '@/hooks/useMoodTracker';
import { useState } from 'react';
import {
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis,
  CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';

type ViewMode = 'daily' | 'weekly';

// Colour per mood for bar fill
const MOOD_COLORS: Record<string, string> = {
  happy:   'hsl(142 71% 45%)',   // green
  calm:    'hsl(217 91% 60%)',   // blue
  neutral: 'hsl(var(--primary))',
  anxious: 'hsl(38 92% 50%)',    // amber
  sad:     'hsl(0 84% 60%)',     // red
};

const MOOD_EMOJI: Record<string, string> = {
  happy: '😊', calm: '😌', neutral: '😐', anxious: '😰', sad: '😢',
};

// Custom tooltip for the bar chart
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const entry = payload[0]?.payload;
  return (
    <div
      style={{
        background: 'hsl(var(--background))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 8,
        padding: '8px 12px',
        fontSize: 12,
      }}
    >
      <p className="font-semibold mb-1">{label}</p>
      <p>{payload[0].value} check-in{payload[0].value !== 1 ? 's' : ''}</p>
      {entry?.mood && entry.mood !== 'logged' && (
        <p>Mood: {MOOD_EMOJI[entry.mood] ?? ''} {entry.mood}</p>
      )}
    </div>
  );
}

export function MoodTrackerChart() {
  const { stats, loading, error, refetch } = useMoodTracker();
  const [viewMode, setViewMode] = useState<ViewMode>('daily');

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-center h-64 gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading mood data…</span>
        </div>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="p-5 border-destructive/30 bg-destructive/5">
        <p className="text-sm text-destructive mb-3">{error || 'Unable to load mood data'}</p>
        <Button size="sm" variant="outline" onClick={refetch}>Retry</Button>
      </Card>
    );
  }

  const data = viewMode === 'daily' ? stats.daily : stats.weekly;
  const isEmpty = data.length === 0;

  return (
    <Card className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-heading font-semibold">Mood Tracker</h3>
        </div>
        <div className="flex items-center gap-2">
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
          <Button variant="ghost" size="icon" onClick={refetch} aria-label="Refresh mood data">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isEmpty ? (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">No mood entries yet</p>
          <p className="text-xs text-muted-foreground">
            Start logging your daily check-ins to see trends here
          </p>
        </div>
      ) : (
        <>
          {/* Chart */}
          <div className="mb-4 h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'daily' ? (
                <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {data.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={MOOD_COLORS[entry.mood] ?? 'hsl(var(--primary))'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <LineChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center">
              <p className="text-xs text-muted-foreground mb-1">Current Streak</p>
              <p className="text-2xl font-bold text-primary">{stats.currentStreak}</p>
              <p className="text-xs text-muted-foreground">days</p>
            </div>
            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20 text-center">
              <p className="text-xs text-muted-foreground mb-1">Average Mood</p>
              <p className="text-xl">{stats.averageMood ? MOOD_EMOJI[stats.averageMood] : '—'}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {stats.averageMood ?? 'No data'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-secondary/5 border border-secondary/20 text-center">
              <p className="text-xs text-muted-foreground mb-1">Total Entries</p>
              {/* Use all-time totalEntries — not just the 7-day daily array */}
              <p className="text-2xl font-bold text-secondary">{stats.totalEntries}</p>
              <p className="text-xs text-muted-foreground">all time</p>
            </div>
          </div>

          {/* Mood legend */}
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.entries(MOOD_EMOJI).map(([mood, emoji]) => (
              <span key={mood} className="flex items-center gap-1 text-xs text-muted-foreground">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm"
                  style={{ background: MOOD_COLORS[mood] }}
                />
                {emoji} {mood}
              </span>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            {viewMode === 'daily'
              ? 'Showing last 30 days — bar colour reflects your dominant mood that day.'
              : 'Showing last 12 weeks — track your emotional patterns over time.'}
          </p>
        </>
      )}
    </Card>
  );
}
