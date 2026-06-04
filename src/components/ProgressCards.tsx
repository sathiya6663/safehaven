import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Calendar, TrendingUp, TrendingDown, RefreshCw, Star } from 'lucide-react';
import { useProgressTracking } from '@/hooks/useProgressTracking';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ── small metric row ──────────────────────────────────────────────────────────
function Metric({
  label,
  value,
  max,
  unit = '',
}: {
  label: string;
  value: number;
  max: number;
  unit?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold tabular-nums">
          {value}{unit}
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
}

export function ProgressCards() {
  const { stats, loading, error, refetch } = useProgressTracking();

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-center h-40 gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading progress…</span>
        </div>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="p-5 border-destructive/30 bg-destructive/5">
        <p className="text-sm text-destructive mb-3">{error || 'Unable to load progress data'}</p>
        <Button size="sm" variant="outline" onClick={refetch}>Retry</Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Period Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* TODAY */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-sm">Today</h3>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-primary">{stats.today.score}%</p>
              <p className="text-xs text-muted-foreground">Today's progress</p>
            </div>
            <Progress value={stats.today.score} className="h-2" />
            <div className="space-y-2 pt-2 border-t">
              <Metric label="Counseling Sessions" value={stats.today.counselingSessions} max={3} />
              <Metric label="Learning Modules"    value={stats.today.learningModules}    max={2} />
              <Metric label="Community Posts"     value={stats.today.communityPosts}     max={3} />
              <Metric label="Mood Check-ins"      value={stats.today.moodCheckIns}       max={1} />
            </div>
          </div>
        </Card>

        {/* THIS WEEK */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-sm">This Week</h3>
            <div className="flex items-center gap-1">
              {stats.trend >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span className={cn('text-xs font-semibold', stats.trend >= 0 ? 'text-green-500' : 'text-red-500')}>
                {stats.trend > 0 ? '+' : ''}{stats.trend}%
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-accent">{stats.thisWeek.score}%</p>
              <p className="text-xs text-muted-foreground">vs last week</p>
            </div>
            <Progress value={stats.thisWeek.score} className="h-2" />
            <div className="space-y-2 pt-2 border-t">
              <Metric label="Counseling Sessions" value={stats.thisWeek.counselingSessions} max={7}  />
              <Metric label="Learning Modules"    value={stats.thisWeek.learningModules}    max={5}  />
              <Metric label="Community Posts"     value={stats.thisWeek.communityPosts}     max={7}  />
              <Metric label="Mood Check-ins"      value={stats.thisWeek.moodCheckIns}       max={7}  />
            </div>
          </div>
        </Card>

        {/* THIS MONTH */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-sm">This Month</h3>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-2xl font-bold text-secondary">{stats.thisMonth.score}%</p>
              <p className="text-xs text-muted-foreground">Monthly progress</p>
            </div>
            <Progress value={stats.thisMonth.score} className="h-2" />
            <div className="space-y-2 pt-2 border-t">
              <Metric label="Counseling Sessions" value={stats.thisMonth.counselingSessions} max={20} />
              <Metric label="Learning Modules"    value={stats.thisMonth.learningModules}    max={10} />
              <Metric label="Community Posts"     value={stats.thisMonth.communityPosts}     max={20} />
              <Metric label="Mood Check-ins"      value={stats.thisMonth.moodCheckIns}       max={30} />
            </div>
          </div>
        </Card>
      </div>

      {/* ── Overall All-Time Card ── */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            <h3 className="font-heading font-semibold text-sm">Overall Progress</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={refetch} aria-label="Refresh progress">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-2xl font-bold text-primary">{stats.overall.totalSessions}</p>
            <p className="text-xs text-muted-foreground mt-1">Counseling Sessions</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-accent/5 border border-accent/20">
            <p className="text-2xl font-bold text-accent">{stats.overall.totalModules}</p>
            <p className="text-xs text-muted-foreground mt-1">Modules Completed</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-secondary/5 border border-secondary/20">
            <p className="text-2xl font-bold text-secondary">{stats.overall.totalCommunityPosts}</p>
            <p className="text-xs text-muted-foreground mt-1">Community Posts</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50 border border-muted">
            <p className="text-2xl font-bold">{stats.overall.totalMoodCheckIns}</p>
            <p className="text-xs text-muted-foreground mt-1">Mood Check-ins</p>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Overall Score</span>
            <span className="font-bold">{stats.overall.score}%</span>
          </div>
          <Progress value={stats.overall.score} className="h-3" />
        </div>
      </Card>
    </div>
  );
}
