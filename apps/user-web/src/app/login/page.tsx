'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Printer, Mail, KeyRound, Eye, EyeOff,
    Loader2, ArrowLeft, ArrowRight, CheckCircle2,
    Users, Shield, Store, Bike, User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ADMIN_URL = 'http://localhost:3001';
const RELAY_ROLES = new Set(['admin', 'shop_owner', 'staff']);

async function redirectWithRelay(role: string) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Could not retrieve session tokens.');
    const relay = new URL(`${ADMIN_URL}/auth/relay`);
    relay.searchParams.set('access_token', session.access_token);
    relay.searchParams.set('refresh_token', session.refresh_token);
    relay.searchParams.set('role', role);
    window.location.href = relay.toString();
}

type Mode = 'choose' | 'admin-login' | 'reset-sent';

export default function LoginPage() {
    const [mode, setMode] = useState<Mode>('choose');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resetSent, setResetSent] = useState(false);

    /* ── Auto-redirect if already logged in ──────────────── */
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                if (profile?.role) {
                    if (RELAY_ROLES.has(profile.role)) {
                        redirectWithRelay(profile.role);
                    } else if (profile.role === 'delivery_partner') {
                        window.location.href = '/dashboard/delivery';
                    } else {
                        window.location.href = '/dashboard';
                    }
                }
            }
        };
        checkSession();
    }, []);

    /* ── Google OAuth — for customers ─────────────────────── */
    const handleGoogle = async () => {
        setLoading(true); setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: `${window.location.origin}/auth/callback` },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || 'Google sign-in failed.');
            setLoading(false);
        }
    };

    /* ── Email / Password — for admins & shop owners ──────── */
    const handleAdminLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); setError(null);
        try {
            const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password });

            if (authErr) {
                if (authErr.message?.toLowerCase().includes('invalid login credentials')) {
                    throw new Error('Wrong Email or Password. Please try again.');
                }
                throw authErr;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('role, is_onboarded')
                .eq('id', data.user.id)
                .single();

            const role = profile?.role;
            if (!role) { await supabase.auth.signOut(); throw new Error('Account not found in system.'); }

            // Customers shouldn't be using this form — redirect them appropriately
            if (role === 'user') {
                window.location.href = profile?.is_onboarded ? '/dashboard' : '/onboarding';
                return;
            }
            if (role === 'delivery_partner') {
                window.location.href = '/dashboard/delivery';
                return;
            }
            // Admin / shop — relay to port 3001
            if (RELAY_ROLES.has(role)) {
                await redirectWithRelay(role);
                return;
            }
            throw new Error('Unrecognised role.');
        } catch (err: any) {
            setError(err.message || 'Login failed. Check credentials.');
        } finally {
            setLoading(false);
        }
    };

    /* ── Forgot password ───────────────────────────────────── */
    const handleForgot = async () => {
        if (!email) { setError('Enter your email first.'); return; }
        setLoading(true); setError(null);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send reset email.');

            setResetSent(true);
        } catch (err: any) {
            setError(err.message || 'Failed to send reset email.');
        } finally {
            setLoading(false);
        }
    };

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

            {/* Back to home */}
            <a href="/" className="fixed top-6 left-6 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-all text-[9px] font-black uppercase tracking-widest group z-50">
                <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                Back to Home
            </a>

            <motion.div initial={{ opacity: 0, y: 30, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.7 }}
                className="w-full max-w-md relative">
                <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-br from-blue-600/15 to-violet-600/8 blur-3xl scale-95 -z-10" />
                <div className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-[2.5rem] p-10 overflow-hidden relative shadow-2xl">
                    <div className="absolute -top-20 -right-20 w-48 h-48 bg-blue-600/12 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-violet-600/8 rounded-full blur-3xl pointer-events-none" />

                    {/* Logo */}
                    <div className="text-center mb-8 relative z-10">
                        <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 6 }}
                            className="inline-flex w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 items-center justify-center mb-4 shadow-2xl shadow-blue-500/30">
                            <Printer className="w-6 h-6 text-white" strokeWidth={2} />
                        </motion.div>
                        <h1 className="text-3xl font-black text-white tracking-tight">NexPrint</h1>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.25em] mt-1">Sign in to continue</p>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                        {error && (
                            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-2.5">
                                <span className="text-red-400 flex-shrink-0">⚠</span>
                                <p className="text-[11px] font-bold text-red-300 leading-relaxed">{error}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence mode="wait">

                        {/* ── MODE: Choose ───────────────────────────────── */}
                        {mode === 'choose' && !resetSent && (
                            <motion.div key="choose" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}
                                className="space-y-4 relative z-10">

                                {/* Customer — Google */}
                                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.07]">
                                    <div className="flex items-center gap-2.5 mb-4">
                                        <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center">
                                            <Users className="w-3.5 h-3.5 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Customer Login</p>
                                            <p className="text-[8px] text-white/30 font-bold">Students, Faculty & Public</p>
                                        </div>
                                    </div>
                                    <button onClick={handleGoogle} disabled={loading}
                                        className="relative flex items-center justify-center gap-3 w-full py-3.5 rounded-xl border border-white/[0.10] bg-white/[0.05] hover:bg-white/[0.09] hover:border-white/[0.18] transition-all group overflow-hidden disabled:opacity-50">
                                        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12" />
                                        {loading
                                            ? <Loader2 className="w-5 h-5 text-white/40 animate-spin" />
                                            : <>
                                                <svg className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                                </svg>
                                                <span className="text-[11px] font-black text-white/70 group-hover:text-white tracking-wide transition-colors">Continue with Google</span>
                                            </>
                                        }
                                    </button>
                                </div>

                                {/* Divider */}
                                <div className="flex items-center gap-3">
                                    <div className="h-px flex-1 bg-white/[0.05]" />
                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">admin access</span>
                                    <div className="h-px flex-1 bg-white/[0.05]" />
                                </div>

                                {/* Role Access Grid */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => { setMode('admin-login'); setError(null); }}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:border-violet-500/30 hover:bg-white/[0.06] transition-all group">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Shield className="w-4 h-4 text-white" />
                                        </div>
                                        <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Super Admin</p>
                                    </button>
                                    <button onClick={() => { setMode('admin-login'); setError(null); }}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:border-blue-500/30 hover:bg-white/[0.06] transition-all group">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Store className="w-4 h-4 text-white" />
                                        </div>
                                        <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Shop Admin</p>
                                    </button>
                                    <button onClick={() => { setMode('admin-login'); setError(null); }}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:border-emerald-500/30 hover:bg-white/[0.06] transition-all group">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                        <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Shop Staff</p>
                                    </button>
                                    <button onClick={() => { setMode('admin-login'); setError(null); }}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl border border-white/[0.06] bg-white/[0.03] hover:border-orange-500/30 hover:bg-white/[0.06] transition-all group">
                                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <Bike className="w-4 h-4 text-white" />
                                        </div>
                                        <p className="text-[9px] font-black text-white/60 uppercase tracking-widest">Delivery Man</p>
                                    </button>
                                </div>

                                <p className="text-center text-[9px] font-black text-white/20 uppercase tracking-widest pt-1">
                                    New customer?{' '}
                                    <a href="/signup" className="text-blue-400/60 hover:text-blue-400 transition-colors">Create account →</a>
                                </p>
                            </motion.div>
                        )}

                        {/* ── MODE: Admin email/password form ────────────── */}
                        {mode === 'admin-login' && !resetSent && (
                            <motion.div key="admin-login" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.3 }}
                                className="space-y-4 relative z-10">

                                <button type="button" onClick={() => { setMode('choose'); setError(null); }}
                                    className="flex items-center gap-1.5 text-[9px] font-black text-white/30 hover:text-white/60 uppercase tracking-widest transition-colors group">
                                    <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                                    Back
                                </button>

                                {/* Badge */}
                                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                                    <div className="flex gap-1.5">
                                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"><Shield className="w-3 h-3 text-white" /></div>
                                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center"><Store className="w-3 h-3 text-white" /></div>
                                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center"><User className="w-3 h-3 text-white" /></div>
                                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center"><Bike className="w-3 h-3 text-white" /></div>
                                    </div>
                                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Unified Portal Access</p>
                                </div>

                                <form onSubmit={handleAdminLogin} className="space-y-3">
                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Email Address</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors"><Mail className="w-4 h-4" /></div>
                                            <input id="admin-email" type="email" required placeholder="admin@email.com" value={email} onChange={e => setEmail(e.target.value)}
                                                className="w-full pl-11 pr-5 py-4 rounded-2xl border border-white/[0.08] bg-white/[0.05] focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all text-sm font-medium placeholder:text-white/15 text-white" />
                                        </div>
                                    </div>
                                    {/* Password */}
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] ml-1">Password</label>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-blue-400 transition-colors"><KeyRound className="w-4 h-4" /></div>
                                            <input id="admin-password" type={showPass ? 'text' : 'password'} required placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)}
                                                className="w-full pl-11 pr-12 py-4 rounded-2xl border border-white/[0.08] bg-white/[0.05] focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all text-sm font-medium placeholder:text-white/15 text-white" />
                                            <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition-colors">
                                                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    {/* Forgot */}
                                    <div className="flex justify-end">
                                        <button type="button" onClick={handleForgot} disabled={loading} className="text-[10px] font-black text-blue-400/50 hover:text-blue-400 uppercase tracking-widest transition-colors disabled:opacity-40">
                                            Forgot Password?
                                        </button>
                                    </div>
                                    {/* Submit */}
                                    <button type="submit" disabled={loading}
                                        className="relative w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] text-white overflow-hidden group disabled:opacity-50">
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:from-blue-500 group-hover:to-indigo-500 transition-all" />
                                        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12" />
                                        <span className="relative flex items-center justify-center gap-2">
                                            {loading
                                                ? <><Loader2 className="w-4 h-4 animate-spin opacity-70" /> Signing In…</>
                                                : <><ArrowRight className="w-4 h-4" /> Sign In</>
                                            }
                                        </span>
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* ── MODE: Reset sent ───────────────────────────── */}
                        {resetSent && (
                            <motion.div key="reset" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                className="text-center space-y-5 relative z-10 py-4">
                                <div className="inline-flex w-16 h-16 bg-emerald-500/15 border border-emerald-500/20 rounded-2xl items-center justify-center">
                                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-white">Check Your Inbox</h2>
                                    <p className="text-sm text-white/40 mt-2 leading-relaxed">
                                        Reset link sent to<br /><span className="font-black text-white/70">{email}</span>
                                    </p>
                                </div>
                                <button onClick={() => { setResetSent(false); setMode('admin-login'); }}
                                    className="w-full py-3 bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white/70 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all">
                                    ← Back to Login
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Space for layout consistency */}
                    {!resetSent && (
                        <div className="mt-4" />
                    )}
                </div>
            </motion.div>
        </div>
    );
}
