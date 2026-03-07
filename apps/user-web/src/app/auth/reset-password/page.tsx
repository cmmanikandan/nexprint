'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Shield, CheckCircle2, Loader2, Eye, EyeOff, Printer } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

function ResetPasswordForm() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sessionReady, setSessionReady] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Supabase picks up the token from the URL automatically
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setSessionReady(true);
            } else {
                // If no session, wait a bit for it to be processed from hash
                setTimeout(async () => {
                    const { data: { session: retrySession } } = await supabase.auth.getSession();
                    if (retrySession) setSessionReady(true);
                    else setError("Invalid or expired reset link. Please request a new one.");
                }, 1000);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
                setSessionReady(true);
            }
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
            setTimeout(() => router.push('/login'), 2500);
        } catch (err: any) {
            setError(err.message || 'Failed to set password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md relative">
            <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-blue-600/15 to-violet-600/8 blur-3xl scale-95 -z-10" />
            <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-[2.5rem] p-10 overflow-hidden relative shadow-2xl">

                <div className="text-center mb-8">
                    <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 6 }}
                        className={`inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4 shadow-2xl ${done ? 'bg-emerald-500' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                        {done
                            ? <CheckCircle2 className="text-white w-8 h-8" />
                            : <Printer className="text-white w-8 h-8" strokeWidth={2} />
                        }
                    </motion.div>
                    <h1 className="text-3xl font-black text-white tracking-tight">
                        {done ? 'Success!' : 'Secure Account'}
                    </h1>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em] mt-1">
                        {done ? 'Password updated successfully' : 'Set your new password'}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {done ? (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-4 py-4">
                            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
                            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Redirecting to login portal…</p>
                        </motion.div>
                    ) : !sessionReady && !error ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                            <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">Verifying security token…</p>
                        </motion.div>
                    ) : (
                        <motion.form initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSetPassword} className="space-y-4 relative z-10">
                            {error && (
                                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2.5">
                                    <span className="text-red-400 flex-shrink-0">⚠</span>
                                    <p className="text-[11px] font-bold text-red-300 leading-relaxed">{error}</p>
                                </div>
                            )}

                            {!error && (
                                <>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">New Password</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors"><Shield className="w-4 h-4" /></div>
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                required
                                                minLength={6}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                                className="w-full pl-11 pr-12 py-4 rounded-2xl border border-white/[0.08] bg-white/[0.05] focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all text-sm font-medium placeholder:text-white/15 text-white"
                                            />
                                            <button type="button" onClick={() => setShowPassword(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    <button type="submit" disabled={loading}
                                        className="relative w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-white overflow-hidden group disabled:opacity-50 shadow-2xl shadow-blue-500/10 mt-2">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:from-blue-500 group-hover:to-indigo-500 transition-all" />
                                        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12" />
                                        <span className="relative flex items-center justify-center gap-2">
                                            {loading
                                                ? <><Loader2 className="w-4 h-4 animate-spin opacity-70" /> Updating Engine…</>
                                                : <><CheckCircle2 className="w-4 h-4" /> Save New Password</>
                                            }
                                        </span>
                                    </button>
                                </>
                            )}

                            {error && (
                                <button onClick={() => router.push('/login')} className="w-full py-3 bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white/70 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all">
                                    Return to Login
                                </button>
                            )}
                        </motion.form>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-[#07070f] font-outfit flex items-center justify-center p-6 relative overflow-hidden selection:bg-blue-500 selection:text-white">
            {/* Orbs */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[140px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-700/10 blur-[120px]" />
            </div>
            {/* Grid */}
            <div className="fixed inset-0 -z-10 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize: '60px 60px' }} />

            <Suspense fallback={<Loader2 className="animate-spin text-white/20" />}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
