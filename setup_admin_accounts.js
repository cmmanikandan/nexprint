/**
 * NexPrint — Set Admin Passwords
 * Sets passwords for Super Admin and Shop Admin accounts.
 *
 * REQUIRES the REAL Supabase service_role key (not the anon key).
 *
 * Get it from:
 * https://supabase.com/dashboard/project/kivyrwxshajdpfgxxtwf/settings/api
 * → "service_role" secret
 *
 * Run: node setup_admin_accounts.js YOUR_SERVICE_ROLE_KEY
 * Example: node setup_admin_accounts.js eyJhbGciOiJIUzI1NiIsInR5cCI6...
 */

const https = require('https');

const SUPABASE_PROJECT_REF = 'kivyrwxshajdpfgxxtwf';
const SUPABASE_URL = `https://${SUPABASE_PROJECT_REF}.supabase.co`;

const SERVICE_KEY = process.argv[2];
if (!SERVICE_KEY) {
    console.error('\n❌ Usage: node setup_admin_accounts.js YOUR_SERVICE_ROLE_KEY\n');
    console.log('Get the service_role key from:');
    console.log('https://supabase.com/dashboard/project/kivyrwxshajdpfgxxtwf/settings/api\n');
    process.exit(1);
}

const ACCOUNTS = [
    {
        email: 'manikandanprabhu37@gmail.com',
        password: 'CMMANI02',
        role: 'admin',
        label: 'Super Admin',
    },
    {
        email: 'manikandanprabhu1221@gmail.com',
        password: 'CMMANI02',
        role: 'shop_owner',
        label: 'Shop Admin (CM0x)',
    },
];

function apiCall(path, method, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = https.request({
            hostname: `${SUPABASE_PROJECT_REF}.supabase.co`,
            path,
            method,
            headers: {
                'Content-Type': 'application/json',
                'apikey': SERVICE_KEY,
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Content-Length': Buffer.byteLength(data),
            },
        }, res => {
            let raw = '';
            res.on('data', c => raw += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
                catch { resolve({ status: res.statusCode, body: raw }); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    console.log('\n==========================================');
    console.log('  NexPrint — Admin Account Setup');
    console.log('==========================================\n');

    for (const acc of ACCOUNTS) {
        console.log(`\n🔧 Setting up: ${acc.label} (${acc.email})`);

        // Step 1: Check if user exists via admin API
        const list = await apiCall(`/auth/v1/admin/users?email=${encodeURIComponent(acc.email)}`, 'GET', {});

        let userId = null;

        if (list.status === 200 && list.body?.users?.length > 0) {
            userId = list.body.users[0].id;
            console.log(`  ✅ User exists. ID: ${userId}`);

            // Update password
            const upd = await apiCall(`/auth/v1/admin/users/${userId}`, 'PUT', {
                password: acc.password,
                email_confirm: true,
            });

            if (upd.status === 200) {
                console.log(`  🔐 Password set to: ${acc.password}`);
            } else {
                console.log(`  ❌ Failed to set password:`, upd.body);
                continue;
            }
        } else {
            // Create the user
            console.log(`  ➕ User not found. Creating...`);
            const created = await apiCall('/auth/v1/admin/users', 'POST', {
                email: acc.email,
                password: acc.password,
                email_confirm: true,
                user_metadata: { full_name: acc.label },
            });

            if (created.status === 200 || created.status === 201) {
                userId = created.body.id;
                console.log(`  ✅ User created. ID: ${userId}`);
            } else {
                console.log(`  ❌ Failed to create user:`, created.body);
                continue;
            }
        }

        // Step 2: Set/fix the role in profiles table
        if (userId) {
            // Upsert profile with correct role
            const { createClient } = require('@supabase/supabase-js');
            const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

            const { error: upsertErr } = await supabase
                .from('profiles')
                .upsert({
                    id: userId,
                    email: acc.email,
                    role: acc.role,
                    full_name: acc.label,
                }, { onConflict: 'id' });

            if (upsertErr) {
                console.log(`  ⚠️  Profile upsert warning:`, upsertErr.message);
                console.log(`  👉 Run this SQL manually if needed:`);
                console.log(`     UPDATE profiles SET role='${acc.role}' WHERE id='${userId}';`);
            } else {
                console.log(`  👤 Profile role set to: ${acc.role}`);
            }
        }

        console.log(`  🎉 Done: ${acc.email} / ${acc.password} → ${acc.role}`);
    }

    console.log('\n==========================================');
    console.log('  All accounts configured!');
    console.log('==========================================');
    console.log('\nLogin test:');
    console.log('  Super Admin: manikandanprabhu37@gmail.com / CMMANI02');
    console.log('  Shop Admin:  manikandanprabhu1221@gmail.com / CMMANI02');
    console.log('\n  → Go to: http://localhost:3003/login');
    console.log('  → Click "Super Admin" or "Shop Admin" tile');
    console.log('  → Enter email + password\n');
}

main().catch(console.error);
