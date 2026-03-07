/**
 * NexPrint — Quick Password Reset Script
 * Sends password reset emails to admin accounts.
 * 
 * This works with just the ANON key — no service role needed!
 * After clicking the reset link, set password to: CMMANI02
 *
 * Run: node send_reset_emails.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kivyrwxshajdpfgxxtwf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_tcwUM01cDf8uxZmAH7xHpw_EuBqLmrv';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const ADMINS = [
    'manikandanprabhu37@gmail.com',
    'manikandanprabhu1221@gmail.com',
];

async function main() {
    console.log('\n==========================================');
    console.log('  NexPrint — Password Reset Emails');
    console.log('==========================================\n');

    for (const email of ADMINS) {
        console.log(`📧 Sending reset email to: ${email}`);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: 'http://localhost:3003/auth/set-password',
        });

        if (error) {
            console.log(`  ❌ Failed: ${error.message}`);
            console.log(`  → This email is NOT registered. Need to create account first.`);
        } else {
            console.log(`  ✅ Reset email sent!`);
            console.log(`  → Open Gmail for ${email}`);
            console.log(`  → Click the reset link`);
            console.log(`  → Set password to: CMMANI02\n`);
        }
    }

    console.log('\n==========================================');
    console.log('AFTER setting passwords via email links:');
    console.log('==========================================');
    console.log('Run the SQL below in Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/kivyrwxshajdpfgxxtwf/editor\n');
    console.log(`UPDATE profiles SET role = 'admin'      WHERE email = 'manikandanprabhu37@gmail.com';`);
    console.log(`UPDATE profiles SET role = 'shop_owner' WHERE email = 'manikandanprabhu1221@gmail.com';\n`);
}

main().catch(console.error);
