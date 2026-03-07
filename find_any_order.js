
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/user-web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAnyOrder() {
    console.log("--- FIND ANY ORDER ---");

    // Check all orders
    const { data: orders, error } = await supabase.from('orders').select('*');
    if (error) {
        console.error("Orders Table Selection Error:", error);
    } else {
        console.log("Found", orders.length, "Total Orders in table.");
        if (orders.length > 0) {
            console.log("Sample Order:", orders[0]);
        }
    }

    // Check all shops
    const { data: shops } = await supabase.from('print_shops').select('id, name, owner_id');
    console.log("Shops in DB:", shops);

    // Check all profiles
    const { data: profiles } = await supabase.from('profiles').select('id, email, full_name').limit(5);
    console.log("Profiles in DB:", profiles);

    console.log("--- END ---");
}

findAnyOrder();
