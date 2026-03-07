
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/user-web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEnums() {
    const { data: enums, error } = await supabase.rpc('enum_values', { enum_name: 'order_status' });
    if (error) {
        // If RPC doesn't exist, try a raw query via a dummy table
        console.error("RPC Error:", error.message);
        const { data: cols, error: colError } = await supabase.from('orders').select('status').limit(1);
        if (colError) console.error("ColError:", colError.message);
        else console.log("Orders status type check:", cols);
    } else {
        console.log("Order Status Enum:", enums);
    }
}

checkEnums();
