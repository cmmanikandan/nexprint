-- =====================================================
-- NexPrint — Fix user_role Enum + Set Admin Roles
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/kivyrwxshajdpfgxxtwf/editor
-- =====================================================

-- STEP 1: Add missing enum values (safe, won't fail if they exist)
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'shop_owner';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'user';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'delivery_partner';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'staff';

-- (Commit the enum changes before using them)
-- Wait — in Postgres, ADD VALUE is auto-committed, so it's fine.

-- STEP 2: Rename 'student' → 'user' for existing records (safe update)
UPDATE profiles SET role = 'user' WHERE role = 'student';

-- STEP 3: Set correct roles for admin accounts
UPDATE profiles SET role = 'shop_owner' WHERE email = 'manikandanprabhu1221@gmail.com';
UPDATE profiles SET role = 'admin'      WHERE email = 'manikandanprabhu37@gmail.com';

-- STEP 4: Verify
SELECT email, role FROM profiles ORDER BY role;
