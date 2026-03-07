
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/user-web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRealtime() {
    console.log("--- FINAL DIAGNOSTIC ---");

    // 1. Check all orders in public schema
    const { data: orders, error } = await supabase.from('orders').select('*, profiles!user_id(full_name)');
    if (error) {
        console.error("Order fetch error:", error);
    } else {
        console.log("Found", orders.length, "orders in table.");
        orders.forEach(o => {
            console.log(`Order: ${o.order_number}, Status: ${o.status}, ShopID: ${o.shop_id}`);
        });
    }

    // 2. Check the Shop we are looking at
    const { data: shops } = await supabase.from('print_shops').select('*');
    console.log("Total Shops:", shops?.length);
    if (shops) {
        shops.forEach(s => {
            console.log(`Shop: ${s.name}, ID: ${s.id}, Owner: ${s.owner_id}`);
        });
    }

    // 3. Compare current user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const admin = users?.find(u => u.email === 'manikandanprabhu1221@gmail.com');
    if (admin) {
        console.log("Manikandan ID:", admin.id);
    }
}

checkRealtime();
