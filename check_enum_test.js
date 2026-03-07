
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/user-web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEnum() {
    console.log("--- ENUM CHECK ---");
    const { data, error } = await supabase.rpc('get_enum_values', { enum_name: 'order_status' });
    if (error) {
        console.log("RPC failed, trying raw SQL via internal check...");
        // Fallback: try to insert a dummy order with 'pending' and see the error
        const { error: insertError } = await supabase.from('orders').insert({
            order_number: 'DIAGNOSTIC-' + Date.now(),
            status: 'pending'
        });
        console.log("Direct Insert Error (proves enum issue):", insertError);
    } else {
        console.log("Allowed Statuses:", data);
    }
}

checkEnum();
