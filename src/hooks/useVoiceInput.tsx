import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

type SpeechRecognitionLike = any;

/**
 * Web Speech API wrapper with simple stress/panic heuristics from audio volume.
 * Records both the transcript (via SpeechRecognition) and an audio metric
 * (via getUserMedia + AnalyserNode RMS) to estimate stress.
 */
export function useVoiceInput(opts?: { sessionId?: string | null }) {
  const { user } = useAuth();
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [stressLevel, setStressLevel] = useState(0);
  const [panicDetected, setPanicDetected] = useState(false);
  const [supported] = useState(
    () => typeof window !== 'undefined' && !!(window as any).SpeechRecognition || !!(window as any).webkitSpeechRecognition
  );

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rmsSamplesRef = useRef<number[]>([]);

  const measureStress = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      src.connect(analyser);
      const data = new Uint8Array(analyser.fftSize);
      const tick = () => {
        if (!audioCtxRef.current) return;
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        rmsSamplesRef.current.push(rms);
        if (rmsSamplesRef.current.length > 200) rmsSamplesRef.current.shift();
        const avg = rmsSamplesRef.current.reduce((a, b) => a + b, 0) / rmsSamplesRef.current.length;
        const peak = Math.max(...rmsSamplesRef.current);
        // Simple heuristic: high avg volume + high peak → higher stress
        const score = Math.min(100, Math.round((avg * 220 + peak * 80) / 1.5));
        setStressLevel(score);
        if (score > 75) setPanicDetected(true);
        requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {
      console.error('Stress meter failed', e);
    }
  };

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.onresult = (event: any) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript((prev) => (prev + ' ' + text).trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    setTranscript('');
    setStressLevel(0);
    setPanicDetected(false);
    rmsSamplesRef.current = [];
    rec.start();
    setListening(true);
    measureStress();
  }, []);

  const stop = useCallback(async () => {
    recognitionRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    streamRef.current = null;
    setListening(false);

    // Persist
    if (user && transcript.trim()) {
      const emotion =
        stressLevel > 75 ? 'panic' : stressLevel > 55 ? 'stressed' : stressLevel > 30 ? 'anxious' : 'calm';
      await supabase.from('voice_emotion_logs').insert({
        user_id: user.id,
        session_id: opts?.sessionId || null,
        transcript,
        emotion,
        stress_level: stressLevel,
        panic_detected: panicDetected,
        audio_metrics: { samples: rmsSamplesRef.current.length } as any,
      });
    }
    return { transcript, stressLevel, panicDetected };
  }, [user, transcript, stressLevel, panicDetected, opts?.sessionId]);

  return { supported, listening, transcript, stressLevel, panicDetected, start, stop, setTranscript };
}
