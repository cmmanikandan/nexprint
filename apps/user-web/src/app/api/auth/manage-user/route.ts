import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'
);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
    try {
        const { userId, action, data } = await req.json();

        if (!userId || !action) {
            return NextResponse.json({ error: 'Missing userId or action' }, { status: 400, headers: corsHeaders });
        }

        switch (action) {
            case 'update_password':
                if (!data.password) throw new Error('Password is required');
                const { error: pwdError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                    password: data.password
                });
                if (pwdError) throw pwdError;
                break;

            case 'update_profile':
                const { error: profileError } = await supabaseAdmin
                    .from('profiles')
                    .update(data)
                    .eq('id', userId);
                if (profileError) throw profileError;

                // Sync with shop_staff if applicable
                if (data.full_name || data.phone) {
                    await supabaseAdmin
                        .from('shop_staff')
                        .update({
                            full_name: data.full_name,
                            phone: data.phone
                        })
                        .eq('user_id', userId);
                }
                break;

            case 'block':
                const { error: blockError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
                    ban_duration: data.blocked ? '1000h' : 'none'
                });
                if (blockError) throw blockError;
                break;

            case 'delete':
                // Check if user is staff or partner to clean up related tables
                await supabaseAdmin.from('shop_staff').delete().eq('user_id', userId);
                const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
                if (deleteError) throw deleteError;
                break;

            default:
                throw new Error('Invalid action');
        }

        return NextResponse.json({ success: true }, { headers: corsHeaders });
    } catch (error: any) {
        console.error('Manage user error:', error);
        return NextResponse.json({ error: error.message || 'Failed to manage user' }, { status: 500, headers: corsHeaders });
    }
}
