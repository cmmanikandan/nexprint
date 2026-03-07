const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kivyrwxshajdpfgxxtwf.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpdnlyd3hzaGFqZHBmZ3h4dHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE1ODA5MSwiZXhwIjoyMDg3NzM0MDkxfQ.Oo_BU5dhLJq_U6Vzdy7679twFwtvZTRGvlSq3oS_JDg';

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function updateAdminPassword() {
    const email = 'manikandanprabhu37@gmail.com';
    const newPassword = 'CMMANI02';

    console.log(`\n🔑 Updating password for ${email}...`);

    // Find user ID
    const { data: users } = await supabase.auth.admin.listUsers();
    const user = users?.users?.find(u => u.email === email);

    if (!user) {
        console.error('❌ User not found!');
        return;
    }

    const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: newPassword
    });

    if (error) {
        console.error('❌ Error:', error.message);
    } else {
        console.log('\n✅ Password updated!\n');
        console.log(`   📧 Email:    ${email}`);
        console.log(`   🔑 Password: ${newPassword}`);
        console.log(`   🌐 Login:    http://localhost:3003/login`);
        console.log('\n⚠️  Keep this password safe!\n');
    }
}

updateAdminPassword();
