/**
 * SOS — Real-Time Emergency Response Screen
 *
 * UX Flow:
 *  1. User taps ACTIVATE SOS → no countdown → immediate activation
 *  2. GPS + audio + video start in parallel within 1 second
 *  3. Live status dashboard shows recording seconds, contacts notified,
 *     evidence segments uploaded, live GPS coordinates
 *  4. Tap STOP SOS → final segment uploaded → SOS marked resolved
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  Phone,
  MapPin,
  Shield,
  Volume2,
  VolumeX,
  Camera,
  Mic,
  WifiOff,
  Video,
  CheckCircle,
  Users,
  Upload,
  Clock,
  Navigation,
  Square,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSOSCapture, type SOSProgress } from "@/hooks/useSOSCapture";
import { useEmergencyContacts } from "@/hooks/useEmergencyContacts";
import { useToast } from "@/hooks/use-toast";
import { INDIA_EMERGENCY, dialNumber } from "@/lib/india-emergency";

// ── Helpers ────────────────────────────────────────────────────────────────
function formatDuration(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatCoords(loc: { latitude: number; longitude: number } | null) {
  if (!loc) return 'Getting location…';
  return `${loc.latitude.toFixed(5)}, ${loc.longitude.toFixed(5)}`;
}

// ── Status badge helper ────────────────────────────────────────────────────
function StatusBadge({ label, icon: Icon, active, pulse = false }: {
  label: string; icon: React.ElementType; active: boolean; pulse?: boolean;
}) {
  return (
    <Badge
      variant={active ? 'default' : 'secondary'}
      className={`gap-1.5 ${active && pulse ? 'animate-pulse' : ''}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

// ── Component ──────────────────────────────────────────────────────────────
export default function SOS() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { triggerSOS, stopSOS, syncOfflineQueue } = useSOSCapture();
  const { contacts: emergencyContacts } = useEmergencyContacts();

  // UI state
  const [phase, setPhase] = useState<'idle' | 'activating' | 'active' | 'stopping'>('idle');
  const [shareLocation, setShareLocation] = useState(true);
  const [silentMode, setSilentMode] = useState(false);
  const [customMessage, setCustomMessage] = useState('');
  const [progress, setProgress] = useState<SOSProgress | null>(null);

  // Sync offline queue on mount
  useEffect(() => {
    syncOfflineQueue();
  }, [syncOfflineQueue]);

  // ── Progress callback — called from the hook on every state change ────────
  const handleProgress = useCallback((p: SOSProgress) => {
    setProgress({ ...p });
    if (p.status === 'active' && phase === 'activating') setPhase('active');
    if (p.status === 'stopping') setPhase('stopping');
    if (p.status === 'idle') setPhase('idle');
    if (p.status === 'offline') setPhase('idle');
  }, [phase]);

  // ── Activate SOS immediately ───────────────────────────────────────────────
  const handleActivate = async () => {
    setPhase('activating');
    setProgress(null);

    const result = await triggerSOS({
      notes:         customMessage || undefined,
      shareLocation,
      onProgress:    handleProgress,
    });

    if (!result) {
      // offline or error — hook handles queuing
      setPhase('idle');
      toast({
        title: navigator.onLine ? 'SOS failed to start' : 'Offline — SOS queued',
        description: navigator.onLine
          ? 'Could not activate SOS. Please try again.'
          : 'Recording locally. Will notify contacts when online.',
        variant: navigator.onLine ? 'destructive' : 'default',
      });
      return;
    }

    setPhase('active');
    toast({
      title: '🚨 SOS Activated',
      description: 'Emergency contacts notified. Recording evidence.',
    });
  };

  // ── Stop SOS ──────────────────────────────────────────────────────────────
  const handleStop = async () => {
    setPhase('stopping');
    await stopSOS();
    setPhase('idle');
    setProgress(null);
    toast({
      title: 'SOS Stopped',
      description: `${progress?.segmentsUploaded ?? 0} evidence segments saved to vault.`,
    });
  };

  const isActive   = phase === 'active';
  const isActivating = phase === 'activating';
  const isStopping = phase === 'stopping';

  return (
    <div className="min-h-screen bg-emergency/5 flex flex-col">
      <div className="flex-1 container px-4 py-6 max-w-md mx-auto space-y-4">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="text-center pt-4">
          <AlertCircle className={`h-20 w-20 text-emergency mx-auto mb-3 ${isActive ? 'animate-pulse' : ''}`} />
          <h1 className="text-3xl font-heading font-bold">Emergency SOS</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isActivating && 'Activating — starting GPS, audio & video…'}
            {isActive && 'ACTIVE — recording evidence and sharing location'}
            {isStopping && 'Stopping — uploading final evidence…'}
            {phase === 'idle' && 'Help is one tap away. Stay calm and safe.'}
          </p>
        </div>

        {/* ── IDLE: Big SOS button + settings ───────────────────────────── */}
        {phase === 'idle' && (
          <>
            <Card className="border-emergency/30">
              <CardContent className="pt-6 pb-6">
                <Button
                  variant="emergency"
                  size="lg"
                  className="w-full h-32 text-2xl font-bold shadow-lg"
                  onClick={handleActivate}
                >
                  <AlertCircle className="h-10 w-10 mr-3" />
                  ACTIVATE SOS
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Instantly notifies contacts, records evidence, shares live location
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {silentMode ? <VolumeX className="h-4 w-4 text-muted-foreground" /> : <Volume2 className="h-4 w-4 text-muted-foreground" />}
                    <Label>Silent Mode</Label>
                  </div>
                  <Switch checked={silentMode} onCheckedChange={setSilentMode} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <Label>Share Live Location</Label>
                  </div>
                  <Switch checked={shareLocation} onCheckedChange={setShareLocation} />
                </div>
                <div className="space-y-1.5">
                  <Label>Custom Message (optional)</Label>
                  <Textarea
                    placeholder="Add details for emergency contacts…"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* ── ACTIVATING: spinner ────────────────────────────────────────── */}
        {isActivating && (
          <Card className="border-emergency/50 bg-emergency/5">
            <CardContent className="py-10 flex flex-col items-center gap-4">
              <Loader2 className="h-16 w-16 text-emergency animate-spin" />
              <div className="text-center space-y-1">
                <p className="font-bold text-lg text-emergency">Activating Emergency SOS</p>
                <p className="text-sm text-muted-foreground">Starting GPS, audio & video simultaneously…</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="outline" className="gap-1 animate-pulse"><Mic className="h-3 w-3" />Audio</Badge>
                <Badge variant="outline" className="gap-1 animate-pulse"><Video className="h-3 w-3" />Video</Badge>
                <Badge variant="outline" className="gap-1 animate-pulse"><Navigation className="h-3 w-3" />GPS</Badge>
                <Badge variant="outline" className="gap-1 animate-pulse"><Users className="h-3 w-3" />Contacts</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── ACTIVE: Real-time dashboard ───────────────────────────────── */}
        {(isActive || isStopping) && progress && (
          <>
            {/* Main status card */}
            <Card className="border-emergency/60 bg-emergency/5">
              <CardContent className="pt-5 space-y-4">
                {/* Duration + live indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-emergency animate-pulse inline-block" />
                    <span className="font-bold text-emergency text-lg">SOS ACTIVE</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="font-mono text-lg font-bold">
                      {formatDuration(progress.recordingSeconds)}
                    </span>
                  </div>
                </div>

                {/* Status badges */}
                <div className="flex flex-wrap gap-2">
                  <StatusBadge label="Audio" icon={Mic}   active={progress.isRecordingAudio} pulse />
                  <StatusBadge label="Video" icon={Video} active={progress.isRecordingVideo} pulse />
                  <StatusBadge
                    label={progress.isOffline ? 'Offline' : 'Online'}
                    icon={progress.isOffline ? WifiOff : CheckCircle}
                    active={!progress.isOffline}
                  />
                </div>

                {/* Metrics grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-lg bg-background/60">
                    <Users className="h-4 w-4 mx-auto mb-1 text-primary" />
                    <p className="text-xl font-bold">{progress.contactsNotified}</p>
                    <p className="text-xs text-muted-foreground">Notified</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background/60">
                    <Upload className="h-4 w-4 mx-auto mb-1 text-accent" />
                    <p className="text-xl font-bold">{progress.segmentsUploaded}</p>
                    <p className="text-xs text-muted-foreground">Uploaded</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-background/60">
                    <Camera className="h-4 w-4 mx-auto mb-1 text-secondary" />
                    <p className="text-xl font-bold">{Math.ceil(progress.recordingSeconds / 30)}</p>
                    <p className="text-xs text-muted-foreground">Segments</p>
                  </div>
                </div>

                {/* Live location */}
                {progress.location && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/20">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">Live Location</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {formatCoords(progress.location)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 shrink-0"
                      onClick={() => progress.location && window.open(
                        `https://maps.google.com/?q=${progress.location.latitude},${progress.location.longitude}`,
                        '_blank'
                      )}
                    >
                      <Navigation className="h-3 w-3" />
                    </Button>
                  </div>
                )}

                {/* Upload progress bar */}
                {progress.recordingSeconds > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Next upload in</span>
                      <span>{30 - (progress.recordingSeconds % 30)}s</span>
                    </div>
                    <Progress value={((progress.recordingSeconds % 30) / 30) * 100} className="h-1.5" />
                  </div>
                )}

                {/* SOS ID */}
                {progress.sosId && (
                  <p className="text-xs text-muted-foreground text-center">
                    SOS ID: <span className="font-mono">{progress.sosId.slice(0, 8)}…</span>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Stop button */}
            <Button
              variant="outline"
              size="lg"
              className="w-full border-emergency/40 text-emergency hover:bg-emergency/5"
              onClick={handleStop}
              disabled={isStopping}
            >
              {isStopping ? (
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" />Uploading final evidence…</>
              ) : (
                <><Square className="h-5 w-5 mr-2" />Stop SOS & Save Evidence</>
              )}
            </Button>
          </>
        )}

        {/* ── Emergency Contacts list ───────────────────────────────────── */}
        <Card>
          <CardContent className="pt-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Emergency Contacts
            </h3>
            {emergencyContacts.length === 0 ? (
              <div className="text-sm text-muted-foreground space-y-2">
                <p>No emergency contacts added yet.</p>
                <Button size="sm" variant="outline" onClick={() => navigate('/profile')}>
                  Add contacts in Profile
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {emergencyContacts.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg border">
                    <div>
                      <p className="font-medium text-sm">
                        {c.contact_name}
                        {c.is_primary && <span className="ml-1.5 text-xs text-primary">(Primary)</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{c.contact_phone}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => dialNumber(c.contact_phone)}>
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── India emergency numbers ───────────────────────────────────── */}
        <div className="grid gap-2 pb-6">
          <Button variant="outline" size="lg" className="justify-start gap-3" onClick={() => dialNumber(INDIA_EMERGENCY.NATIONAL)}>
            <Phone className="h-5 w-5" />
            <div className="text-left">
              <p className="font-semibold text-sm">National Emergency</p>
              <p className="text-xs text-muted-foreground">{INDIA_EMERGENCY.NATIONAL}</p>
            </div>
          </Button>
          <Button variant="outline" size="lg" className="justify-start gap-3" onClick={() => dialNumber(INDIA_EMERGENCY.POLICE)}>
            <Shield className="h-5 w-5" />
            <div className="text-left">
              <p className="font-semibold text-sm">Police</p>
              <p className="text-xs text-muted-foreground">{INDIA_EMERGENCY.POLICE}</p>
            </div>
          </Button>
          <Button variant="outline" size="lg" className="justify-start gap-3" onClick={() => navigate('/emergency')}>
            <MapPin className="h-5 w-5" />
            <div className="text-left">
              <p className="font-semibold text-sm">Safe Spaces Nearby</p>
              <p className="text-xs text-muted-foreground">Police stations, hospitals, shelters</p>
            </div>
          </Button>
        </div>

        {phase === 'idle' && (
          <Button variant="ghost" className="w-full" onClick={() => navigate(-1)}>
            Back
          </Button>
        )}
      </div>
    </div>
  );
}
