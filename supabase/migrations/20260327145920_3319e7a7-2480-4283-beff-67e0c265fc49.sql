-- Rename user_type enum values: woman -> adult, child -> minor
ALTER TYPE public.user_type RENAME VALUE 'woman' TO 'adult';
ALTER TYPE public.user_type RENAME VALUE 'child' TO 'minor';

-- Update existing profile data
UPDATE public.profiles SET user_type = 'adult' WHERE user_type = 'adult';
UPDATE public.profiles SET user_type = 'minor' WHERE user_type = 'minor';