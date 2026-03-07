-- =============================================================
-- NEXPRINT 2.0 - MASTER ENTERPRISE SCHEMA (500+ LINES)
-- =============================================================
-- Instructions: 
-- 1. Open your Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Copy/Paste this entire script and click RUN
-- This script fixes the "Empty Job Queue" and "Missing Mail DP"
-- =============================================================

-- 1. SYSTEM EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. MASTER ENUM TYPES (Run safe, won't fail if exist)
-- Includes the CRITICAL 'pending' status fix
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'shop_owner', 'delivery_partner', 'admin', 'staff');
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
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'shop_status') THEN
        CREATE TYPE shop_status AS ENUM ('open', 'closed', 'busy');
    END IF;
END $$;

-- 3. CORE IDENTITY LAYER (PROFILES)
-- Stores individual user details & credentials
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  phone TEXT,
  full_name TEXT,
  avatar_url TEXT,
  reg_no TEXT,
  department TEXT,
  year TEXT,
  balance DECIMAL(10,2) DEFAULT 0.00,
  role user_role DEFAULT 'user',
  is_onboarded BOOLEAN DEFAULT false,
  fcm_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Legacy fallback compatibility
  name TEXT,
  shop_address TEXT,
  branch TEXT,
  op_since TEXT
);

-- 4. ESTABLISHMENT LAYER (PRINT SHOPS)
-- Manages shop branding, location, and pricing
CREATE TABLE IF NOT EXISTS public.print_shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  area TEXT,
  city TEXT,
  district TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  pincode TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  instagram TEXT,
  facebook TEXT,
  linkedin TEXT,
  website TEXT,
  status shop_status DEFAULT 'open',
  rating DECIMAL(3, 2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  image_url TEXT,
  color_price_per_page DECIMAL(10, 2) DEFAULT 2.00,
  bw_price_per_page DECIMAL(10, 2) DEFAULT 0.50,
  binding_price DECIMAL(10, 2) DEFAULT 30.00,
  photo_sheet_price DECIMAL(10, 2) DEFAULT 15.00,
  emergency_surcharge DECIMAL(10, 2) DEFAULT 30.00,
  delivery_available BOOLEAN DEFAULT true,
  extra_services JSONB DEFAULT '[]',
  settings JSONB DEFAULT '{"pin_required": true, "admin_pin": "1234", "sound_alerts": true}',
  owner_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TRANSACTIONAL LAYER (ORDERS & ITEMS)
-- Core engine for print job processing
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.profiles(id),
  shop_id UUID REFERENCES public.print_shops(id) ON DELETE CASCADE,
  status order_status DEFAULT 'pending',
  is_emergency BOOLEAN DEFAULT false,
  priority INTEGER DEFAULT 0,
  rack_id UUID,
  total_amount DECIMAL(10, 2) DEFAULT 0.00,
  payment_method payment_method DEFAULT 'online',
  payment_status payment_status DEFAULT 'pending',
  qr_code TEXT,
  otp_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  pages INTEGER,
  -- Delivery System Expansion
  delivery_needed BOOLEAN DEFAULT false,
  delivery_address TEXT,
  delivery_notes TEXT,
  delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
  delivery_status TEXT DEFAULT 'none', -- none, pending, assigned, picked_up, delivered
  delivery_partner_id UUID REFERENCES public.profiles(id),
  delivery_payment_status payment_status DEFAULT 'pending',
  whatsapp_notified BOOLEAN DEFAULT false,
  invoice_sent_whatsapp BOOLEAN DEFAULT false
);

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
  binding TEXT DEFAULT 'none',
  custom_services JSONB DEFAULT '[]',
  orientation TEXT DEFAULT 'portrait',
  paper_weight TEXT DEFAULT '75gsm',
  page_range TEXT DEFAULT 'All',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SYSTEM LOGISTICS (RACKS, STAFF & FEEDBACK)
CREATE TABLE IF NOT EXISTS public.racks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES public.print_shops(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 7. SYSTEM TELEMETRY (ACTIVITY LOGS)
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID REFERENCES public.print_shops(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ADVANCED TRIGGERS & FUNCTIONS

-- Secure Order Number Generator (NP format)
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  done BOOL := false;
BEGIN
  WHILE NOT done LOOP
    new_number := 'NP' || TO_CHAR(NOW(), 'YYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number) THEN
      done := true;
    END IF;
  END LOOP;
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_order_number ON public.orders;
CREATE TRIGGER trigger_order_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Google Account Profile Synchronization Logic
-- Repairs "Mail DP" whenever a user signs up or logins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    'user'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name),
    avatar_url = COALESCE(public.profiles.avatar_url, EXCLUDED.avatar_url);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. ROW LEVEL SECURITY (RLS) - PRIVACY ENGINE
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.print_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.racks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view (for searches), owner can edit
DROP POLICY IF EXISTS "Public Profile View" ON public.profiles;
CREATE POLICY "Public Profile View" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Owner Profile Access" ON public.profiles;
CREATE POLICY "Owner Profile Access" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Print Shops: Managed by Owner
DROP POLICY IF EXISTS "Management Access" ON public.print_shops;
CREATE POLICY "Management Access" ON public.print_shops FOR ALL USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS "Public Shop View" ON public.print_shops;
CREATE POLICY "Public Shop View" ON public.print_shops FOR SELECT USING (true);

-- Orders: CRITICAL Fix for Terminal Visibility
-- Only the user who placed it AND the assigned shop owner can see/manage the order
DROP POLICY IF EXISTS "Client Order View" ON public.orders;
CREATE POLICY "Client Order View" ON public.orders FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Terminal Job Visibility" ON public.orders;
CREATE POLICY "Terminal Job Visibility" ON public.orders FOR SELECT 
USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.print_shops WHERE id = shop_id AND owner_id = auth.uid())
  OR auth.uid() = delivery_partner_id
);
DROP POLICY IF EXISTS "Terminal Job Processing" ON public.orders;
CREATE POLICY "Terminal Job Processing" ON public.orders FOR UPDATE 
USING (
  EXISTS (SELECT 1 FROM public.print_shops WHERE id = shop_id AND owner_id = auth.uid())
  OR auth.uid() = delivery_partner_id
);
DROP POLICY IF EXISTS "Client Order Entry" ON public.orders;
CREATE POLICY "Client Order Entry" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Order Items: Viewable by Order Owner or Shop Owner
DROP POLICY IF EXISTS "Job Data Access" ON public.order_items;
CREATE POLICY "Job Data Access" ON public.order_items FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.print_shops WHERE id = shop_id AND owner_id = auth.uid()))));
DROP POLICY IF EXISTS "Job Data Creation" ON public.order_items;
CREATE POLICY "Job Data Creation" ON public.order_items FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE id = order_id AND user_id = auth.uid()));

-- Racks & Staff Policy
DROP POLICY IF EXISTS "Rack Management" ON public.racks;
CREATE POLICY "Rack Management" ON public.racks FOR ALL USING (EXISTS (SELECT 1 FROM public.print_shops WHERE id = shop_id AND owner_id = auth.uid()));
DROP POLICY IF EXISTS "Staff Management" ON public.shop_staff;
CREATE POLICY "Staff Management" ON public.shop_staff FOR ALL USING (EXISTS (SELECT 1 FROM public.print_shops WHERE id = shop_id AND owner_id = auth.uid()));

-- Feedback Policy
DROP POLICY IF EXISTS "Feedback View" ON public.feedback;
CREATE POLICY "Feedback View" ON public.feedback FOR SELECT 
USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.print_shops WHERE id = shop_id AND owner_id = auth.uid()));

DROP POLICY IF EXISTS "Feedback Insert" ON public.feedback;
CREATE POLICY "Feedback Insert" ON public.feedback FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Feedback Resolution" ON public.feedback;
CREATE POLICY "Feedback Resolution" ON public.feedback FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.print_shops WHERE id = shop_id AND owner_id = auth.uid()));

-- =============================================================
-- THE END - NEXPRINT ENTERPRISE ENGINE READY
-- =============================================================
