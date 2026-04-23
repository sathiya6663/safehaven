import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Shield, ShieldAlert, ShieldCheck, RefreshCw } from 'lucide-react';
import { useRiskScore } from '@/hooks/useRiskScore';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function RiskScoreCard() {
  const { risk, loading, recompute } = useRiskScore();
  const navigate = useNavigate();

  const Icon = risk?.level === 'safe' ? ShieldCheck : risk?.level === 'caution' ? Shield : ShieldAlert;

  const tone =
    risk?.level === 'safe'
      ? 'border-primary/30 bg-primary/5'
      : risk?.level === 'caution'
      ? 'border-accent/30 bg-accent/5'
      : 'border-destructive/30 bg-destructive/5';

  const iconTone =
    risk?.level === 'safe' ? 'text-primary' : risk?.level === 'caution' ? 'text-accent' : 'text-destructive';

  return (
    <Card className={cn('p-5 transition-colors', tone)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-5 w-5', iconTone)} aria-hidden="true" />
          <h3 className="font-heading font-semibold">Live Risk Score</h3>
        </div>
        <button
          onClick={recompute}
          disabled={loading}
          aria-label="Recalculate risk score"
          className="text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </div>

      {risk ? (
        <>
          <div className="flex items-baseline gap-2 mb-2">
            <span className={cn('text-3xl font-bold', iconTone)}>{risk.score}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
            <span className={cn('ml-auto text-xs font-semibold uppercase tracking-wide', iconTone)}>
              {risk.level}
            </span>
          </div>
          <Progress value={risk.score} className="h-2 mb-3" />
          <p className="text-sm mb-3">{risk.message}</p>
          <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/risk-alert')}>
            View details
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Calculating your safety status…</p>
      )}
    </Card>
  );
}
