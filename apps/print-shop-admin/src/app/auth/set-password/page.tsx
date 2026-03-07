'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Shield, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react';

export default function SetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('CMMANI02');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Supabase puts the access token in the URL hash when coming from a reset link
        // The client library automatically picks it up via onAuthStateChange
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
                setSessionReady(true);
            }
        });

        // Also check for existing session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) setSessionReady(true);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.updateUser({ password });
            if (error) throw error;
            setDone(true);
            setTimeout(() => router.push('/'), 2500);
        } catch (err: any) {
            setError(err.message || 'Failed to set password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 font-outfit">
            <div className="w-full max-w-sm bg-white rounded-[2.5rem] shadow-xl p-10 border border-slate-100">

                <div className="text-center mb-8">
                    <div className={`inline-flex w-20 h-20 rounded-[2rem] items-center justify-center mb-5 shadow-2xl ${done ? 'bg-emerald-500' : 'bg-slate-900'}`}>
                        {done
                            ? <CheckCircle2 className="text-white" size={38} />
                            : <Shield className="text-white" size={38} strokeWidth={2.5} />
                        }
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                        {done ? 'Password Set!' : 'Set Your Password'}
                    </h1>
                    <p className="text-sm text-slate-400 mt-2">
                        {done
                            ? 'Redirecting to login...'
                            : 'Enter your new password below'}
                    </p>
                </div>

                {done ? (
                    <div className="text-center py-4">
                        <div className="w-8 h-8 border-4 border-emerald-100 border-t-emerald-500 rounded-full animate-spin mx-auto" />
                        <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mt-3">Redirecting to login...</p>
                    </div>
                ) : !sessionReady ? (
                    <div className="text-center py-8">
                        <Loader2 size={32} className="animate-spin text-slate-300 mx-auto mb-4" />
                        <p className="text-sm text-slate-400 font-medium">Validating reset link...</p>
                        <p className="text-xs text-slate-300 mt-2">Make sure you opened the link from your email</p>
                    </div>
                ) : (
                    <form onSubmit={handleSetPassword} className="space-y-4">
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-100 text-[10px] font-bold text-red-600 rounded-2xl text-center">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    minLength={6}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-sm font-medium pr-12"
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            <p className="text-[9px] text-slate-300 mt-1.5 px-1">Pre-filled with: CMMANI02</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-slate-900 text-white text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-800 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 mt-2"
                        >
                            {loading
                                ? <><Loader2 size={16} className="animate-spin opacity-70" /> Saving...</>
                                : 'Save Password'
                            }
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
