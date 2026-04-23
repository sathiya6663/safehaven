
-- Risk scores: per-user computed safety score history
CREATE TABLE public.risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  level TEXT NOT NULL CHECK (level IN ('safe','caution','danger')),
  factors JSONB,
  location_data JSONB,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_risk_scores_user_time ON public.risk_scores(user_id, computed_at DESC);
ALTER TABLE public.risk_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own risk scores" ON public.risk_scores
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own risk scores" ON public.risk_scores
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Guardians view linked risk scores" ON public.risk_scores
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM guardian_child_links
            WHERE guardian_id = auth.uid() AND child_id = risk_scores.user_id AND status = 'approved')
  );
CREATE POLICY "Deny anon risk scores" ON public.risk_scores AS RESTRICTIVE FOR ALL TO anon USING (false);

-- SOS logs: triggered SOS events with captured media references
CREATE TABLE public.sos_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  location_data JSONB,
  audio_evidence_id UUID,
  photo_evidence_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','resolved','cancelled','offline_pending')),
  was_offline BOOLEAN NOT NULL DEFAULT false,
  contacts_notified TEXT[],
  notes TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_sos_logs_user_time ON public.sos_logs(user_id, triggered_at DESC);
ALTER TABLE public.sos_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own sos logs" ON public.sos_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sos logs" ON public.sos_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sos logs" ON public.sos_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Guardians view linked sos logs" ON public.sos_logs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM guardian_child_links
            WHERE guardian_id = auth.uid() AND child_id = sos_logs.user_id AND status = 'approved')
  );
CREATE POLICY "Deny anon sos logs" ON public.sos_logs AS RESTRICTIVE FOR ALL TO anon USING (false);

CREATE TRIGGER sos_logs_updated_at BEFORE UPDATE ON public.sos_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Voice emotion logs from counseling/SOS voice input
CREATE TABLE public.voice_emotion_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_id UUID,
  transcript TEXT,
  emotion TEXT,
  stress_level INTEGER CHECK (stress_level BETWEEN 0 AND 100),
  panic_detected BOOLEAN NOT NULL DEFAULT false,
  audio_metrics JSONB,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_voice_emotion_user_time ON public.voice_emotion_logs(user_id, recorded_at DESC);
ALTER TABLE public.voice_emotion_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own voice logs" ON public.voice_emotion_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own voice logs" ON public.voice_emotion_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Deny anon voice logs" ON public.voice_emotion_logs AS RESTRICTIVE FOR ALL TO anon USING (false);

-- Fix lingering security finding: tighten user_feedback SELECT
DROP POLICY IF EXISTS "Users can view own feedback" ON public.user_feedback;
CREATE POLICY "Users can view own feedback" ON public.user_feedback
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
