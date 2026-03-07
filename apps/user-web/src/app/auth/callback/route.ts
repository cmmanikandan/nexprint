import { NextResponse } from 'next/server'

const ADMIN_URL = 'http://localhost:3001';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    if (code) {
        const { createServerClient } = await import('@supabase/ssr')
        const { cookies } = await import('next/headers')
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
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, is_onboarded')
                    .eq('id', user.id)
                    .single()

                const role = profile?.role;

                // Admin / Shop roles need session relay to port 3001
                // We redirect to a client-side relay page that grabs tokens and passes them
                if (role === 'admin' || role === 'shop_owner' || role === 'staff') {
                    // Go to client relay handler on port 3003, which will do the token handoff
                    return NextResponse.redirect(`${origin}/auth/callback-client?role=${role}`)
                }

                if (role === 'delivery_partner') {
                    return NextResponse.redirect(`${origin}/dashboard/delivery`)
                }

                // Standard user
                if (!profile?.is_onboarded) {
                    return NextResponse.redirect(`${origin}/onboarding`)
                }

                return NextResponse.redirect(`${origin}/dashboard`)
            }
        }
    }

    // No code — implicit flow handled client-side
    return NextResponse.redirect(`${origin}/auth/callback-client`)
}
