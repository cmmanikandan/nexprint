-- =============================================================
-- NexPrint deploy patch (safe + idempotent)
-- Date: 2026-03-07
-- Purpose:
--   - Add missing geo fields on print_shops
--   - Add modern order_items fields
--   - Ensure delivery columns on orders
--   - Ensure feedback.is_resolved exists
--   - Ensure common enum values exist
--   - Refresh PostgREST schema cache
--
-- Notes:
--   - This script avoids destructive DROP/CASCADE operations.
--   - Safe to run multiple times.
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------
-- 1) print_shops: latitude / longitude / active
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.print_shops
  ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
  ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- -------------------------------------------------------------
-- 2) order_items: modern print options
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.order_items
  ADD COLUMN IF NOT EXISTS binding TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS custom_services JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS orientation TEXT DEFAULT 'portrait',
  ADD COLUMN IF NOT EXISTS paper_weight TEXT DEFAULT '75gsm',
  ADD COLUMN IF NOT EXISTS page_range TEXT DEFAULT 'All';

-- -------------------------------------------------------------
-- 3) orders: delivery logistics columns
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_notes TEXT,
  ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS delivery_partner_id UUID REFERENCES public.profiles(id);

-- -------------------------------------------------------------
-- 4) feedback: resolution tracking
-- -------------------------------------------------------------
ALTER TABLE IF EXISTS public.feedback
  ADD COLUMN IF NOT EXISTS is_resolved BOOLEAN DEFAULT false;

-- -------------------------------------------------------------
-- 5) Enum value hardening (safe add-if-missing)
-- -------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
    BEGIN ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'pending'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'shop_accepted'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'printing'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'ready_for_pickup'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'out_for_delivery'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'completed'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'cancelled'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'on_hold'; EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    BEGIN ALTER TYPE payment_status ADD VALUE IF NOT EXISTS 'captured'; EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'user'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'shop_owner'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'delivery_partner'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'staff'; EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'manager'; EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

-- -------------------------------------------------------------
-- 6) Delivery-partner visibility and update access
-- -------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_class WHERE relname = 'orders' AND relnamespace = 'public'::regnamespace) THEN
    BEGIN
      DROP POLICY IF EXISTS "Terminal Job Visibility" ON public.orders;
      CREATE POLICY "Terminal Job Visibility" ON public.orders FOR SELECT
      USING (
        auth.uid() = user_id
        OR EXISTS (SELECT 1 FROM public.print_shops WHERE id = shop_id AND owner_id = auth.uid())
        OR auth.uid() = delivery_partner_id
      );
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
      DROP POLICY IF EXISTS "Terminal Job Processing" ON public.orders;
      CREATE POLICY "Terminal Job Processing" ON public.orders FOR UPDATE
      USING (
        EXISTS (SELECT 1 FROM public.print_shops WHERE id = shop_id AND owner_id = auth.uid())
        OR auth.uid() = delivery_partner_id
      );
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END IF;
END $$;

-- -------------------------------------------------------------
-- 7) Optional role backfill examples (uncomment if needed)
-- -------------------------------------------------------------
-- UPDATE public.profiles SET role = 'user' WHERE role::text = 'student';
-- UPDATE public.profiles SET role = 'shop_owner' WHERE email = 'manikandanprabhu1221@gmail.com';
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'manikandanprabhu37@gmail.com';

-- -------------------------------------------------------------
-- 8) Refresh API schema cache
-- -------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
