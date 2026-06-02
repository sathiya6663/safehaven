
-- 1) Prevent privilege escalation: restrict role assignment so it never happens without an existing admin
CREATE POLICY "Block self role assignment"
ON public.user_roles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Block self role update"
ON public.user_roles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2) Allow moderators/admins to view community posts and messages they need to moderate
CREATE POLICY "Moderators and admins can view all posts"
ON public.community_posts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'moderator'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Moderators and admins can view all messages"
ON public.community_messages
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'moderator'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- 3) Restrict bulk anonymize function to admins
CREATE OR REPLACE FUNCTION public.anonymize_old_counseling_sessions()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can run anonymization';
  END IF;

  UPDATE counseling_sessions
  SET 
    session_notes = '[REDACTED - RETAINED FOR STATISTICAL PURPOSES ONLY]',
    ai_summary = '[REDACTED]',
    detected_content = NULL
  WHERE created_at < NOW() - INTERVAL '2 years'
    AND session_notes IS NOT NULL;
END;
$function$;

-- 4) Avatars bucket: remove broad listing policy. Public URLs still work for direct file access,
--    but client `.list()` calls will no longer enumerate the bucket.
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

CREATE POLICY "Users can view their own avatar files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);
