
-- Fix overly permissive INSERT policies

-- 1. safety_alerts: Remove public insert, only service role (edge functions) should insert
DROP POLICY IF EXISTS "System can insert alerts" ON safety_alerts;

-- 2. user_feedback: Require authentication
DROP POLICY IF EXISTS "Users can create feedback" ON user_feedback;
CREATE POLICY "Authenticated users can create feedback" 
ON user_feedback FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. analytics_events: Require authentication
DROP POLICY IF EXISTS "Anyone can create analytics events" ON analytics_events;
CREATE POLICY "Authenticated users can create analytics events" 
ON analytics_events FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);
