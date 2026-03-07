// Script to set password for super admin account
// Run with: node set_admin_password.js

const SUPABASE_URL = 'https://kivyrwxshajdpfgxxtwf.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tcwUM01cDf8uxZmAH7xHpw_EuBqLmrv';

const TARGET_EMAIL = 'manikandanaprabhu37@gmail.com';
const NEW_PASSWORD = 'CMMANI02';

async function sendPasswordReset() {
    console.log('===========================================');
    console.log('NexPrint - Super Admin Password Setup');
    console.log('===========================================');
    console.log(`Email: ${TARGET_EMAIL}`);
    console.log(`Password to set: ${NEW_PASSWORD}`);
    console.log('');

    // Step 1: Send password reset email
    console.log('Step 1: Sending password reset email...');
    const res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email: TARGET_EMAIL }),
    });

    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (res.ok) {
        console.log('');
        console.log('✅ Password reset email sent to:', TARGET_EMAIL);
        console.log('');
        console.log('📧 Check your email inbox for a link from Supabase.');
        console.log('   Click the link, and when prompted, enter: CMMANI02');
        console.log('');
        console.log('After setting the password, you can log in at:');
        console.log('   http://localhost:3001');
        console.log('   Email:    manikandanaprabhu37@gmail.com');
        console.log('   Password: CMMANI02');
    } else {
        console.log('❌ Failed to send reset email. See response above.');
    }
}

sendPasswordReset().catch(console.error);
