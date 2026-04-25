
-- 1) user_roles: prevent self-assignment of roles. Only admins can INSERT/UPDATE/DELETE.
CREATE POLICY "Only admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Only admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) community_messages: replace broad SELECT policy with one that hides user_id when anonymous.
DROP POLICY IF EXISTS "Authenticated users can view messages for approved posts" ON public.community_messages;

-- Public-safe view that masks user_id for anonymous messages
CREATE OR REPLACE VIEW public.community_messages_public
WITH (security_invoker=on) AS
SELECT
  cm.id,
  cm.post_id,
  cm.content,
  cm.likes_count,
  cm.is_moderated,
  cm.is_anonymous,
  cm.created_at,
  cm.updated_at,
  CASE WHEN cm.is_anonymous THEN NULL ELSE cm.user_id END AS user_id
FROM public.community_messages cm
WHERE EXISTS (
  SELECT 1 FROM public.community_posts cp
  WHERE cp.id = cm.post_id AND cp.moderation_status = 'approved'
);

-- Re-add SELECT policy on base table that excludes anonymous messages from broad reads
-- (owners can still read their own anonymous messages via the existing "Users can view their own messages" policy)
CREATE POLICY "Authenticated can view non-anonymous approved messages"
  ON public.community_messages FOR SELECT
  TO authenticated
  USING (
    is_anonymous = false
    AND EXISTS (
      SELECT 1 FROM public.community_posts cp
      WHERE cp.id = community_messages.post_id
        AND cp.moderation_status = 'approved'
    )
  );

-- 3) evidence-files storage: add explicit deny-equivalent UPDATE policy scoped to owner folder
-- (consistent with other policies; updates remain effectively disallowed unless owner)
CREATE POLICY "Users can update own evidence files"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'evidence-files' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'evidence-files' AND auth.uid()::text = (storage.foldername(name))[1]);
