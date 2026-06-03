import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MessageCircle, Clock, AlertTriangle } from 'lucide-react';
import { useSessionHistory } from '@/hooks/useSessionHistory';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export function SessionHistoryComponent() {
  const { history, loading, error } = useSessionHistory(5);
  const navigate = useNavigate();

  if (loading) {
    return (
      <Card className="p-5">
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (error || !history) {
    return (
      <Card className="p-5 border-destructive/30 bg-destructive/5">
        <p className="text-sm text-destructive">{error || 'Unable to load session history'}</p>
      </Card>
    );
  }

  const isEmpty = !history.sessions || history.sessions.length === 0;

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h3 className="font-heading font-semibold">Recent Sessions</h3>
          {history.totalSessions > 0 && (
            <Badge variant="secondary" className="ml-1">
              {history.totalSessions}
            </Badge>
          )}
        </div>
      </div>

      {isEmpty ? (
        <div className="py-8 text-center">
          <MessageCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground mb-2">No sessions yet</p>
          <p className="text-xs text-muted-foreground mb-4">
            Start a counseling session to see your session history
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate('/counseling')}
          >
            Start a Session
          </Button>
        </div>
      ) : (
        <>
          <ul className="space-y-3 mb-4">
            {history.sessions.map((session) => (
              <li
                key={session.id}
                className={cn(
                  'p-3 rounded-lg border cursor-pointer transition-colors hover:bg-accent/5',
                  session.crisisDetected
                    ? 'border-destructive/50 bg-destructive/5'
                    : 'border-border hover:border-primary/50'
                )}
                onClick={() => navigate(`/counseling?sessionId=${session.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm line-clamp-1">{session.topic}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{session.date}</p>
                    {session.summary && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {session.summary}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {session.crisisDetected && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                    {session.duration > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {session.duration}m
                      </div>
                    )}
                  </div>
                </div>
                {session.emotionalState && (
                  <div className="mt-2">
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5 capitalize">
                      {session.emotionalState}
                    </Badge>
                  </div>
                )}
              </li>
            ))}
          </ul>

          {history.totalSessions > 0 && (
            <div className="pt-3 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Average Duration</span>
                <span className="font-semibold">{history.averageDuration} min</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Sessions</span>
                <span className="font-semibold">{history.totalSessions}</span>
              </div>
            </div>
          )}

          <Button
            variant="link"
            size="sm"
            className="w-full h-auto p-0 mt-3"
            onClick={() => navigate('/counseling?view=history')}
          >
            View All Sessions →
          </Button>
        </>
      )}
    </Card>
  );
}
