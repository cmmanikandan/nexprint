
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/print-shop-admin/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrderItemsColumns() {
    console.log("Checking all columns in 'order_items'...");
    const { data, error } = await supabase.from('order_items').select('*').limit(1);
    if (error) {
        console.error("Error with '*':", error.message);
    } else {
        console.log("Existing columns:", Object.keys(data[0] || {}).join(', '));
    }
}

checkOrderItemsColumns();
