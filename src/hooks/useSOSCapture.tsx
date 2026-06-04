import { useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Captures short audio clip + photo on SOS, uploads to evidence-files bucket,
 * inserts evidence_vault rows and an sos_logs entry.
 * Notifies all emergency contacts with location + message via safety_alerts.
 * Falls back to offline_pending status if the network is down (queues for sync).
 */
export function useSOSCapture() {
  const { user } = useAuth();
  const triggeringRef = useRef(false);

  const captureAudio = async (durationMs = 8000): Promise<Blob | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      recorder.start();
      await new Promise((r) => setTimeout(r, durationMs));
      return await new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          resolve(new Blob(chunks, { type: 'audio/webm' }));
        };
        recorder.stop();
      });
    } catch (e) {
      console.error('Audio capture failed', e);
      return null;
    }
  };

  const capturePhoto = async (): Promise<Blob | null> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = document.createElement('video');
      video.srcObject = stream;
      await video.play();
      await new Promise((r) => setTimeout(r, 600));
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      stream.getTracks().forEach((t) => t.stop());
      return await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85)
      );
    } catch (e) {
      console.error('Photo capture failed', e);
      return null;
    }
  };

  const uploadEvidence = async (blob: Blob, kind: 'audio' | 'image'): Promise<string | null> => {
    if (!user) return null;
    const ext = kind === 'audio' ? 'webm' : 'jpg';
    const path = `${user.id}/sos/${Date.now()}-${kind}.${ext}`;
    const { error: upErr } = await supabase.storage.from('evidence-files').upload(path, blob, {
      contentType: blob.type,
      upsert: false,
    });
    if (upErr) {
      console.error('Upload error', upErr);
      return null;
    }
    const { data, error } = await supabase
      .from('evidence_vault')
      .insert({
        user_id: user.id,
        file_name: path.split('/').pop() || `sos-${kind}`,
        file_path: path,
        file_size: blob.size,
        file_type: kind === 'audio' ? 'audio' : 'image',
        category: 'sos_auto_capture',
        description: 'Captured automatically during SOS event',
        timestamp_data: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (error) {
      console.error('Evidence insert error', error);
      return null;
    }
    return data.id;
  };

  /**
   * Notify all emergency contacts:
   * - Creates a safety_alert record per contact in Supabase
   * - Opens an SMS to the primary contact with location + evidence ID
   */
  const notifyContacts = async (opts: {
    location?: { latitude: number; longitude: number } | null;
    notes?: string;
    sosId: string;
  }) => {
    if (!user) return;

    const { data: contacts } = await supabase
      .from('emergency_contacts')
      .select('id, contact_name, contact_phone')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false });

    if (!contacts || contacts.length === 0) return;

    const locationText = opts.location
      ? `📍 Location: https://maps.google.com/?q=${opts.location.latitude},${opts.location.longitude}`
      : '📍 Location: not available';

    const message = [
      '🚨 EMERGENCY SOS from SafeHaven',
      opts.notes ? `Message: ${opts.notes}` : '',
      locationText,
      `Evidence ID: ${opts.sosId}`,
      'Please check on them immediately.',
    ]
      .filter(Boolean)
      .join('\n');

    // Store alert record for every contact
    const alertInserts = contacts.map((c) => ({
      user_id: user.id,
      alert_type: 'sos',
      severity: 'critical',
      title: 'Emergency SOS Activated',
      description: message,
      status: 'active',
      metadata: {
        contact_id: c.id,
        contact_name: c.contact_name,
        contact_phone: c.contact_phone,
        sos_id: opts.sosId,
        location: opts.location ?? null,
      } as any,
    }));
    await supabase.from('safety_alerts').insert(alertInserts);

    // Open SMS to primary contact with pre-filled message
    const primary = contacts[0];
    if (primary?.contact_phone) {
      try {
        const link = document.createElement('a');
        link.href = `sms:${primary.contact_phone}?body=${encodeURIComponent(message)}`;
        link.click();
      } catch {
        // SMS not supported on this platform — silent fail
      }
    }
  };

  const queueOffline = (payload: any) => {
    try {
      const key = 'safeguard_pending_sos';
      const queue = JSON.parse(localStorage.getItem(key) || '[]');
      queue.push({ ...payload, queuedAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(queue));
    } catch (e) {
      console.error('Offline queue failed', e);
    }
  };

  const triggerSOS = useCallback(
    async (opts: { location?: { latitude: number; longitude: number } | null; notes?: string }) => {
      if (!user || triggeringRef.current) return null;
      triggeringRef.current = true;

      const online = navigator.onLine;
      if (!online) {
        queueOffline({
          user_id: user.id,
          location_data: opts.location || null,
          notes: opts.notes || null,
        });
        triggeringRef.current = false;
        return { offline: true };
      }

      // Capture evidence in parallel — failures are non-fatal
      const [audioBlob, photoBlob] = await Promise.all([captureAudio(), capturePhoto()]);

      const [audioId, photoId] = await Promise.all([
        audioBlob ? uploadEvidence(audioBlob, 'audio') : Promise.resolve(null),
        photoBlob ? uploadEvidence(photoBlob, 'image') : Promise.resolve(null),
      ]);

      const { data, error } = await supabase
        .from('sos_logs')
        .insert({
          user_id: user.id,
          location_data: opts.location || null,
          audio_evidence_id: audioId,
          photo_evidence_id: photoId,
          notes: opts.notes || null,
          status: 'active',
        })
        .select('id')
        .single();

      triggeringRef.current = false;

      if (error) {
        console.error('SOS log insert failed', error);
        return null;
      }

      // Notify emergency contacts with location + message + evidence ID
      await notifyContacts({
        location: opts.location ?? null,
        notes: opts.notes,
        sosId: data.id,
      });

      return { offline: false, sosId: data.id, audioId, photoId };
    },
    [user]
  );

  // Best-effort sync of queued offline SOS events
  const syncOfflineQueue = useCallback(async () => {
    if (!user || !navigator.onLine) return;
    const key = 'safeguard_pending_sos';
    const queue: any[] = JSON.parse(localStorage.getItem(key) || '[]');
    if (queue.length === 0) return;
    for (const item of queue) {
      await supabase.from('sos_logs').insert({
        user_id: user.id,
        location_data: item.location_data,
        notes: item.notes,
        was_offline: true,
        status: 'offline_pending',
      });
    }
    localStorage.removeItem(key);
  }, [user]);

  return { triggerSOS, syncOfflineQueue };
}
