
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/user-web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars (URL/Key)");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrders() {
    const { data: allOrders, error: allOrdersError } = await supabase.from('orders').select('*');
    if (allOrdersError) {
        console.error("AllOrdersError:", allOrdersError);
    } else {
        console.log("All Orders (no filter):", allOrders);
    }

    const { data: shops, error: shopError } = await supabase.from('print_shops').select('id, name, owner_id');
    if (shopError) {
        console.error("ShopError:", shopError);
    } else {
        console.log("Shops:", shops);
    }

    const { data: orders, error: orderError } = await supabase.from('orders').select('id, order_number, user_id, shop_id, status, total_amount').order('created_at', { ascending: false }).limit(5);
    if (orderError) {
        console.error("OrderError:", orderError);
    } else {
        console.log("Recent Orders:", orders);
    }

    const { data: owners, error: ownersError } = await supabase.from('profiles').select('id, full_name, role').eq('id', 'bf3abc91-0e35-4189-b1f7-67d29cd3c9f6');
    if (ownersError) {
        console.error("OwnersError:", ownersError);
    } else {
        console.log("Shop Owner Profile:", owners);
    }

    const { data: orderItems, error: itemsError } = await supabase.from('order_items').select('id, order_id, file_name, price').limit(5);
    if (itemsError) {
        console.error("ItemsError:", itemsError);
    } else {
        console.log("Recent Order Items:", orderItems);
    }
}

checkOrders();
