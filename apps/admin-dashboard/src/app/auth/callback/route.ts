import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

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
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single()

                // Port 3002: ONLY super admin
                if (profile?.role === 'admin') {
                    return NextResponse.redirect(`${origin}/dashboard`)
                } else {
                    // Keep unauthorized users inside this app and show local login error.
                    await supabase.auth.signOut()
                    return NextResponse.redirect(`${origin}/?error=unauthorized`)
                }
            }
        }
    }

    return NextResponse.redirect(`${origin}/dashboard`)
}
