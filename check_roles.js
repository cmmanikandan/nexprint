/**
 * Check what valid enum values exist for user_role in Supabase
 */
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://kivyrwxshajdpfgxxtwf.supabase.co',
    'sb_publishable_tcwUM01cDf8uxZmAH7xHpw_EuBqLmrv'
);

async function main() {
    // Fetch all distinct role values currently in the profiles table
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .limit(50);

    if (error) {
        console.error('Error:', error.message);
    } else {
        const roles = [...new Set(data.map(r => r.role))];
        console.log('\n✅ Distinct role values in profiles table:');
        roles.forEach(r => console.log(' •', JSON.stringify(r)));
    }
}
main().catch(console.error);
