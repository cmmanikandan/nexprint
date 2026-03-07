'use server';

import { adminSupabase } from '@/lib/admin-supabase';
import { revalidatePath } from 'next/cache';

export async function createShopAdmin(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;

    if (!email || !password || !fullName) {
        return { error: 'Missing required fields' };
    }

    // 1. Create User in Auth
    const { data: authUser, error: authError } = await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: fullName
        }
    });

    if (authError) {
        console.error('Auth Error:', authError);
        return { error: authError.message };
    }

    const userId = authUser.user.id;

    // 2. The trigger 'on_auth_user_created' in Supabase will create the profile automatically.
    // We need to wait a tiny bit or just update it if it exists.
    // But to be sure, we update the role to 'shop_owner'.

    const { error: profileError } = await adminSupabase
        .from('profiles')
        .update({
            role: 'shop_owner',
            full_name: fullName
        })
        .eq('id', userId);

    if (profileError) {
        console.error('Profile Update Error:', profileError);
        return { error: 'User created but failed to set role' };
    }

    revalidatePath('/dashboard/users');
    return { success: true };
}
