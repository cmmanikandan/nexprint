
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/user-web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    const { data, error } = await supabase.rpc('get_tables'); // Won't work without RPC
    console.log("Tables Diagnostic...");

    // Check if we can see ANY row in AUTH.USERS to verify project connection
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    console.log("Auth Users Count:", users?.length);
    if (users) {
        users.forEach(u => console.log(`User: ${u.email}, ID: ${u.id}`));
    }

    // Check if we can see ANY row in profiles
    const { data: profiles } = await supabase.from('profiles').select('id, email');
    console.log("Profiles Count:", profiles?.length);

    // Check orders again but very simply
    const { data: rawOrders } = await supabase.from('orders').select('*');
    console.log("Raw Orders Count:", rawOrders?.length);
}

listTables();
