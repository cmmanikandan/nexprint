
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'apps/print-shop-admin/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing env vars (URL/Key)");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFeedback() {
    console.log("Testing feedback table column 'is_resolved'...");
    const { data, error } = await supabase.from('feedback').select('is_resolved').limit(1);
    if (error) {
        console.log("Column missing or error:", error.message);
    } else {
        console.log("Column exists.");
    }
}

testFeedback();
