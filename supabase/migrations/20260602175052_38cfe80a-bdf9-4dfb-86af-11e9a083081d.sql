
-- 1) Revoke EXECUTE from anon/authenticated/public on internal trigger functions.
--    Triggers run as the table owner, so they continue to work; only direct API invocation is blocked.
REVOKE EXECUTE ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_sensitive_access() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_sensitive_changes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_post_reply_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.escalate_critical_alerts() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.anonymize_old_counseling_sessions() FROM PUBLIC, anon, authenticated;

-- 2) Recreate storage.objects policies for avatars and evidence-files scoped to authenticated role only.
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own avatar files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own evidence files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own evidence files" ON storage.objects;

-- Avatars
CREATE POLICY "Users can view their own avatar files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- Evidence files
CREATE POLICY "Users can view their own evidence files"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'evidence-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own evidence files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'evidence-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own evidence files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'evidence-files' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own evidence files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'evidence-files' AND (auth.uid())::text = (storage.foldername(name))[1]);
