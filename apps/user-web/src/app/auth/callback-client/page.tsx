'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const RELAY_ROLES = new Set(['admin', 'shop_owner', 'staff']);
const ADMIN_PORTAL_BASE = (process.env.NEXT_PUBLIC_PRINT_SHOP_ADMIN_URL || '').replace(/\/$/, '');

/**
 * Single-domain mode for deployments.
 */
async function relayToAdmin(role: string) {
    if (ADMIN_PORTAL_BASE) {
        window.location.href = `${ADMIN_PORTAL_BASE}/`;
        return;
    }
    window.location.href = '/dashboard';
}

export default function CallbackClientPage() {
    const router = useRouter();
    const params = useSearchParams();

    useEffect(() => {
        const handleCallback = async () => {
            // The server-side callback may have passed role hint in query
            const roleHint = params.get('role');

            const redirectUser = async () => {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { router.replace('/auth/auth-code-error'); return; }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, is_onboarded')
                    .eq('id', user.id)
                    .single();

                const role = profile?.role || roleHint;

                if (!role) { router.replace('/auth/auth-code-error'); return; }

                // Admin / shop / staff in single-domain mode
                if (RELAY_ROLES.has(role)) {
                    await relayToAdmin(role);
                    return;
                }

                if (role === 'delivery_partner') {
                    router.replace('/dashboard/delivery');
                    return;
                }

                // Standard user — stay on port 3003
                if (!profile?.is_onboarded) {
                    router.replace('/onboarding');
                } else {
                    router.replace('/dashboard');
                }
            };

            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                await redirectUser();
            } else {
                // Wait for implicit session (hash-based OAuth)
                const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                    if (session) {
                        subscription.unsubscribe();
                        await redirectUser();
                    }
                });
                // Timeout fallback
                setTimeout(() => {
                    subscription.unsubscribe();
                    router.replace('/auth/auth-code-error');
                }, 6000);
            }
        };

        handleCallback();
    }, [router, params]);

    return (
        <div className="min-h-screen bg-[#07070f] flex items-center justify-center">
            <div className="flex flex-col items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 animate-pulse">
                    <span className="text-2xl font-black text-white italic">N</span>
                </div>
                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] animate-pulse">
                    Signing you in…
                </p>
            </div>
        </div>
    );
}
