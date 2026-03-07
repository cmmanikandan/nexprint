import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Year conversion (DB column might be INTEGER)
const yearToNum: Record<string, number> = {
    '1st Year': 1, '2nd Year': 2, '3rd Year': 3, '4th Year': 4, 'Post Grad': 5
};
const numToYear: Record<number, string> = {
    1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: 'Post Grad'
};

function fixYearForDisplay(data: any) {
    if (data && typeof data.year === 'number') {
        data.year = numToYear[data.year] || `${data.year}`;
    }
    // Also map 'name' to 'full_name' for frontend
    if (data && data.name && !data.full_name) {
        data.full_name = data.name;
    }
    return data;
}

function getClient(token?: string) {
    if (token) {
        return createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: `Bearer ${token}` } }
        });
    }
    return createClient(supabaseUrl, supabaseAnonKey);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { userId, ...fields } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // Get user's auth token
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '') || '';
        const supabase = getClient(token);

        // Build update fields — map full_name to name (DB might have 'name' column)
        const updateFields: any = { ...fields };
        if (updateFields.full_name) {
            updateFields.name = updateFields.full_name;
        }
        updateFields.updated_at = new Date().toISOString();

        // Convert year to integer (DB column is INTEGER)
        if (updateFields.year && typeof updateFields.year === 'string') {
            updateFields.year = yearToNum[updateFields.year] || null;
        }

        // Remove userId from fields (not a column)
        delete updateFields.userId;

        // Step 1: Try UPDATE (profile row already exists from signup trigger)
        const { data: updateData, error: updateError } = await supabase
            .from('profiles')
            .update(updateFields)
            .eq('id', userId)
            .select()
            .single();

        if (!updateError && updateData) {
            return NextResponse.json({ profile: fixYearForDisplay(updateData), success: true });
        }

        // Step 2: If update returned no rows (profile doesn't exist), try INSERT
        if (updateError?.code === 'PGRST116' || !updateData) {
            const insertFields = { id: userId, ...updateFields };
            const { data: insertData, error: insertError } = await supabase
                .from('profiles')
                .insert(insertFields)
                .select()
                .single();

            if (!insertError && insertData) {
                return NextResponse.json({ profile: fixYearForDisplay(insertData), success: true });
            }

            // If insert also fails, return the error
            console.error('Profile insert error:', insertError);
            return NextResponse.json({ error: insertError?.message || 'Failed to save' }, { status: 500 });
        }

        console.error('Profile update error:', updateError);
        return NextResponse.json({ error: updateError?.message || 'Failed to update profile' }, { status: 500 });
    } catch (error: any) {
        console.error('Profile API error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId is required' }, { status: 400 });
        }

        // GET doesn't need auth token - use anon key (SELECT policy: auth.uid() = id)
        // But we also try without auth for the onboarding check
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.replace('Bearer ', '') || '';
        const supabase = getClient(token || undefined);

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            // If RLS blocks the read, return null profile (triggers onboarding)
            if (error.code === '42501') {
                return NextResponse.json({ profile: null });
            }
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ profile: fixYearForDisplay(data) });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
