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
                } else if (profile?.role === 'shop_owner') {
                    // Belongs to shop portal
                    return NextResponse.redirect('http://localhost:3001/dashboard')
                } else {
                    // Everyone else (user, delivery_partner): kicked to user web
                    await supabase.auth.signOut()
                    return NextResponse.redirect('http://localhost:3003/login?error=unauthorized')
                }
            }
        }
    }

    return NextResponse.redirect(`${origin}/dashboard`)
}
