-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create user_feedback table for collecting UAT feedback
CREATE TABLE public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('bug', 'feature', 'general', 'rating')),
  message TEXT,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  page_url TEXT,
  user_agent TEXT,
  screen_size TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'wont_fix')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics_events table for tracking user behavior
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_type TEXT,
  event_name TEXT NOT NULL,
  event_data JSONB,
  page_url TEXT,
  session_id TEXT,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on both tables
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_feedback
CREATE POLICY "Users can create feedback" ON public.user_feedback FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own feedback" ON public.user_feedback FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admins can view all feedback" ON public.user_feedback FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'moderator')));
CREATE POLICY "Admins can update feedback" ON public.user_feedback FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'moderator')));

-- RLS policies for analytics_events
CREATE POLICY "Anyone can create analytics events" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own events" ON public.analytics_events FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Admins can view all analytics" ON public.analytics_events FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role IN ('admin', 'moderator')));

-- Create indexes
CREATE INDEX idx_user_feedback_type ON public.user_feedback(feedback_type);
CREATE INDEX idx_user_feedback_status ON public.user_feedback(status);
CREATE INDEX idx_user_feedback_created ON public.user_feedback(created_at DESC);
CREATE INDEX idx_analytics_events_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_session ON public.analytics_events(session_id);

-- Trigger for updated_at on user_feedback
CREATE TRIGGER update_user_feedback_updated_at
BEFORE UPDATE ON public.user_feedback
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();