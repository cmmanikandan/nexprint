
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/user-web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEnum() {
    console.log("--- CHECKING ENUM VALUES ---");
    const { data, error } = await supabase.rpc('get_enum_values', { enum_name: 'order_status' });
    if (error) {
        console.log("RPC get_enum_values failed, trying direct select...");
        const { data: enumData, error: enumError } = await supabase.from('pg_type').select('typname').eq('typname', 'order_status');
        console.log("Enum Typename:", enumData);

        // Let's try to update an order to 'shop_accepted' to see if it fails
        const { data: firstOrder } = await supabase.from('orders').select('id, status').limit(1);
        if (firstOrder && firstOrder.length > 0) {
            console.log("Testing update on order:", firstOrder[0].id);
            const { error: updateError } = await supabase.from('orders').update({ status: 'shop_accepted' }).eq('id', firstOrder[0].id);
            if (updateError) {
                console.error("UPDATE TO 'shop_accepted' FAILED:", updateError);
            } else {
                console.log("UPDATE TO 'shop_accepted' SUCCESSFUL");
            }
        }
    } else {
        console.log("Enum Values:", data);
    }
}

async function getEnumManual() {
    const { data, error } = await supabase.rpc('get_enum_values_manual');
    if (error) {
        // Fallback: try to see what's in the actual orders
        const { data: orders } = await supabase.from('orders').select('status').limit(10);
        console.log("Current statuses in DB:", [...new Set(orders.map(o => o.status))]);
    } else {
        console.log("Enum Values Managed:", data);
    }
}

// Since I don't have the RPC, let's just try to update a test order.
async function testUpdate() {
    const { data: orders } = await supabase.from('orders').select('id, status').limit(1);
    if (!orders || orders.length === 0) {
        console.log("No orders to test with.");
        return;
    }
    console.log(`Order ${orders[0].id} current status: ${orders[0].status}`);
    const { error } = await supabase.from('orders').update({ status: 'shop_accepted' }).eq('id', orders[0].id);
    if (error) {
        console.error("Error updating to shop_accepted:", error);
    } else {
        console.log("Successfully updated to shop_accepted!");
    }
}

testUpdate();
