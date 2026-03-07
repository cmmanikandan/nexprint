
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/user-web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    console.log("--- COLUMN CHECK ---");
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    if (error) {
        console.error("Orders Table Selection Error:", error);
    } else if (data.length > 0) {
        console.log("Order Keys:", Object.keys(data[0]));
    } else {
        console.log("No orders found. Checking table info via RPC...");
        // Check orders table columns
        const { data: cols } = await supabase.rpc('get_table_columns', { table_name: 'orders' });
        console.log("Columns:", cols);
    }
}

checkColumns();
