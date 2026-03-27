
-- Remove duplicate/old feedback INSERT policy
DROP POLICY IF EXISTS "Users can create feedback (restricted)" ON user_feedback;
