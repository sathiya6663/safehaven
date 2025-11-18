-- =====================================================
-- Phase 6: Complete Database Schema & Core APIs
-- =====================================================

-- Create user roles table for proper role management
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- Counseling Sessions Table
-- =====================================================

CREATE TABLE public.counseling_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  session_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  duration_minutes INTEGER,
  topic TEXT,
  emotional_state TEXT,
  crisis_detected BOOLEAN DEFAULT false,
  session_notes TEXT,
  coping_strategies TEXT[],
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.counseling_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sessions"
  ON public.counseling_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.counseling_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.counseling_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Guardians can view linked children sessions"
  ON public.counseling_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guardian_child_links
      WHERE guardian_id = auth.uid()
        AND child_id = counseling_sessions.user_id
        AND status = 'approved'
    )
  );

CREATE TRIGGER update_counseling_sessions_updated_at
  BEFORE UPDATE ON public.counseling_sessions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_counseling_sessions_user_id ON public.counseling_sessions(user_id);
CREATE INDEX idx_counseling_sessions_date ON public.counseling_sessions(session_date DESC);

-- =====================================================
-- Safety Alerts Table
-- =====================================================

CREATE TYPE public.alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE public.alert_status AS ENUM ('active', 'acknowledged', 'resolved', 'escalated');

CREATE TABLE public.safety_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  alert_type TEXT NOT NULL,
  severity alert_severity NOT NULL DEFAULT 'medium',
  status alert_status NOT NULL DEFAULT 'active',
  title TEXT NOT NULL,
  description TEXT,
  detected_content TEXT,
  location_data JSONB,
  metadata JSONB,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  escalated_to UUID[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.safety_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own alerts"
  ON public.safety_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
  ON public.safety_alerts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Guardians can view linked children alerts"
  ON public.safety_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guardian_child_links
      WHERE guardian_id = auth.uid()
        AND child_id = safety_alerts.user_id
        AND status = 'approved'
    )
  );

CREATE POLICY "System can insert alerts"
  ON public.safety_alerts FOR INSERT
  WITH CHECK (true);

CREATE TRIGGER update_safety_alerts_updated_at
  BEFORE UPDATE ON public.safety_alerts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_safety_alerts_user_id ON public.safety_alerts(user_id);
CREATE INDEX idx_safety_alerts_status ON public.safety_alerts(status);
CREATE INDEX idx_safety_alerts_severity ON public.safety_alerts(severity);
CREATE INDEX idx_safety_alerts_created_at ON public.safety_alerts(created_at DESC);

-- =====================================================
-- Evidence Vault Table
-- =====================================================

CREATE TYPE public.evidence_type AS ENUM ('image', 'video', 'audio', 'document', 'screenshot');

CREATE TABLE public.evidence_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_type evidence_type NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  category TEXT,
  description TEXT,
  is_encrypted BOOLEAN DEFAULT true,
  encryption_key_id TEXT,
  location_data JSONB,
  timestamp_data TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.evidence_vault ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own evidence"
  ON public.evidence_vault FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own evidence"
  ON public.evidence_vault FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own evidence"
  ON public.evidence_vault FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own evidence"
  ON public.evidence_vault FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_evidence_vault_updated_at
  BEFORE UPDATE ON public.evidence_vault
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_evidence_vault_user_id ON public.evidence_vault(user_id);
CREATE INDEX idx_evidence_vault_file_type ON public.evidence_vault(file_type);
CREATE INDEX idx_evidence_vault_created_at ON public.evidence_vault(created_at DESC);

-- =====================================================
-- Learning Progress Table
-- =====================================================

CREATE TABLE public.learning_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  module_id TEXT NOT NULL,
  module_type TEXT NOT NULL,
  module_title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  progress_percentage INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  quiz_score INTEGER,
  badges_earned TEXT[],
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (user_id, module_id)
);

ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own progress"
  ON public.learning_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON public.learning_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON public.learning_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Guardians can view linked children progress"
  ON public.learning_progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guardian_child_links
      WHERE guardian_id = auth.uid()
        AND child_id = learning_progress.user_id
        AND status = 'approved'
    )
  );

CREATE TRIGGER update_learning_progress_updated_at
  BEFORE UPDATE ON public.learning_progress
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_learning_progress_user_id ON public.learning_progress(user_id);
CREATE INDEX idx_learning_progress_status ON public.learning_progress(status);

-- =====================================================
-- Community Posts Table
-- =====================================================

CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_moderated BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'pending',
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view approved posts"
  ON public.community_posts FOR SELECT
  USING (moderation_status = 'approved');

CREATE POLICY "Users can view their own posts"
  ON public.community_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
  ON public.community_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
  ON public.community_posts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Moderators can update all posts"
  ON public.community_posts FOR UPDATE
  USING (public.has_role(auth.uid(), 'moderator') OR public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_community_posts_category ON public.community_posts(category);
CREATE INDEX idx_community_posts_created_at ON public.community_posts(created_at DESC);
CREATE INDEX idx_community_posts_moderation_status ON public.community_posts(moderation_status);

-- =====================================================
-- Community Messages Table
-- =====================================================

CREATE TABLE public.community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  is_moderated BOOLEAN DEFAULT false,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view messages for approved posts"
  ON public.community_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_posts
      WHERE id = community_messages.post_id
        AND moderation_status = 'approved'
    )
  );

CREATE POLICY "Users can view their own messages"
  ON public.community_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own messages"
  ON public.community_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own messages"
  ON public.community_messages FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON public.community_messages FOR DELETE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_community_messages_updated_at
  BEFORE UPDATE ON public.community_messages
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX idx_community_messages_post_id ON public.community_messages(post_id);
CREATE INDEX idx_community_messages_created_at ON public.community_messages(created_at DESC);

-- =====================================================
-- Location Tracking Table
-- =====================================================

CREATE TABLE public.location_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  journey_id UUID,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  altitude DECIMAL(10, 2),
  speed DECIMAL(10, 2),
  heading DECIMAL(5, 2),
  location_timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  shared_with UUID[],
  is_emergency BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.location_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own location"
  ON public.location_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own location"
  ON public.location_tracking FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shared users can view location"
  ON public.location_tracking FOR SELECT
  USING (auth.uid() = ANY(shared_with));

CREATE POLICY "Guardians can view linked children location"
  ON public.location_tracking FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM guardian_child_links
      WHERE guardian_id = auth.uid()
        AND child_id = location_tracking.user_id
        AND status = 'approved'
    )
  );

CREATE INDEX idx_location_tracking_user_id ON public.location_tracking(user_id);
CREATE INDEX idx_location_tracking_journey_id ON public.location_tracking(journey_id);
CREATE INDEX idx_location_tracking_timestamp ON public.location_tracking(location_timestamp DESC);

-- =====================================================
-- Storage Buckets
-- =====================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('evidence-files', 'evidence-files', false, 104857600, ARRAY['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime', 'audio/mpeg', 'audio/wav', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for evidence files
CREATE POLICY "Users can view their own evidence files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'evidence-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can upload their own evidence files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'evidence-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own evidence files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'evidence-files' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- Enable Realtime for Critical Tables
-- =====================================================

-- Note: Realtime publication is automatically enabled for all tables with RLS
-- Individual subscriptions will be set up in the application code

-- =====================================================
-- Database Functions for Complex Operations
-- =====================================================

-- Function to update community post reply count
CREATE OR REPLACE FUNCTION public.update_post_reply_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE community_posts
    SET replies_count = replies_count + 1
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE community_posts
    SET replies_count = GREATEST(0, replies_count - 1)
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER update_post_reply_count_trigger
  AFTER INSERT OR DELETE ON public.community_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_post_reply_count();

-- Function to check and escalate critical safety alerts
CREATE OR REPLACE FUNCTION public.escalate_critical_alerts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.severity = 'critical' AND NEW.status = 'active' THEN
    -- Get guardian IDs for the user
    NEW.escalated_to := ARRAY(
      SELECT guardian_id 
      FROM guardian_child_links 
      WHERE child_id = NEW.user_id AND status = 'approved'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER escalate_critical_alerts_trigger
  BEFORE INSERT OR UPDATE ON public.safety_alerts
  FOR EACH ROW EXECUTE FUNCTION public.escalate_critical_alerts();

-- =====================================================
-- Audit Logging Function
-- =====================================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);