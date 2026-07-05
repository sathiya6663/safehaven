/**
 * useSOSCapture — Real-Time Emergency Response System
 *
 * Architecture:
 *  - All capture (audio, video, GPS) starts in PARALLEL within 1 second
 *  - Recording is done in rolling 30-second segments → each uploaded immediately
 *  - Live GPS broadcast to DB every 8 seconds during active SOS
 *  - Emergency contacts notified with full profile info instantly
 *  - Offline support: queue to localStorage → auto-sync on reconnect
 */
import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────
export type SOSLocation = { latitude: number; longitude: number; accuracy?: number };

export type SOSStatus =
  | 'idle'
  | 'activating'   // < 1 second — getting GPS + starting recorders
  | 'active'       // SOS live — recording, tracking, contacts notified
  | 'uploading'    // Segment upload in progress
  | 'stopping'     // User cancelled — final upload
  | 'offline';     // No internet — queued locally

export type SOSProgress = {
  status:              SOSStatus;
  sosId:               string | null;
  activatedAt:         Date | null;
  location:            SOSLocation | null;
  locationUpdatedAt:   Date | null;
  contactsNotified:    number;
  segmentsUploaded:    number;
  recordingSeconds:    number;
  isRecordingAudio:    boolean;
  isRecordingVideo:    boolean;
  isOffline:           boolean;
};

type SOSOptions = {
  notes?:              string;
  shareLocation?:      boolean;
  onProgress?:         (p: SOSProgress) => void;
};

// ── Segment length: 30s → upload, start fresh ─────────────────────────────
const SEGMENT_MS = 30_000;
const LOC_INTERVAL_MS = 8_000;   // broadcast location every 8 s

// ── Offline queue ──────────────────────────────────────────────────────────
const OFFLINE_KEY = 'safehaven_sos_queue';

function queueOffline(payload: object) {
  try {
    const q = JSON.parse(localStorage.getItem(OFFLINE_KEY) ?? '[]');
    q.push({ ...payload, queuedAt: new Date().toISOString() });
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(q));
  } catch { /* ignore */ }
}

// ── Main hook ──────────────────────────────────────────────────────────────
export function useSOSCapture() {
  const { user } = useAuth();

  // Internal refs — never trigger re-renders
  const activeRef         = useRef(false);
  const sosIdRef          = useRef<string | null>(null);
  const audioRecRef       = useRef<MediaRecorder | null>(null);
  const videoRecRef       = useRef<MediaRecorder | null>(null);
  const audioStreamRef    = useRef<MediaStream | null>(null);
  const videoStreamRef    = useRef<MediaStream | null>(null);
  const audioChunksRef    = useRef<BlobPart[]>([]);
  const videoChunksRef    = useRef<BlobPart[]>([]);
  const segmentTimerRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationRef       = useRef<SOSLocation | null>(null);
  const segmentCountRef   = useRef(0);
  const contactCountRef   = useRef(0);
  const recordingSecsRef  = useRef(0);
  const secsTimerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressCbRef     = useRef<((p: SOSProgress) => void) | null>(null);

  // ── Helper: emit progress without re-render ──────────────────────────────
  const emit = (partial: Partial<SOSProgress>) => {
    if (!progressCbRef.current) return;
    progressCbRef.current({
      status:            'active',
      sosId:             sosIdRef.current,
      activatedAt:       null,
      location:          locationRef.current,
      locationUpdatedAt: null,
      contactsNotified:  contactCountRef.current,
      segmentsUploaded:  segmentCountRef.current,
      recordingSeconds:  recordingSecsRef.current,
      isRecordingAudio:  !!audioRecRef.current,
      isRecordingVideo:  !!videoRecRef.current,
      isOffline:         !navigator.onLine,
      ...partial,
    });
  };

  // ── Upload a blob segment to Storage + evidence_vault ────────────────────
  const uploadSegment = async (
    blob: Blob,
    kind: 'audio' | 'video' | 'image',
    segIndex: number,
  ): Promise<string | null> => {
    if (!user) return null;
    const ext  = kind === 'audio' ? 'webm' : kind === 'video' ? 'webm' : 'jpg';
    const mime = blob.type || (kind === 'audio' ? 'audio/webm' : kind === 'video' ? 'video/webm' : 'image/jpeg');
    const path = `${user.id}/sos/${sosIdRef.current ?? Date.now()}-${kind}-${segIndex}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('evidence-files')
      .upload(path, blob, { contentType: mime, upsert: false });

    if (upErr) { console.error('[SOS] upload error', upErr); return null; }

    const { data, error } = await supabase
      .from('evidence_vault')
      .insert({
        user_id:        user.id,
        file_name:      path.split('/').pop()!,
        file_path:      path,
        file_size:      blob.size,
        file_type:      kind === 'audio' ? 'audio' : kind === 'video' ? 'video' : 'image',
        category:       'sos_auto_capture',
        description:    `SOS ${kind} segment ${segIndex} — ${new Date().toLocaleString()}`,
        timestamp_data: new Date().toISOString(),
        location_data:  locationRef.current as any,
      })
      .select('id')
      .single();

    if (error) { console.error('[SOS] evidence insert error', error); return null; }

    segmentCountRef.current++;
    emit({ segmentsUploaded: segmentCountRef.current, status: 'active' });

    // Update sos_log with latest evidence reference
    if (sosIdRef.current && kind === 'audio') {
      await supabase
        .from('sos_logs')
        .update({ audio_evidence_id: data.id })
        .eq('id', sosIdRef.current);
    }
    if (sosIdRef.current && kind === 'video') {
      await supabase
        .from('sos_logs')
        .update({ photo_evidence_id: data.id })  // reusing photo_evidence_id for video
        .eq('id', sosIdRef.current);
    }

    // Notify contacts about new evidence segment
    notifyEvidenceUpdate(data.id, kind, segIndex);

    return data.id;
  };

  // ── Flush current recorder chunks → upload → restart ─────────────────────
  const flushAudioSegment = async () => {
    if (!audioRecRef.current || audioChunksRef.current.length === 0) return;
    const chunks = [...audioChunksRef.current];
    audioChunksRef.current = [];
    const blob = new Blob(chunks, { type: 'audio/webm' });
    if (blob.size > 100) await uploadSegment(blob, 'audio', segmentCountRef.current);
  };

  const flushVideoSegment = async () => {
    if (!videoRecRef.current || videoChunksRef.current.length === 0) return;
    const chunks = [...videoChunksRef.current];
    videoChunksRef.current = [];
    const blob = new Blob(chunks, { type: 'video/webm' });
    if (blob.size > 100) await uploadSegment(blob, 'video', segmentCountRef.current);
  };

  // ── Notify contacts about a new evidence segment ──────────────────────────
  const notifyEvidenceUpdate = async (evidenceId: string, kind: string, seg: number) => {
    if (!user || !sosIdRef.current) return;
    const msg = `📎 New ${kind} evidence segment ${seg + 1} uploaded.\nEvidence ID: ${evidenceId}\n` +
      (locationRef.current
        ? `📍 Current location: https://maps.google.com/?q=${locationRef.current.latitude},${locationRef.current.longitude}`
        : '');

    const { data: contacts } = await supabase
      .from('emergency_contacts')
      .select('id, contact_name, contact_phone')
      .eq('user_id', user.id);

    if (!contacts?.length) return;

    await supabase.from('safety_alerts').insert(
      contacts.map((c) => ({
        user_id:    user.id,
        alert_type: 'sos_evidence' as const,
        severity:   'high' as const,
        title:      `SOS Evidence Update — ${kind} segment ${seg + 1}`,
        description: msg,
        status:     'active' as const,
        metadata:   {
          contact_id:   c.id,
          contact_name: c.contact_name,
          contact_phone: c.contact_phone,
          sos_id:       sosIdRef.current,
          evidence_id:  evidenceId,
          kind,
          segment:      seg,
          location:     locationRef.current,
        } as any,
      }))
    );
  };

  // ── Start rolling recorder (audio or video) ───────────────────────────────
  const startAudioRecorder = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      rec.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      rec.start(1000); // collect chunks every 1 second
      audioRecRef.current = rec;
      return true;
    } catch (e) {
      console.warn('[SOS] audio recorder failed', e);
      return false;
    }
  };

  const startVideoRecorder = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false, // audio already captured separately
      });
      videoStreamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
      const rec = new MediaRecorder(stream, { mimeType });
      rec.ondataavailable = (e) => { if (e.data.size > 0) videoChunksRef.current.push(e.data); };
      rec.start(1000);
      videoRecRef.current = rec;
      return true;
    } catch (e) {
      console.warn('[SOS] video recorder failed', e);
      return false;
    }
  };

  // ── Get GPS quickly ───────────────────────────────────────────────────────
  const getGPS = (): Promise<SOSLocation | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      const timeout = setTimeout(() => resolve(null), 5000);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timeout);
          resolve({
            latitude:  pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy:  pos.coords.accuracy,
          });
        },
        () => { clearTimeout(timeout); resolve(null); },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });

  // ── Broadcast live location every 8 seconds ───────────────────────────────
  const broadcastLocation = async (loc: SOSLocation) => {
    if (!user || !sosIdRef.current) return;
    locationRef.current = loc;

    // Save to location_tracking
    await supabase.from('location_tracking').insert({
      user_id:            user.id,
      latitude:           loc.latitude,
      longitude:          loc.longitude,
      accuracy:           loc.accuracy ?? null,
      location_timestamp: new Date().toISOString(),
      is_emergency:       true,
    });

    // Update sos_log with latest location
    await supabase.from('sos_logs').update({
      location_data: loc as any,
    }).eq('id', sosIdRef.current);

    emit({ location: loc, locationUpdatedAt: new Date(), status: 'active' });
  };

  // ── Send initial emergency notifications ─────────────────────────────────
  const sendInitialAlerts = async (
    loc: SOSLocation | null,
    userName: string,
    notes: string | undefined,
  ) => {
    if (!user) return;

    const { data: contacts } = await supabase
      .from('emergency_contacts')
      .select('id, contact_name, contact_phone')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false });

    if (!contacts?.length) return;

    const now = new Date();
    const locationText = loc
      ? `📍 Live location: https://maps.google.com/?q=${loc.latitude},${loc.longitude}`
      : '📍 Location: not available';

    const message = [
      `🚨 EMERGENCY SOS ALERT`,
      `👤 User: ${userName}`,
      `🕐 Time: ${now.toLocaleString()}`,
      notes ? `💬 Message: ${notes}` : '',
      locationText,
      `⚠️ Status: EMERGENCY ACTIVE`,
      `📹 Audio & video evidence is being recorded and will be shared shortly.`,
      `Please check on them immediately and call emergency services if needed.`,
    ].filter(Boolean).join('\n');

    // Insert safety_alert per contact
    await supabase.from('safety_alerts').insert(
      contacts.map((c) => ({
        user_id:     user.id,
        alert_type:  'sos' as const,
        severity:    'critical' as const,
        title:       `🚨 Emergency SOS — ${userName}`,
        description: message,
        status:      'active' as const,
        metadata:    {
          contact_id:    c.id,
          contact_name:  c.contact_name,
          contact_phone: c.contact_phone,
          sos_id:        sosIdRef.current,
          location:      loc,
          activated_at:  now.toISOString(),
        } as any,
      }))
    );

    contactCountRef.current = contacts.length;
    emit({ contactsNotified: contactCountRef.current });

    // Open SMS to primary contact immediately
    const primary = contacts[0];
    if (primary?.contact_phone) {
      try {
        const a = document.createElement('a');
        a.href = `sms:${primary.contact_phone}?body=${encodeURIComponent(message)}`;
        a.click();
      } catch { /* SMS not available */ }
    }
  };

  // ── Capture a quick photo for immediate notification ──────────────────────
  const captureQuickPhoto = async (): Promise<void> => {
    if (!user || !sosIdRef.current) return;
    // Use existing video stream if available
    const stream = videoStreamRef.current ?? await navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'environment' } })
      .catch(() => null);
    if (!stream) return;

    const video = document.createElement('video');
    video.srcObject = stream;
    await video.play().catch(() => null);
    await new Promise((r) => setTimeout(r, 400));

    const canvas = document.createElement('canvas');
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext('2d')?.drawImage(video, 0, 0);

    if (!videoStreamRef.current) stream.getTracks().forEach((t) => t.stop());

    canvas.toBlob(async (blob) => {
      if (blob && blob.size > 100) await uploadSegment(blob, 'image', 0);
    }, 'image/jpeg', 0.85);
  };

  // ── STOP SOS ──────────────────────────────────────────────────────────────
  const stopSOS = useCallback(async () => {
    if (!activeRef.current) return;
    activeRef.current = false;
    emit({ status: 'stopping' });

    // Clear all timers
    if (segmentTimerRef.current) clearInterval(segmentTimerRef.current);
    if (locationTimerRef.current) clearInterval(locationTimerRef.current);
    if (secsTimerRef.current) clearInterval(secsTimerRef.current);

    // Stop recorders and flush final segments
    if (audioRecRef.current?.state !== 'inactive') {
      audioRecRef.current?.stop();
      await new Promise((r) => setTimeout(r, 500));
    }
    if (videoRecRef.current?.state !== 'inactive') {
      videoRecRef.current?.stop();
      await new Promise((r) => setTimeout(r, 500));
    }

    await Promise.all([flushAudioSegment(), flushVideoSegment()]);

    // Stop media streams
    audioStreamRef.current?.getTracks().forEach((t) => t.stop());
    videoStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioStreamRef.current = null;
    videoStreamRef.current = null;
    audioRecRef.current    = null;
    videoRecRef.current    = null;

    // Mark SOS log as resolved
    if (sosIdRef.current) {
      await supabase.from('sos_logs').update({
        status:      'resolved',
        resolved_at: new Date().toISOString(),
      }).eq('id', sosIdRef.current);
    }

    emit({ status: 'idle' });
  }, []);

  // ── TRIGGER SOS ───────────────────────────────────────────────────────────
  const triggerSOS = useCallback(async (opts: SOSOptions = {}): Promise<{
    sosId: string; offline: boolean;
  } | null> => {
    if (!user || activeRef.current) return null;
    activeRef.current = true;
    progressCbRef.current = opts.onProgress ?? null;

    emit({ status: 'activating' });

    const online = navigator.onLine;
    const shareLocation = opts.shareLocation !== false;

    // ── Step 1: ALL parallel — GPS + recorders start simultaneously ──────────
    const [loc, audioStarted, videoStarted] = await Promise.all([
      shareLocation ? getGPS() : Promise.resolve(null),
      startAudioRecorder(),
      startVideoRecorder(),
    ]);

    if (loc) locationRef.current = loc;
    emit({ status: 'activating', isRecordingAudio: audioStarted, isRecordingVideo: videoStarted });

    if (!online) {
      queueOffline({
        user_id:   user.id,
        location:  loc,
        notes:     opts.notes,
        timestamp: new Date().toISOString(),
      });
      activeRef.current = false;
      emit({ status: 'offline', isOffline: true });
      return null;
    }

    // ── Step 2: Create SOS log immediately ───────────────────────────────────
    const { data: sosData, error: sosErr } = await supabase
      .from('sos_logs')
      .insert({
        user_id:       user.id,
        location_data: loc as any,
        notes:         opts.notes ?? null,
        status:        'active',
      })
      .select('id')
      .single();

    if (sosErr || !sosData) {
      console.error('[SOS] log insert failed', sosErr);
      activeRef.current = false;
      return null;
    }
    sosIdRef.current = sosData.id;

    // ── Step 3: Fetch user name for notifications ────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('user_id', user.id)
      .maybeSingle();
    const userName = profile?.full_name || profile?.email || 'SafeHaven User';

    // ── Step 4: Notify contacts + capture quick photo (parallel) ────────────
    await Promise.all([
      sendInitialAlerts(loc, userName, opts.notes),
      captureQuickPhoto(),
    ]);

    emit({ status: 'active', activatedAt: new Date() });

    // ── Step 5: Rolling segment upload every 30 seconds ─────────────────────
    segmentTimerRef.current = setInterval(async () => {
      await Promise.all([flushAudioSegment(), flushVideoSegment()]);
    }, SEGMENT_MS);

    // ── Step 6: Live location broadcast every 8 seconds ─────────────────────
    if (shareLocation) {
      locationTimerRef.current = setInterval(async () => {
        const newLoc = await getGPS();
        if (newLoc) await broadcastLocation(newLoc);
      }, LOC_INTERVAL_MS);
    }

    // ── Step 7: Recording seconds counter ───────────────────────────────────
    secsTimerRef.current = setInterval(() => {
      recordingSecsRef.current++;
      emit({ recordingSeconds: recordingSecsRef.current, status: 'active' });
    }, 1000);

    return { sosId: sosData.id, offline: false };
  }, [user]);

  // ── SYNC OFFLINE QUEUE ────────────────────────────────────────────────────
  const syncOfflineQueue = useCallback(async () => {
    if (!user || !navigator.onLine) return;
    try {
      const queue: any[] = JSON.parse(localStorage.getItem(OFFLINE_KEY) ?? '[]');
      if (!queue.length) return;
      for (const item of queue) {
        await supabase.from('sos_logs').insert({
          user_id:       user.id,
          location_data: item.location ?? null,
          notes:         item.notes ?? null,
          was_offline:   true,
          status:        'offline_pending',
        });
      }
      localStorage.removeItem(OFFLINE_KEY);
    } catch { /* ignore */ }
  }, [user]);

  return { triggerSOS, stopSOS, syncOfflineQueue };
}
