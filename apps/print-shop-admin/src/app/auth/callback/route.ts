import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const type = searchParams.get('type') // 'recovery' for password reset links

    if (code) {
        const cookieStore = await cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) { return cookieStore.get(name)?.value },
                    set(name: string, value: string, options: any) { cookieStore.set({ name, value, ...options }) },
                    remove(name: string, options: any) { cookieStore.delete({ name, ...options }) },
                },
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // If this is a password recovery flow, redirect to set-password page
            if (type === 'recovery') {
                return NextResponse.redirect(`${origin}/auth/set-password`)
            }

            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                // Route based on role — all on same port now
                if (profile?.role === 'admin') {
                    return NextResponse.redirect(`${origin}/admin/dashboard`)
                } else if (profile?.role === 'shop_owner' || profile?.role === 'staff') {
                    return NextResponse.redirect(`${origin}/dashboard`)
                } else {
                    await supabase.auth.signOut()
                    return NextResponse.redirect(`${origin}/?error=unauthorized`)
                }
            }
        }
    }

    // Default: if it looks like a recovery token in the hash (client-side), go to set-password
    if (searchParams.get('next') === '/auth/set-password') {
        return NextResponse.redirect(`${origin}/auth/set-password`)
    }

    return NextResponse.redirect(`${origin}/`)
}
