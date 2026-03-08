'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2, AlertCircle, RefreshCcw, XCircle } from 'lucide-react';

/**
 * Auth Relay Page — port 3001
 *
 * When a user logs in on port 3003 (user-web / unified landing),
 * their Supabase session lives in 3003's localStorage.
 * Port 3001 (print-shop-admin) has its own isolated localStorage.
 *
 * This page:
 *  1. Receives access_token + refresh_token via URL query params
 *  2. Calls supabase.auth.setSession() to hydrate 3001's localStorage
 *  3. Validates the role (admin / shop_owner / staff only)
 *  4. Redirects to the correct dashboard
 */
export default function AuthRelay() {
    const params = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'error'>('loading');
    const [errorMsg, setErrorMsg] = useState('');

    const run = async () => {
        setStatus('loading');
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const roleHint = params.get('role');

        if (!accessToken || !refreshToken) {
            setErrorMsg('Missing authentication tokens. Please sign in again.');
            setStatus('error');
            return;
        }

        try {
            // Hydrate this app's (3001) Supabase localStorage with the session from 3003
            console.log(' Establishing relay session...');
            const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
            });

            if (error || !data.session) {
                throw new Error(error?.message || 'Failed to establish session.');
            }

            // Wait a bit longer for session persistence
            await new Promise(r => setTimeout(r, 800));

            // Double check we actually have a user in memory now
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('Session established but user could not be retrieved from memory. Please retry.');
            }

            // Double-check role from DB
            let { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profileError) {
                // Try one more time with a slightly different approach if it's a network error
                if (profileError.message?.includes('fetch') || !profileError.code) {
                    await new Promise(r => setTimeout(r, 1000));
                    const retry = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('id', user.id)
                        .single();
                    profile = retry.data;
                    profileError = retry.error;
                }
            }

            if (profileError) {
                throw new Error(`Profile check failed: ${profileError.message} (Code: ${profileError.code || 'NO_CODE'})`);
            }

            if (profile?.role === 'admin') {
                window.location.replace('/admin/dashboard');
            } else if (profile?.role === 'shop_owner' || profile?.role === 'staff') {
                window.location.replace('/dashboard');
            } else {
                const detectedRole = profile?.role || 'null';
                await supabase.auth.signOut();
                throw new Error(`Access denied. Your role is "${detectedRole}". This portal is for Admins & Shop Owners only.`);
            }
        } catch (err: any) {
            console.error('Relay error:', err);
            setErrorMsg(err.message || 'Authentication failed.');
            setStatus('error');
        }
    };

    useEffect(() => {
        run();
    }, [params]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-outfit">
                <div className="text-center space-y-4">
                    <div className="inline-flex w-14 h-14 rounded-2xl bg-slate-900 items-center justify-center shadow-xl mx-auto">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                            Synchronizing Hub Node…
                        </p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">Cross-Port State Transfer</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6 font-outfit">
            <div className="w-full max-w-sm bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />

                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                    <AlertCircle size={40} strokeWidth={2.5} />
                </div>

                <h1 className="text-xl font-black text-slate-900 tracking-tight">Security Handshake Failed</h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 mb-6 leading-relaxed">
                    Identity validation encountered a {errorMsg.includes('Network') ? 'Network' : 'System'} error
                </p>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-8">
                    <p className="text-[10px] font-black text-slate-600 leading-relaxed text-left">
                        <span className="text-slate-400 block mb-1">REASON:</span>
                        {errorMsg}
                    </p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => run()}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10"
                    >
                        <RefreshCcw size={14} />
                        Attempt Re-Synchronize
                    </button>

                    <a
                        href="/"
                        className="flex items-center justify-center gap-2 w-full py-4 bg-white border border-slate-200 text-slate-400 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all"
                    >
                        <XCircle size={14} />
                        Abort to Sign In
                    </a>
                </div>

                <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em] mt-8">
                    Terminal Node Relay System v2.0
                </p>
            </div>
        </div>
    );
}
