
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/user-web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrders() {
    const shopId = '06c98cc1-0e22-4ee6-a81f-807dffc93f4a';
    console.log("Checking orders for Shop:", shopId);

    const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('shop_id', shopId);

    if (error) {
        console.error("Error fetching orders:", error);
    } else {
        console.log("Total orders found for this shop:", orders.length);
        if (orders.length > 0) {
            console.log("Statuses of these orders:", orders.map(o => o.status));
        }
    }

    const { data: allOrders } = await supabase.from('orders').select('id, shop_id, status').limit(10);
    console.log("Top 10 orders in whole DB:", allOrders);
}

checkOrders();
