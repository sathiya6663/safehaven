import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, ShieldAlert, ShieldCheck, RefreshCw, Info } from 'lucide-react';
import { useRiskScore } from '@/hooks/useRiskScore';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// Score: 0=safe → 100=danger
const LEVEL_CONFIG = {
  safe:    { icon: ShieldCheck, tone: 'border-green-500/30 bg-green-500/5',   text: 'text-green-600 dark:text-green-400',  label: 'SAFE',    bar: 'bg-green-500' },
  caution: { icon: Shield,      tone: 'border-yellow-500/30 bg-yellow-500/5', text: 'text-yellow-600 dark:text-yellow-400', label: 'CAUTION', bar: 'bg-yellow-500' },
  danger:  { icon: ShieldAlert, tone: 'border-red-500/30 bg-red-500/5',       text: 'text-red-600 dark:text-red-400',       label: 'HIGH RISK', bar: 'bg-red-500' },
};

export function RiskScoreCard() {
  const { risk, loading, recompute } = useRiskScore();
  const navigate = useNavigate();

  const cfg   = risk ? LEVEL_CONFIG[risk.level] : LEVEL_CONFIG.safe;
  const Icon  = cfg.icon;

  return (
    <Card className={cn('p-5 transition-colors', risk ? cfg.tone : 'border-muted')}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={cn('h-5 w-5', risk ? cfg.text : 'text-muted-foreground')} aria-hidden />
          <h3 className="font-heading font-semibold">Live Risk Score</h3>
        </div>
        <button
          onClick={recompute}
          disabled={loading}
          aria-label="Recalculate risk score"
          className="text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
        </button>
      </div>

      {risk ? (
        <>
          {/* Score + level */}
          <div className="flex items-baseline gap-2 mb-2">
            <span className={cn('text-4xl font-bold', cfg.text)}>{risk.score}</span>
            <span className="text-sm text-muted-foreground">/ 100</span>
            <Badge
              className={cn('ml-auto text-xs font-bold', cfg.text,
                risk.level === 'danger'  ? 'bg-red-100 dark:bg-red-900/30' :
                risk.level === 'caution' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                'bg-green-100 dark:bg-green-900/30'
              )}
              variant="outline"
            >
              {cfg.label}
            </Badge>
          </div>

          {/* Progress bar — red grows with risk */}
          <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden mb-3">
            <div
              className={cn('h-full rounded-full transition-all duration-700', cfg.bar)}
              style={{ width: `${risk.score}%` }}
            />
          </div>

          {/* Message */}
          <p className="text-sm mb-2">{risk.message}</p>

          {/* Confidence */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
            <Info className="h-3 w-3" />
            <span>{risk.confidenceLabel} • updated {risk.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>

          <Button variant="outline" size="sm" className="w-full" onClick={() => navigate('/risk-alert')}>
            View full analysis
          </Button>
        </>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Calculating risk score…</span>
        </div>
      )}
    </Card>
  );
}
