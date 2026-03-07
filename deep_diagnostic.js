/**
 * NexPrint — Diagnostic Role Check
 * Verifies EXACT roles and IDs in Auth and Profiles
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kivyrwxshajdpfgxxtwf.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpdnlyd3hzaGFqZHBmZ3h4dHdmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE1ODA5MSwiZXhwIjoyMDg3NzM0MDkxfQ.Oo_BU5dhLJq_U6Vzdy7679twFwtvZTRGvlSq3oS_JDg';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const EMAILS = [
    'manikandanprabhu37@gmail.com',
    'manikandanprabhu1221@gmail.com'
];

async function main() {
    console.log('\n🔍 Running Deep Diagnostic...');

    for (const email of EMAILS) {
        console.log(`\n📧 Checking: ${email}`);

        // Check Auth
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            console.log('  ❌ NOT FOUND in Auth');
            continue;
        }
        console.log(`  ✅ Auth ID: ${user.id}`);
        console.log(`  ✅ Auth Confirmed: ${user.email_confirmed_at ? 'YES' : 'NO'}`);

        // Check Profile
        const { data: profile, error: profError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profError) {
            console.log(`  ❌ Profile error: ${profError.message}`);
        } else if (!profile) {
            console.log(`  ❌ Profile MISSING for this ID`);
        } else {
            console.log(`  ✅ Profile Role: "${profile.role}"`);
            console.log(`  ✅ Profile Email: "${profile.email}"`);

            if (profile.role !== 'admin' && profile.role !== 'shop_owner') {
                console.log(`  ⚠️  ROLE MISMATCH! Found "${profile.role}" but expected admin/shop_owner`);
            }
        }
    }
}

main().catch(console.error);
