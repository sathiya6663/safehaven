import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { useProgressTracking } from '@/hooks/useProgressTracking';
import { cn } from '@/lib/utils';

export function ProgressCards() {
  const { stats, loading, error } = useProgressTracking();

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card className="p-5 border-destructive/30 bg-destructive/5">
        <p className="text-sm text-destructive">{error || 'Unable to load progress data'}</p>
      </Card>
    );
  }

  const renderProgressMetric = (label: string, count: number, total: number) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-semibold">{count}</span>
        </div>
        <Progress value={Math.min(100, (count / Math.max(total, 1)) * 100)} className="h-1.5" />
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Today Card */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-sm">Today</h3>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-2xl font-bold text-primary">{stats.today.totalScore}%</p>
            <p className="text-xs text-muted-foreground">Overall Progress</p>
          </div>
          <Progress value={stats.today.totalScore} className="h-2" />
          <div className="space-y-2 pt-2 border-t">
            {renderProgressMetric('Counseling Sessions', stats.today.sessionsCount, 3)}
            {renderProgressMetric('Learning Modules', stats.today.modulesCount, 2)}
          </div>
        </div>
      </Card>

      {/* This Week Card */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-sm">This Week</h3>
          <div className="flex items-center gap-1">
            {stats.trend >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span
              className={cn(
                'text-xs font-semibold',
                stats.trend >= 0 ? 'text-green-500' : 'text-red-500'
              )}
            >
              {Math.abs(stats.trend)}%
            </span>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-2xl font-bold text-accent">{stats.thisWeek.totalScore}%</p>
            <p className="text-xs text-muted-foreground">vs last week</p>
          </div>
          <Progress value={stats.thisWeek.totalScore} className="h-2" />
          <div className="space-y-2 pt-2 border-t">
            <div>
              <p className="text-xs font-medium">
                {stats.thisWeek.sessionsCount} counseling sessions
              </p>
            </div>
            <div>
              <p className="text-xs font-medium">
                {stats.thisWeek.modulesCount} learning modules
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* This Month Card */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-sm">This Month</h3>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-2xl font-bold text-secondary">{stats.thisMonth.totalScore}%</p>
            <p className="text-xs text-muted-foreground">Monthly Progress</p>
          </div>
          <Progress value={stats.thisMonth.totalScore} className="h-2" />
          <div className="space-y-2 pt-2 border-t">
            <div>
              <p className="text-xs font-medium">
                {stats.thisMonth.sessionsCount} counseling sessions
              </p>
            </div>
            <div>
              <p className="text-xs font-medium">
                {stats.thisMonth.modulesCount} learning modules
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
