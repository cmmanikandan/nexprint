-- ============================================================
-- NEXPRINT - QUICK FIX SQL
-- Run this in your Supabase SQL Editor to fix Google signup
-- ============================================================

-- Step 1: Fix the phone UNIQUE constraint (blocks Google users who have no phone)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_phone_key;

-- Step 2: Add all missing columns safely
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='reg_no') THEN
        ALTER TABLE public.profiles ADD COLUMN reg_no TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='department') THEN
        ALTER TABLE public.profiles ADD COLUMN department TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='year') THEN
        ALTER TABLE public.profiles ADD COLUMN year TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='balance') THEN
        ALTER TABLE public.profiles ADD COLUMN balance DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- Step 3: Make full_name nullable (Google OAuth sometimes delays name)
ALTER TABLE public.profiles ALTER COLUMN full_name DROP NOT NULL;

-- Step 4: Drop and recreate the trigger function with full Google support
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    phone,
    reg_no,
    department,
    year,
    avatar_url,
    role,
    balance
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'reg_no',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'year',
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')::user_role,
    0.00
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    full_name  = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    phone      = COALESCE(public.profiles.phone, EXCLUDED.phone),
    reg_no     = COALESCE(public.profiles.reg_no, EXCLUDED.reg_no),
    department = COALESCE(public.profiles.department, EXCLUDED.department),
    year       = COALESCE(public.profiles.year, EXCLUDED.year);
  RETURN NEW;
END;
$$;

-- Step 5: Re-attach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 6: Also allow profiles RLS so users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Done!
SELECT 'Fix applied successfully! Google signup should now work.' AS status;
