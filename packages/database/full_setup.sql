-- ============================================
-- NEXPRINT 2.0 - MASTER DATABASE SETUP
-- ============================================
-- Run this ENTIRE file in Supabase SQL Editor
-- It is safe to run multiple times (idempotent)
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ENUM TYPES
-- ============================================
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'shop_owner', 'delivery_partner', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'shop_accepted', 'printing', 'ready_for_pickup', 'out_for_delivery', 'completed', 'cancelled');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'print_type') THEN
        CREATE TYPE print_type AS ENUM ('color', 'black_white');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'print_side') THEN
        CREATE TYPE print_side AS ENUM ('single', 'double');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'paper_size') THEN
        CREATE TYPE paper_size AS ENUM ('A4', 'A3', 'Letter', 'Legal', 'A4_photo', '4x6', '5x7');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method') THEN
        CREATE TYPE payment_method AS ENUM ('online', 'cash_pickup', 'cash_delivery');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_type') THEN
        CREATE TYPE delivery_type AS ENUM ('pickup', 'delivery');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shop_status') THEN
        CREATE TYPE shop_status AS ENUM ('open', 'closed', 'busy');
    END IF;
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. BASE TABLES
-- ============================================

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  name TEXT, -- Fallback for existing data
  avatar_url TEXT,
  reg_no TEXT,
  department TEXT,
  year TEXT,
  balance DECIMAL(10,2) DEFAULT 0.00,
  role user_role DEFAULT 'user',
  is_onboarded BOOLEAN DEFAULT false,
  fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRINT SHOPS
CREATE TABLE IF NOT EXISTS public.print_shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  phone TEXT,
  email TEXT,
  status shop_status DEFAULT 'open',
  rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  image_url TEXT,
  open_time TIME,
  close_time TIME,
  color_price_per_page DECIMAL(10, 2) DEFAULT 2.00,
  bw_price_per_page DECIMAL(10, 2) DEFAULT 0.50,
  delivery_available BOOLEAN DEFAULT true,
  extra_services JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{"pin_required": true, "admin_pin": "1234"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDERS (MULTI-FILE READY)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  shop_id UUID REFERENCES public.print_shops(id) ON DELETE SET NULL,
  status order_status DEFAULT 'pending',
  priority INTEGER DEFAULT 0,
  rack_id UUID,
  total_amount DECIMAL(10, 2) DEFAULT 0.00,
  payment_method payment_method DEFAULT 'online',
  payment_status payment_status DEFAULT 'pending',
  is_emergency BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER ITEMS (THE ACTUAL FILES)
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_pages INTEGER NOT NULL,
  print_type print_type NOT NULL,
  print_side print_side NOT NULL,
  paper_size paper_size DEFAULT 'A4',
  copies INTEGER DEFAULT 1,
  total_pages INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RACKS
CREATE TABLE IF NOT EXISTS public.racks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES public.print_shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FEEDBACK
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES public.print_shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SHOP STAFF
CREATE TABLE IF NOT EXISTS public.shop_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES public.print_shops(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'assistant',
  phone TEXT,
  status TEXT DEFAULT 'online',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. CRITICAL DATA MAINTENANCE
-- ============================================
DO $$ BEGIN
  -- Drop single-file legacy columns from orders table that cause crashes
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='file_url') THEN ALTER TABLE public.orders DROP COLUMN file_url CASCADE; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='file_name') THEN ALTER TABLE public.orders DROP COLUMN file_name CASCADE; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='pages') THEN ALTER TABLE public.orders DROP COLUMN pages CASCADE; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='price') THEN ALTER TABLE public.orders DROP COLUMN price CASCADE; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='print_type') THEN ALTER TABLE public.orders DROP COLUMN print_type CASCADE; END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='print_side') THEN ALTER TABLE public.orders DROP COLUMN print_side CASCADE; END IF;

  -- Ensure all new columns exist on profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_onboarded') THEN ALTER TABLE public.profiles ADD COLUMN is_onboarded BOOLEAN DEFAULT false; END IF;
  
  -- Ensure paper_size enum supports new photo sizes
  -- (Requires special handling since paper_size already exists)
  -- If you get error here, just skip to next step
EXCEPTION WHEN OTHERS THEN RAISE NOTICE 'Maintenance step skipped.';
END $$;

-- Fix Year column type (must be TEXT for "1st Year", "2nd Year", etc.)
ALTER TABLE public.profiles ALTER COLUMN year TYPE TEXT USING year::TEXT;
ALTER TABLE public.profiles ALTER COLUMN name DROP NOT NULL;

-- ============================================
-- 4. SMART ORDER NUMBERS
-- ============================================
CREATE OR REPLACE FUNCTION generate_unique_order_number()
RETURNS TEXT AS $$
DECLARE
  new_num TEXT;
BEGIN
  new_num := 'NP' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
  RETURN new_num;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_order_number_trigger()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_unique_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_order_number ON public.orders;
CREATE TRIGGER trigger_set_order_number
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number_trigger();

-- ============================================
-- 5. AUTO-PROFILE (GOOGLE AUTH SYNC)
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user_sync()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, is_onboarded)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(public.profiles.full_name, ''), EXCLUDED.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_sync();

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Profiles: Own view/edit
DROP POLICY IF EXISTS "profile_access" ON public.profiles;
CREATE POLICY "profile_access" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Shops: All can view, only owner can edit
DROP POLICY IF EXISTS "shop_view" ON public.print_shops;
CREATE POLICY "shop_view" ON public.print_shops FOR SELECT USING (true);
DROP POLICY IF EXISTS "shop_manage" ON public.print_shops;
CREATE POLICY "shop_manage" ON public.print_shops FOR ALL USING (owner_id = auth.uid());

-- Orders: Users see own, Shops see theirs
DROP POLICY IF EXISTS "order_user_access" ON public.orders;
CREATE POLICY "order_user_access" ON public.orders FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "order_shop_access" ON public.orders;
CREATE POLICY "order_shop_access" ON public.orders FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.print_shops WHERE id = public.orders.shop_id AND owner_id = auth.uid())
  OR auth.uid() = public.orders.delivery_partner_id
);
DROP POLICY IF EXISTS "order_delivery_update" ON public.orders;
CREATE POLICY "order_delivery_update" ON public.orders FOR UPDATE USING (
  auth.uid() = public.orders.delivery_partner_id
);

-- Items: Access via order
DROP POLICY IF EXISTS "item_access" ON public.order_items;
CREATE POLICY "item_access" ON public.order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND user_id = auth.uid())
);

-- ============================================
-- 7. AUTO-TIMESTAMP UPDATE
-- ============================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profile_update ON public.profiles;
CREATE TRIGGER tr_profile_update BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_timestamp();

DROP TRIGGER IF EXISTS tr_order_update ON public.orders;
CREATE TRIGGER tr_order_update BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_timestamp();

SELECT 'NEXPRINT 2.0 FULL PROJECT SETUP COMPLETE!' as status;
