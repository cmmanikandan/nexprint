const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kivyrwxshajdpfgxxtwf.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpdnlyd3hzaGFqZHBmZ3h4dHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE1ODA5MSwiZXhwIjoyMDg3NzM0MDkxfQ.Oo_BU5dhLJq_U6Vzdy7679twFwtvZTRGvlSq3oS_JDg';

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function findAdmins() {
    console.log('\n🔍 Finding all admin users...\n');
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, created_at')
        .eq('role', 'admin');

    if (error) { console.error('Error:', error.message); return; }

    if (!data || data.length === 0) {
        console.log('⚠️  No admin users found in profiles table.');
        console.log('👉 Creating a new super admin...\n');
        await createAdmin();
        return;
    }

    console.log(`Found ${data.length} admin(s):\n`);
    data.forEach(u => {
        console.log(`  📧 Email:      ${u.email || 'N/A (check Supabase Auth)'}`);
        console.log(`  👤 Name:       ${u.full_name || 'N/A'}`);
        console.log(`  🆔 Profile ID: ${u.id}`);
        console.log(`  📅 Created:    ${new Date(u.created_at).toLocaleString('en-IN')}`);
        console.log('  ---');
    });

    // Also fetch their auth email from auth.users
    console.log('\n🔐 Fetching auth emails...\n');
    const ids = data.map(u => u.id);
    const { data: authUsers, error: authErr } = await supabase.auth.admin.listUsers();
    if (authErr) { console.error('Auth list error:', authErr.message); return; }

    const admins = authUsers.users.filter(u => ids.includes(u.id));
    admins.forEach(u => {
        console.log(`  ✅ Email: ${u.email}`);
        console.log(`     ID:    ${u.id}`);
        console.log(`     Last sign in: ${u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString('en-IN') : 'Never'}`);
        console.log('  ---');
    });
}

async function createAdmin() {
    const email = 'admin@nexprint.cloud';
    const password = 'NexAdmin@2025!';

    console.log(`Creating admin: ${email}`);

    // Create in Supabase Auth
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Super Admin' }
    });

    if (authErr) {
        if (authErr.message.includes('already')) {
            console.log('⚠️  User already exists in auth — updating role to admin...');
            // find existing user
            const { data: users } = await supabase.auth.admin.listUsers();
            const existing = users?.users?.find(u => u.email === email);
            if (existing) {
                await supabase.from('profiles').update({ role: 'admin', full_name: 'Super Admin' }).eq('id', existing.id);
                console.log(`✅ Role updated to admin for ${email}`);
            }
        } else {
            console.error('Create error:', authErr.message);
        }
        return;
    }

    // Set role in profiles table
    const { error: profileErr } = await supabase.from('profiles').upsert({
        id: authUser.user.id,
        email,
        full_name: 'Super Admin',
        role: 'admin',
    });

    if (profileErr) console.error('Profile error:', profileErr.message);
    else {
        console.log('\n✅ Super Admin Created!\n');
        console.log(`   📧 Email:    ${email}`);
        console.log(`   🔑 Password: ${password}`);
        console.log(`   🌐 Login at: http://localhost:3003/login`);
        console.log('\n⚠️  Change the password after first login!\n');
    }
}

findAdmins();
