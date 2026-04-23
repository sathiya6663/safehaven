-- Fix 1: community_posts — prevent deanonymization of anonymous posts via base table
-- Drop the overly broad public SELECT policy
DROP POLICY IF EXISTS "Everyone can view approved posts" ON public.community_posts;

-- Restrict base table SELECT to owners only (and existing moderator/admin policies)
-- Public reads should go through the community_posts_safe view which masks user_id
-- Owner SELECT policy already exists ("Users can view their own posts")

-- Add explicit deny for anon on base table
CREATE POLICY "Deny anonymous access to community posts"
  ON public.community_posts
  AS PERMISSIVE
  FOR ALL
  TO anon
  USING (false);

-- Grant SELECT on the safe view to both roles for public browsing
GRANT SELECT ON public.community_posts_safe TO authenticated, anon;

-- Fix 2: community_messages — replace ineffective false-permissive deny with restrictive policy
DROP POLICY IF EXISTS "Deny anonymous access to community messages" ON public.community_messages;
DROP POLICY IF EXISTS "Everyone can view messages for approved posts" ON public.community_messages;

-- Restrictive policy: block anon entirely
CREATE POLICY "Block anonymous access to community messages"
  ON public.community_messages
  AS RESTRICTIVE
  FOR ALL
  TO anon
  USING (false);

-- Re-create the approved-post message visibility policy, scoped to authenticated users only
CREATE POLICY "Authenticated users can view messages for approved posts"
  ON public.community_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.community_posts
      WHERE community_posts.id = community_messages.post_id
        AND community_posts.moderation_status = 'approved'
    )
  );

-- Fix 3: analytics_events — remove the OR (user_id IS NULL) leak
DROP POLICY IF EXISTS "Users can view own events" ON public.analytics_events;

CREATE POLICY "Users can view their own analytics events"
  ON public.analytics_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can already view all analytics via existing policy; events with NULL user_id
-- are now only readable by admins/moderators.