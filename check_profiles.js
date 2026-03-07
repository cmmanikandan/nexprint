
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/print-shop-admin/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProfiles() {
    const { data, error } = await supabase.from('profiles').select('role').limit(1);
    if (error) {
        console.log("Profiles role column missing:", error.message);
    } else {
        console.log("Profiles role column exists.");
    }
}

checkProfiles();
