/**
 * Fix ALL role issues in NexPrint DB.
 * Run: node fix_roles.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kivyrwxshajdpfgxxtwf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_tcwUM01cDf8uxZmAH7xHpw_EuBqLmrv';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fixRoles() {
    console.log('\n=== NexPrint Role Fix ===\n');

    // 1. Set manikandanprabhu1221 → shop_owner (already done, re-confirm)
    const fix1 = await supabase
        .from('profiles')
        .update({ role: 'shop_owner' })
        .eq('email', 'manikandanprabhu1221@gmail.com');
    console.log('manikandanprabhu1221 → shop_owner:', fix1.error?.message || '✅ OK');

    // 2. Fix cmtechnology37 role from 'student' → 'user'
    const fix2 = await supabase
        .from('profiles')
        .update({ role: 'user' })
        .eq('email', 'cmtechnology37@gmail.com')
        .eq('role', 'student');
    console.log('cmtechnology37 student→user:', fix2.error?.message || '✅ OK');

    // 3. Show all profiles to see what manikandanaprabhu37 maps to
    const { data: all } = await supabase
        .from('profiles')
        .select('id, email, role, full_name');

    console.log('\n📋 Current profiles:');
    all?.forEach(p => console.log(` • ${p.email} | ${p.role} | ${p.full_name}`));

    console.log('\n=== RESULT ===');
    console.log('manikandanprabhu1221@gmail.com → Shop Admin (shop_owner)');
    console.log('manikandanaprabhu37@gmail.com  → NOT in database yet.');
    console.log('\n👉 manikandanaprabhu37@gmail.com needs to SIGN UP first,');
    console.log('   then run this SQL in Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/kivyrwxshajdpfgxxtwf/editor\n');
    console.log("   UPDATE profiles SET role = 'admin' WHERE email = 'manikandanaprabhu37@gmail.com';\n");
}

fixRoles().catch(console.error);
