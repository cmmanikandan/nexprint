
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/user-web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFix() {
    console.log("--- SEARCHING FOR ORDERS ---");
    const { data: orders, error } = await supabase.from('orders').select('id, status, shop_id, order_number');
    if (error) {
        console.error("Error fetching orders:", error);
        return;
    }

    if (orders.length === 0) {
        console.log("Still 0 orders found. This is very strange if they show in the browser.");
        return;
    }

    console.log(`Found ${orders.length} orders.`);
    for (const order of orders) {
        console.log(`Order: ${order.order_number}, Status: ${order.status}, Shop: ${order.shop_id}`);
        // Try to update to 'shop_accepted'
        console.log("Attempting status update to 'shop_accepted'...");
        const { error: updError } = await supabase.from('orders').update({ status: 'shop_accepted' }).eq('id', order.id);
        if (updError) {
            console.error("Update FAILED:", updError.message);
        } else {
            console.log("Update SUCCESSFUL!");
        }
    }
}

checkAndFix();
