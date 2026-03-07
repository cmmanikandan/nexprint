/**
 * One-time script to set password for the super admin account.
 * Uses Supabase Management API via the project's service key.
 * Run: node set_admin_password_v2.js
 */

const https = require('https');

const SUPABASE_PROJECT_REF = 'kivyrwxshajdpfgxxtwf';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;

// The anon/publishable key - we'll use the auth admin endpoint differently
const SUPABASE_KEY = 'sb_publishable_tcwUM01cDf8uxZmAH7xHpw_EuBqLmrv';

const TARGET_EMAIL = 'manikandanaprabhu37@gmail.com';
const NEW_PASSWORD = 'CMMANI02';

async function fetchJson(url, options) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const reqOptions = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {},
        };

        const req = https.request(reqOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data || '{}') });
                } catch {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

async function main() {
    console.log('======================================');
    console.log('NexPrint Super Admin Password Setup');
    console.log('======================================\n');

    // Step 1: First sign in as super admin using Google token if available,
    // or use the OTP (magic link) approach via admin API
    // Try admin generateLink to create a recovery link
    console.log('Attempting to generate a recovery link for the admin account...');

    // Use Supabase's admin API to generate a magic link / recovery link
    const res = await fetchJson(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({
            type: 'recovery',
            email: TARGET_EMAIL,
        }),
    });

    console.log('Status:', res.status);
    console.log('Response:', JSON.stringify(res.body, null, 2));

    if (res.status === 200 && res.body.action_link) {
        console.log('\n✅ Recovery link generated!');
        console.log('Action Link:', res.body.action_link);
        console.log('\nOpen this link in your browser to set the password.');
    } else {
        console.log('\nThe anon key does not have admin privileges (expected).');
        console.log('\n📋 MANUAL STEPS to fix this:');
        console.log('');
        console.log('OPTION 1 - Using Supabase Dashboard (Easiest):');
        console.log('  1. Go to: https://supabase.com/dashboard/project/kivyrwxshajdpfgxxtwf/auth/users');
        console.log('  2. Find user: manikandanaprabhu37@gmail.com');
        console.log('  3. Click the "⋮" (3 dots) next to the user');
        console.log('  4. Click "Send password recovery"');
        console.log('  5. Check your Gmail and click the reset link');
        console.log('  6. Set password to: CMMANI02');
        console.log('');
        console.log('OPTION 2 - Get Service Role Key:');
        console.log('  1. Go to: https://supabase.com/dashboard/project/kivyrwxshajdpfgxxtwf/settings/api');
        console.log('  2. Copy the "service_role" secret key');
        console.log('  3. Share it with me and I will set the password programmatically');
        console.log('');
        console.log('OPTION 3 - Check email (already sent):');
        console.log('  A password reset email was already sent to manikandanaprabhu37@gmail.com');
        console.log('  Check Gmail inbox/spam for an email from Supabase');
    }
}

main().catch(console.error);
