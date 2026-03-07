-- MASTER REPAIR SCRIPT FOR DISCREPANCIES
-- This script safely adds missing columns for NexPrint 2.0 features

-- 1. FIX FEEDBACK TABLE
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='feedback' AND column_name='is_resolved') THEN
        ALTER TABLE public.feedback ADD COLUMN is_resolved BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. FIX ORDERS TABLE
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='delivery_needed') THEN
        ALTER TABLE public.orders ADD COLUMN delivery_needed BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='whatsapp_notified') THEN
        ALTER TABLE public.orders ADD COLUMN whatsapp_notified BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='invoice_sent_whatsapp') THEN
        ALTER TABLE public.orders ADD COLUMN invoice_sent_whatsapp BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='otp_code') THEN
        ALTER TABLE public.orders ADD COLUMN otp_code TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='qr_code') THEN
        ALTER TABLE public.orders ADD COLUMN qr_code TEXT;
    END IF;
END $$;
