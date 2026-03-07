
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/user-web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestOrder() {
    const shopId = '06c98cc1-0e22-4ee6-a81f-807dffc93f4a'; // CM-X
    const userId = 'bf3abc91-0e35-4189-b1f7-67d29cd3c9f6'; // Manikandan (using his own ID for test)

    const genOrderNum = `NPTEST-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    console.log("Creating test order with status 'placed'...");
    const { data: order, error: orderError } = await supabase.from('orders').insert({
        order_number: genOrderNum,
        user_id: userId,
        shop_id: shopId,
        total_amount: 15.00,
        payment_method: 'cash_pickup',
        payment_status: 'pending',
        status: 'placed',
        is_emergency: false
    }).select().single();

    if (orderError) {
        console.error("Order Insert Fail:", orderError);
        return;
    }
    console.log("Order Created:", order.id, order.order_number);

    console.log("Creating order item...");
    const { error: itemError } = await supabase.from('order_items').insert({
        order_id: order.id,
        file_url: 'https://example.com/test.pdf',
        file_name: 'TEST_FILE.pdf',
        file_pages: 10,
        print_type: 'black_white',
        print_side: 'single',
        copies: 3,
        total_pages: 30,
        price: 15.00
    });

    if (itemError) {
        console.error("Item Insert Fail:", itemError);
    } else {
        console.log("Test Order Complete!");
    }
}

createTestOrder();
