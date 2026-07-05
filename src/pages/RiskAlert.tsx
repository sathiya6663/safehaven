import { Header } from '@/components/layout/Header';
import { BottomTabBar } from '@/components/layout/BottomTabBar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useRiskScore } from '@/hooks/useRiskScore';
import {
  Shield, ShieldAlert, ShieldCheck,
  AlertTriangle, CheckCircle, RefreshCw,
  Clock, MapPin, Activity, User, Info, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// ── Config ─────────────────────────────────────────────────────────────────
const LEVEL_CONFIG = {
  safe:    {
    icon:        ShieldCheck,
    colorText:   'text-green-600 dark:text-green-400',
    colorBg:     'bg-green-500/10 border-green-500/30',
    colorBar:    'bg-green-500',
    label:       'SAFE',
    description: 'Your current situation appears safe.',
  },
  caution: {
    icon:        Shield,
    colorText:   'text-yellow-600 dark:text-yellow-400',
    colorBg:     'bg-yellow-500/10 border-yellow-500/30',
    colorBar:    'bg-yellow-500',
    label:       'CAUTION',
    description: 'Some risk factors are present. Stay aware.',
  },
  danger:  {
    icon:        ShieldAlert,
    colorText:   'text-red-600 dark:text-red-400',
    colorBg:     'bg-red-500/10 border-red-500/30',
    colorBar:    'bg-red-500',
    label:       'HIGH RISK',
    description: 'Elevated risk detected. Take precautions.',
  },
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  time:        Clock,
  movement:    Activity,
  environment: MapPin,
  personal:    User,
  safety:      Shield,
  location:    MapPin,
};

// ── Confidence bar colour ─────────────────────────────────────────────────
function confidenceColor(c: number) {
  if (c >= 75) return 'bg-green-500';
  if (c >= 45) return 'bg-yellow-500';
  return 'bg-gray-400';
}

// ── Component ──────────────────────────────────────────────────────────────
export default function RiskAlert() {
  const { risk, loading, recompute } = useRiskScore();
  const navigate = useNavigate();

  const cfg  = risk ? LEVEL_CONFIG[risk.level] : LEVEL_CONFIG.safe;
  const Icon = cfg.icon;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header />
      <main className="container px-4 py-6 max-w-2xl mx-auto space-y-5">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-heading font-bold mb-1">Risk Assessment</h1>
          <p className="text-muted-foreground text-sm">
            Live evaluation of your current safety context. Updates every 30 seconds.
          </p>
        </div>

        {/* Main score card */}
        <Card className={cn('p-6 border', risk ? cfg.colorBg : 'border-muted')}>
          {!risk ? (
            <div className="flex items-center justify-center gap-3 py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Calculating risk score…</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Icon className={cn('h-10 w-10', cfg.colorText)} />
                  <div>
                    <Badge variant="outline" className={cn('text-sm font-bold', cfg.colorText)}>
                      {cfg.label}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-0.5">{cfg.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={cn('text-5xl font-bold', cfg.colorText)}>{risk.score}</span>
                  <span className="text-sm text-muted-foreground"> / 100</span>
                </div>
              </div>

              {/* Risk bar — 0=green(safe) → 100=red(danger) */}
              <div className="relative h-3 w-full rounded-full bg-muted overflow-hidden mb-4">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', cfg.colorBar)}
                  style={{ width: `${risk.score}%` }}
                  role="progressbar"
                  aria-valuenow={risk.score}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>

              {/* Score scale */}
              <div className="flex justify-between text-xs text-muted-foreground mb-4">
                <span className="text-green-600 font-medium">0 — Safe</span>
                <span className="text-yellow-600 font-medium">31–60 — Caution</span>
                <span className="text-red-600 font-medium">61–100 — High Risk</span>
              </div>

              {/* Message */}
              <p className="text-sm font-medium mb-2">{risk.message}</p>

              {/* Explanation */}
              <p className="text-sm text-muted-foreground mb-4">{risk.explanation}</p>

              {/* Confidence + last updated */}
              <div className="p-3 rounded-lg bg-muted/40 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 font-medium">
                    <Info className="h-3 w-3" />
                    Prediction Confidence
                  </span>
                  <span className="font-bold">{risk.confidence}% — {risk.confidenceLabel}</span>
                </div>
                <div className="relative h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full transition-all', confidenceColor(risk.confidence))}
                    style={{ width: `${risk.confidence}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Last updated: {risk.updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  {risk.location && ` · ${risk.location.latitude.toFixed(4)}, ${risk.location.longitude.toFixed(4)}`}
                </p>
              </div>
            </>
          )}
        </Card>

        {/* Contributing factors */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-semibold">Contributing Factors</h2>
            <Button variant="ghost" size="sm" onClick={recompute} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4 mr-1.5', loading && 'animate-spin')} />
              Refresh
            </Button>
          </div>

          {risk && risk.factors.length > 0 ? (
            <div className="space-y-3">
              {risk.factors
                .filter((f) => f.impact !== 0)
                .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
                .map((f, i) => {
                  const CatIcon = CATEGORY_ICONS[f.category] ?? Shield;
                  const isRisk  = f.impact > 0;
                  return (
                    <div
                      key={i}
                      className={cn(
                        'p-3 rounded-lg border',
                        isRisk
                          ? 'border-red-200 bg-red-50 dark:border-red-900/30 dark:bg-red-950/20'
                          : 'border-green-200 bg-green-50 dark:border-green-900/30 dark:bg-green-950/20'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          {isRisk
                            ? <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                            : <CheckCircle   className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                          }
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{f.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{f.detail}</p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs font-mono shrink-0',
                            isRisk ? 'text-red-600' : 'text-green-600'
                          )}
                        >
                          {isRisk ? '+' : ''}{f.impact}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {loading ? 'Analysing factors…' : 'No significant risk factors at this time.'}
            </p>
          )}
        </Card>

        {/* Recommended actions */}
        <Card className="p-5">
          <h2 className="font-heading font-semibold mb-3">Recommended Actions</h2>
          <div className="grid gap-2">
            {risk?.level === 'danger' && (
              <Button variant="destructive" onClick={() => navigate('/sos')}>
                <ShieldAlert className="h-4 w-4 mr-2" />
                Activate Emergency SOS
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/emergency')}>
              <MapPin className="h-4 w-4 mr-2" />
              Find safe spaces nearby
            </Button>
            <Button variant="outline" onClick={() => navigate('/sos')}>
              Open SOS screen
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
