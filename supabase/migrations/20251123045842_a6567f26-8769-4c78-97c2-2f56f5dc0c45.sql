-- ===================================================================
-- FIX SECURITY DEFINER VIEW WARNING
-- ===================================================================
-- Replace SECURITY DEFINER view with SECURITY INVOKER view
-- This ensures RLS policies are enforced based on the querying user
-- ===================================================================

-- Drop the existing SECURITY DEFINER view
DROP VIEW IF EXISTS community_posts_safe;

-- Recreate as SECURITY INVOKER view (default, more secure)
CREATE VIEW community_posts_safe 
WITH (security_invoker = true) AS
SELECT 
  id,
  title,
  content,
  category,
  tags,
  CASE 
    WHEN is_anonymous = true THEN NULL
    ELSE user_id
  END as user_id,
  is_anonymous,
  is_moderated,
  moderation_status,
  likes_count,
  replies_count,
  created_at,
  updated_at
FROM community_posts
WHERE moderation_status = 'approved';

-- Grant access to the view
GRANT SELECT ON community_posts_safe TO authenticated;
GRANT SELECT ON community_posts_safe TO anon;

-- ===================================================================
-- ADDITIONAL RLS POLICY FOR THE VIEW
-- ===================================================================
-- Since we're using security invoker, we need RLS on the underlying table
-- The existing policies on community_posts already handle this correctly

-- ===================================================================
-- SECURITY FIX COMPLETE
-- ===================================================================
-- ✓ View converted to SECURITY INVOKER mode
-- ✓ RLS policies properly enforced based on querying user
-- ✓ Anonymous post user_id masking maintained
-- ===================================================================