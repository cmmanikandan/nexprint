
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/user-web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectOrders() {
    console.log("--- ORDER INSPECTION ---");
    const { data: orders, error } = await supabase.from('orders').select('*');
    if (error) {
        console.error("Error:", error);
    } else {
        console.log("Found", orders.length, "total orders.");
        orders.forEach(o => {
            console.log(`Order: ${o.order_number}, Status: ${o.status}, ShopID: ${o.shop_id}, Created: ${o.created_at}`);
        });
    }
}

inspectOrders();
