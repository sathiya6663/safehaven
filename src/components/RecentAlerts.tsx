import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Bell, BellOff, Shield, Siren } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  useSafetyAlerts,
  requestNotificationPermission,
  type UnifiedAlert,
} from '@/hooks/useSafetyAlerts';

interface RecentAlertsProps {
  limit?: number;
  className?: string;
}

const sevStyle = (sev: UnifiedAlert['severity']) => {
  switch (sev) {
    case 'critical':
      return 'border-l-emergency bg-emergency/5 text-emergency';
    case 'high':
      return 'border-l-destructive bg-destructive/5 text-destructive';
    case 'medium':
      return 'border-l-accent bg-accent/5 text-accent-foreground';
    default:
      return 'border-l-primary bg-primary/5 text-primary';
  }
};

const timeAgo = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

/**
 * Realtime feed combining safety_alerts and sos_logs for the current user.
 * Live updates, sound chime, and browser notification are wired in
 * useSafetyAlerts. This component only renders.
 */
export function RecentAlerts({ limit = 5, className }: RecentAlertsProps) {
  const { unified, loading } = useSafetyAlerts();

  // Ask once for notification permission when this widget mounts in-app
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const items = unified.slice(0, limit);
  const notifPermission =
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported';

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Recent Alerts
          <Badge variant="secondary" className="ml-1">
            {unified.length}
          </Badge>
        </h3>
        <div className="flex items-center gap-2">
          {notifPermission === 'denied' ? (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <BellOff className="h-3 w-3" /> Notifications off
            </span>
          ) : notifPermission === 'default' ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => requestNotificationPermission()}
            >
              <Bell className="h-3 w-3 mr-1" /> Enable alerts
            </Button>
          ) : null}
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          Loading alerts…
        </p>
      ) : items.length === 0 ? (
        <div className="py-6 text-center">
          <Shield className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No recent alerts</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((a) => (
            <li
              key={a.id}
              className={cn(
                'border-l-4 rounded-md p-3 flex items-start gap-3',
                sevStyle(a.severity),
              )}
            >
              <div className="mt-0.5">
                {a.source === 'sos' ? (
                  <Siren className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium text-foreground truncate">
                    {a.title}
                  </p>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {timeAgo(a.created_at)}
                  </span>
                </div>
                {a.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {a.description}
                  </p>
                )}
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                    {a.severity}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                    {a.status}
                  </Badge>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 text-right">
        <Button asChild variant="link" size="sm" className="h-auto p-0">
          <Link to="/safety-monitor">View all →</Link>
        </Button>
      </div>
    </Card>
  );
}
