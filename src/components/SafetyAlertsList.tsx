import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Shield, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSafetyAlerts } from '@/hooks/useSafetyAlerts';
import { useAuth } from '@/contexts/AuthContext';

export function SafetyAlertsList() {
  const { user } = useAuth();
  const { alerts, loading, acknowledgeAlert, resolveAlert } = useSafetyAlerts();
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('active');

  const filteredAlerts = alerts?.filter((alert) => {
    if (filter === 'all') return true;
    if (filter === 'active') return alert.status === 'active' || alert.status === 'acknowledged';
    if (filter === 'resolved') return alert.status === 'resolved';
    return true;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-emergency/10 text-emergency border-emergency';
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive';
      case 'medium':
        return 'bg-accent/10 text-accent border-accent';
      default:
        return 'bg-primary/10 text-primary border-primary';
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading safety alerts...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={filter === 'active' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('active')}
        >
          Active
        </Button>
        <Button
          variant={filter === 'resolved' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('resolved')}
        >
          Resolved
        </Button>
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
      </div>

      {filteredAlerts && filteredAlerts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">No {filter} alerts</p>
          </CardContent>
        </Card>
      ) : (
        filteredAlerts?.map((alert) => (
          <Card key={alert.id} className={cn('border-l-4', getSeverityColor(alert.severity))}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'p-2 rounded-full',
                      alert.status === 'resolved'
                        ? 'bg-primary/10'
                        : getSeverityColor(alert.severity)
                    )}
                  >
                    {alert.status === 'resolved' ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <AlertTriangle className="h-5 w-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{alert.title}</CardTitle>
                    <CardDescription className="mt-1">{alert.description}</CardDescription>
                    {alert.detected_content && (
                      <div className="mt-2 p-2 bg-muted rounded text-sm">
                        <p className="font-medium mb-1">Detected content:</p>
                        <p className="text-muted-foreground italic">
                          "{alert.detected_content.substring(0, 100)}..."
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <Badge variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}>
                  {alert.severity}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {new Date(alert.created_at!).toLocaleString()}
                </div>
                <div className="flex gap-2">
                  {alert.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => acknowledgeAlert(alert.id)}
                    >
                      Acknowledge
                    </Button>
                  )}
                  {(alert.status === 'active' || alert.status === 'acknowledged') && (
                    <Button size="sm" onClick={() => resolveAlert(alert.id)}>
                      Mark Resolved
                    </Button>
                  )}
                </div>
              </div>
              {alert.escalated_to && alert.escalated_to.length > 0 && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <ExternalLink className="h-4 w-4" />
                  <span className="text-muted-foreground">
                    Escalated to {alert.escalated_to.length} guardian(s)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
