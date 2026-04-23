import { Header } from '@/components/layout/Header';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRiskScore } from '@/hooks/useRiskScore';
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export default function RiskAlert() {
  const { risk, loading, recompute } = useRiskScore();
  const navigate = useNavigate();

  const Icon = risk?.level === 'safe' ? ShieldCheck : risk?.level === 'caution' ? Shield : ShieldAlert;
  const iconTone =
    risk?.level === 'safe' ? 'text-primary' : risk?.level === 'caution' ? 'text-accent' : 'text-destructive';

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container px-4 py-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold mb-1">Risk Assessment</h1>
          <p className="text-muted-foreground text-sm">
            Live evaluation of your current safety context.
          </p>
        </div>

        <Card className="p-6 text-center">
          {risk ? (
            <>
              <Icon className={cn('h-16 w-16 mx-auto mb-3', iconTone)} aria-hidden="true" />
              <p className={cn('text-sm font-semibold uppercase tracking-wide mb-1', iconTone)}>
                {risk.level === 'safe' ? 'You are safe' : risk.level === 'caution' ? 'Stay cautious' : 'Elevated danger'}
              </p>
              <div className="text-5xl font-bold mb-2">{risk.score}</div>
              <Progress value={risk.score} className="h-2 mb-3" />
              <p className="text-sm text-muted-foreground">{risk.message}</p>
            </>
          ) : (
            <p className="text-muted-foreground">Calculating…</p>
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-heading font-semibold">Contributing factors</h2>
            <Button variant="ghost" size="sm" onClick={recompute} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
          {risk && risk.factors.length > 0 ? (
            <ul className="space-y-2">
              {risk.factors.map((f, i) => (
                <li key={i} className="flex items-start justify-between gap-3 text-sm">
                  <span className="flex items-start gap-2">
                    <AlertTriangle
                      className={cn(
                        'h-4 w-4 shrink-0 mt-0.5',
                        f.impact < 0 ? 'text-destructive' : 'text-primary'
                      )}
                    />
                    {f.label}
                  </span>
                  <span
                    className={cn(
                      'font-mono text-xs',
                      f.impact < 0 ? 'text-destructive' : 'text-primary'
                    )}
                  >
                    {f.impact > 0 ? '+' : ''}
                    {f.impact}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No contributing factors detected.</p>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-heading font-semibold mb-3">Recommended actions</h2>
          <div className="grid gap-2">
            <Button variant="outline" onClick={() => navigate('/sos')}>
              Open Emergency SOS
            </Button>
            <Button variant="outline" onClick={() => navigate('/emergency')}>
              Find safe spaces nearby
            </Button>
            <Button variant="outline" onClick={() => navigate('/profile')}>
              Update emergency contacts
            </Button>
          </div>
        </Card>
      </main>
      <BottomTabBar />
    </div>
  );
}
