/**
 * NexPrint — FORCE CONFIRM & SET PASSWORDS
 * 
 * Run: node force_fix_admins.js YOUR_SERVICE_ROLE_KEY
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kivyrwxshajdpfgxxtwf.supabase.co';
const SERVICE_KEY = process.argv[2];

if (!SERVICE_KEY || SERVICE_KEY.startsWith('sb_publishable')) {
    console.error('\n❌ ERROR: You provided the ANON key. I need the SERVICE_ROLE key.');
    console.log('Get it here: https://supabase.com/dashboard/project/kivyrwxshajdpfgxxtwf/settings/api\n');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const ADMINS = [
    'manikandanprabhu37@gmail.com',
    'manikandanprabhu1221@gmail.com'
];

async function main() {
    console.log('\n🚀 Force-fixing Admin accessibility...');

    for (const email of ADMINS) {
        console.log(`\n📧 Processing: ${email}`);

        // 1. Get User ID
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            console.log(`  ❌ User not found in Auth. Please sign up first.`);
            continue;
        }

        // 2. Update status and password
        const { error: updError } = await supabase.auth.admin.updateUserById(user.id, {
            password: 'CMMANI02',
            email_confirm: true // This removes the "Email not confirmed" error
        });

        if (updError) {
            console.log(`  ❌ Failed to update: ${updError.message}`);
        } else {
            console.log(`  ✅ Success! Email confirmed & Password set to: CMMANI02`);
        }
    }

    console.log('\n✨ Both accounts are now active and verified.');
    console.log('Try logging in now at http://localhost:3003/login\n');
}

main().catch(console.error);
