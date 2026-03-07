'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Truck, CheckCircle2, Phone, MapPin, Clock,
    RefreshCw, Box, Zap, ShieldCheck, LogOut,
    Package, ArrowRight, Navigation, AlertCircle,
    User, IndianRupee, Star, X, FileText, Wifi, WifiOff,
    Bell, BarChart2, MessageSquare, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

type Tab = 'available' | 'active' | 'earnings' | 'profile';

export default function DeliveryHubPage() {
    const router = useRouter();
    const [profile, setProfile] = useState<any>(null);
    const [jobs, setJobs] = useState<any[]>([]);
    const [myJobs, setMyJobs] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [stats, setStats] = useState({ today: 0, week: 0, month: 0, total: 0, weekDays: Array(7).fill(0) });
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>('available');
    const [otp, setOtp] = useState<Record<string, string>>({});
    const [busy, setBusy] = useState<string | null>(null);
    const [toast, setToast] = useState<{ msg: string; type: 'ok' | 'err' } | null>(null);
    const [loginForm, setLoginForm] = useState({ email: '', password: '' });
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [authChecked, setAuthChecked] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [expandedJob, setExpandedJob] = useState<string | null>(null);
    const [newJobAlert, setNewJobAlert] = useState(false);
    const prevJobCount = useRef(0);

    const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    // ── Auth check ──────────────────────────────────────────────
    useEffect(() => {
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!session) { setAuthChecked(true); return; }
            const { data: prof } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            // Allow delivery_partner role OR any user who wants to act as one
            if (prof) {
                setProfile(prof);
                setIsLoggedIn(true);
            }
            setAuthChecked(true);
        });
    }, []);

    // ── Login handler ────────────────────────────────────────────
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoginError('');
        setLoginLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: loginForm.email,
                password: loginForm.password,
            });
            if (error) throw error;
            const { data: prof } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', data.user.id)
                .single();
            setProfile(prof);
            setIsLoggedIn(true);
        } catch (err: any) {
            setLoginError(err.message || 'Login failed');
        } finally {
            setLoginLoading(false);
        }
    };

    // ── Fetch orders ─────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        if (!profile) return;

        const { data: available } = await supabase
            .from('orders')
            .select('*, print_shops(name, address, phone), profiles!user_id(full_name, phone)')
            .eq('delivery_needed', true)
            .in('status', ['ready_for_pickup', 'shop_accepted', 'printing', 'completed'])
            .is('delivery_partner_id', null)
            .order('created_at', { ascending: false });

        const { data: active } = await supabase
            .from('orders')
            .select('*, print_shops(name, address, phone), profiles!user_id(full_name, phone)')
            .eq('delivery_partner_id', profile.id)
            .not('delivery_status', 'eq', 'delivered');

        const { data: done } = await supabase
            .from('orders')
            .select('*')
            .eq('delivery_partner_id', profile.id)
            .eq('delivery_status', 'delivered')
            .order('created_at', { ascending: false })
            .limit(30);

        if (done) {
            const now = new Date();
            const todayStr = now.toISOString().split('T')[0];
            const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 7);
            const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 30);

            // Build 7-day bar chart data
            const weekDays = Array(7).fill(0);
            done.filter(o => new Date(o.created_at) > weekAgo).forEach(o => {
                const dayDiff = Math.floor((now.getTime() - new Date(o.created_at).getTime()) / 86400000);
                if (dayDiff < 7) weekDays[6 - dayDiff] += (o.delivery_fee || 30);
            });

            setStats({
                today: done.filter(o => o.created_at?.startsWith(todayStr)).reduce((s, o) => s + (o.delivery_fee || 30), 0),
                week: done.filter(o => new Date(o.created_at) > weekAgo).reduce((s, o) => s + (o.delivery_fee || 30), 0),
                month: done.filter(o => new Date(o.created_at) > monthAgo).reduce((s, o) => s + (o.delivery_fee || 30), 0),
                total: done.length,
                weekDays,
            });
            setHistory(done.slice(0, 15));
        }

        const newJobs = available || [];
        if (prevJobCount.current > 0 && newJobs.length > prevJobCount.current) {
            setNewJobAlert(true);
            setTimeout(() => setNewJobAlert(false), 5000);
        }
        prevJobCount.current = newJobs.length;

        setJobs(newJobs);
        setMyJobs(active || []);
        setLoading(false);
    }, [profile]);

    useEffect(() => {
        if (isLoggedIn && profile) {
            fetchData();
            const interval = setInterval(fetchData, 12000);

            // Supabase Realtime — instant new order alerts
            const channel = supabase.channel('delivery-hub-orders')
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' },
                    (payload) => {
                        if (payload.new?.delivery_needed) {
                            fetchData();
                            showToast('🆕 New delivery job available!', 'ok');
                        }
                    }
                )
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' },
                    () => fetchData()
                )
                .subscribe();

            return () => {
                clearInterval(interval);
                supabase.removeChannel(channel);
            };
        }
    }, [isLoggedIn, profile, fetchData]);

    // ── Job status update ────────────────────────────────────────
    const updateJob = async (jobId: string, status: string, orderOtp?: string) => {
        if (status === 'delivered') {
            // Skip OTP check if order has no otp_code set, otherwise verify
            if (orderOtp && otp[jobId] !== orderOtp) {
                showToast('❌ Wrong OTP. Ask the customer for the correct code.', 'err');
                return;
            }
        }
        setBusy(jobId);
        try {
            const updateData: any = { delivery_status: status };
            if (status === 'accepted') updateData.delivery_partner_id = profile.id;
            if (status === 'rejected') {
                updateData.delivery_partner_id = null;
                updateData.delivery_status = null;
            }
            if (status === 'picked_up') updateData.status = 'printing';
            if (status === 'delivered') updateData.status = 'completed';

            const { error } = await supabase.from('orders').update(updateData).eq('id', jobId);
            if (error) throw error;

            showToast(
                status === 'accepted' ? '✅ Mission accepted!' :
                    status === 'rejected' ? '↩️ Job released back to pool.' :
                        status === 'picked_up' ? '📦 Picked up! Head to customer.' :
                            '🎉 Delivered! Great job, +₹' + (jobs.find(j => j.id === jobId)?.delivery_fee || 30),
                'ok'
            );
            fetchData();
        } catch (err: any) {
            showToast(err.message || 'Error updating order', 'err');
        } finally {
            setBusy(null);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setProfile(null);
    };

    // ── Guard: show login if not authenticated ───────────────────
    if (!authChecked) {
        return (
            <div className="min-h-screen bg-[#0A0D12] flex items-center justify-center">
                <RefreshCw size={28} className="text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-[#0A0D12] flex items-center justify-center px-6">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm space-y-8"
                >
                    {/* Brand */}
                    <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-blue-600 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30">
                            <Truck size={30} className="text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-white tracking-tight">Delivery Hub</h1>
                            <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.3em] mt-1">
                                NexPrint Partner Portal
                            </p>
                        </div>
                    </div>

                    {/* Login form */}
                    <form onSubmit={handleLogin} className="bg-white/[0.04] border border-white/[0.08] rounded-[2rem] p-8 space-y-5">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Email</label>
                            <input
                                type="email"
                                required
                                value={loginForm.email}
                                onChange={e => setLoginForm(f => ({ ...f, email: e.target.value }))}
                                placeholder="partner@nexprint.cloud"
                                className="w-full px-5 py-4 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-sm font-bold text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Password</label>
                            <input
                                type="password"
                                required
                                value={loginForm.password}
                                onChange={e => setLoginForm(f => ({ ...f, password: e.target.value }))}
                                placeholder="••••••••"
                                className="w-full px-5 py-4 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-sm font-bold text-white outline-none focus:border-blue-500 transition-all placeholder:text-slate-700"
                            />
                        </div>

                        {loginError && (
                            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                                <p className="text-[10px] font-bold text-red-400">{loginError}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loginLoading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loginLoading ? <RefreshCw size={14} className="animate-spin" /> : <><Truck size={14} /> Sign In to Hub</>}
                        </button>
                    </form>

                    <p className="text-center text-[9px] font-bold text-slate-700 uppercase tracking-widest">
                        NexPrint Delivery Partner Portal v2.0
                    </p>
                </motion.div>
            </div>
        );
    }

    // ── Main portal ──────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-[#0A0D12] text-slate-300 pb-32">
            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl text-xs font-black shadow-2xl border ${toast.type === 'ok'
                            ? 'bg-emerald-900/80 border-emerald-500/30 text-emerald-300'
                            : 'bg-red-900/80 border-red-500/30 text-red-300'
                            } backdrop-blur-xl`}
                    >
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header */}
            <header className="sticky top-0 z-50 bg-slate-900/60 backdrop-blur-xl border-b border-white/5 px-6 py-5">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                                <Truck size={20} className="text-white" />
                            </div>
                            {newJobAlert && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-black text-white leading-none">{profile?.full_name || 'Partner'}</p>
                            <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${isOnline ? 'text-emerald-400' : 'text-slate-600'}`}>
                                Delivery Hub · {isOnline ? 'Online' : 'Offline'}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Online toggle */}
                        <button
                            onClick={() => setIsOnline(v => !v)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${isOnline
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-white/5 border-white/10 text-slate-500'
                                }`}
                        >
                            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
                            {isOnline ? 'Online' : 'Offline'}
                        </button>
                        <button onClick={fetchData} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5">
                            <RefreshCw size={15} className="text-slate-400" />
                        </button>
                        <button onClick={handleLogout} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-all border border-red-500/20">
                            <LogOut size={15} className="text-red-400" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="max-w-3xl mx-auto mt-5">
                    <div className="flex gap-1.5 p-1.5 bg-black/30 rounded-2xl border border-white/5">
                        {([
                            { key: 'available', label: `Available (${jobs.length})` },
                            { key: 'active', label: `My Runs (${myJobs.length})` },
                            { key: 'earnings', label: 'Earnings' },
                            { key: 'profile', label: 'Me' },
                        ] as { key: Tab; label: string }[]).map(t => (
                            <button
                                key={t.key}
                                onClick={() => setTab(t.key)}
                                className={`flex-1 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${tab === t.key ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 pt-6 space-y-4">
                <AnimatePresence mode="wait">

                    {/* ── AVAILABLE JOBS ──────────────────────────────── */}
                    {tab === 'available' && (
                        <motion.div key="available" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                            {loading && (
                                <div className="py-20 text-center">
                                    <RefreshCw size={28} className="mx-auto text-blue-500 animate-spin mb-3" />
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Scanning orders...</p>
                                </div>
                            )}
                            {!loading && jobs.length === 0 && (
                                <div className="py-24 text-center bg-white/[0.02] rounded-[3rem] border border-dashed border-white/5 space-y-4">
                                    <div className="text-4xl">📭</div>
                                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No deliveries available</p>
                                    <p className="text-[10px] font-bold text-slate-700">Check back in a few minutes</p>
                                </div>
                            )}
                            {!isOnline && (
                                <div className="py-12 text-center bg-slate-950 rounded-[2rem] border border-white/5 space-y-2">
                                    <WifiOff size={28} className="mx-auto text-slate-700" />
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">You're Offline</p>
                                    <p className="text-[9px] text-slate-700">Toggle to Online to accept jobs</p>
                                </div>
                            )}
                            {isOnline ? jobs.map(job => (
                                <motion.div
                                    key={job.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-slate-900 border border-white/5 rounded-[2.5rem] p-6 space-y-5 relative overflow-hidden"
                                >
                                    <div className="absolute top-0 right-0 w-28 h-28 bg-blue-600/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />

                                    {/* Top row */}
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Order</p>
                                            <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
                                                #{job.order_number?.slice(-8).toUpperCase()}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                {job.is_emergency && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/15 border border-red-500/25 rounded-full text-[8px] font-bold text-red-400 uppercase">
                                                        <Zap size={8} fill="currentColor" /> Express
                                                    </span>
                                                )}
                                                <span className="text-[8px] font-bold text-slate-600 uppercase">
                                                    {job.payment_method === 'cash_pickup' ? '💵 Cash' : '💳 Paid Online'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Your Fee</p>
                                            <p className="text-2xl font-black text-emerald-400 tracking-tight">₹{job.delivery_fee || 30}</p>
                                            <p className="text-[8px] text-slate-600 mt-0.5">
                                                {new Date(job.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Route */}
                                    <div className="space-y-2">
                                        <div className="flex items-start gap-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                                            <div className="w-7 h-7 bg-amber-500/15 text-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <Box size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-bold text-amber-500 uppercase tracking-widest">Pickup</p>
                                                <p className="text-sm font-bold text-slate-200">{job.print_shops?.name}</p>
                                                <p className="text-[10px] text-slate-500">{job.print_shops?.address}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                                            <div className="w-7 h-7 bg-blue-500/15 text-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
                                                <MapPin size={14} />
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest">Drop-off</p>
                                                <p className="text-sm font-bold text-slate-200">{job.delivery_address || 'Address on app'}</p>
                                                <p className="text-[10px] text-slate-500">Customer: {job.profiles?.full_name}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expandable order details */}
                                    <button
                                        onClick={() => setExpandedJob(expandedJob === job.id ? null : job.id)}
                                        className="w-full flex items-center justify-center gap-2 py-2 text-[9px] font-black text-slate-600 uppercase tracking-widest hover:text-slate-400 transition-all"
                                    >
                                        {expandedJob === job.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                                        {expandedJob === job.id ? 'Hide Details' : 'View Order Details'}
                                    </button>
                                    <AnimatePresence>
                                        {expandedJob === job.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="bg-black/30 border border-white/5 rounded-2xl p-4 space-y-2">
                                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-3">Order Summary</p>
                                                    {[
                                                        { label: 'Files', val: job.files?.length || job.total_files || '—' },
                                                        { label: 'Total Pages', val: job.total_pages || '—' },
                                                        { label: 'Total Amount', val: `₹${job.total_amount || 0}` },
                                                        { label: 'Shop Phone', val: job.print_shops?.phone || '—' },
                                                    ].map(r => (
                                                        <div key={r.label} className="flex justify-between">
                                                            <span className="text-[9px] font-bold text-slate-600 uppercase">{r.label}</span>
                                                            <span className="text-[9px] font-black text-slate-300">{String(r.val)}</span>
                                                        </div>
                                                    ))}
                                                    {job.delivery_notes && (
                                                        <div className="pt-2 border-t border-white/5">
                                                            <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mb-1">Notes</p>
                                                            <p className="text-[10px] text-slate-400">{job.delivery_notes}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* Buttons */}
                                    <div className="flex gap-2">
                                        {job.print_shops?.phone && (
                                            <a href={`tel:${job.print_shops.phone}`}
                                                className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-400 hover:text-emerald-400 transition-all">
                                                <Phone size={16} />
                                            </a>
                                        )}
                                        <button
                                            onClick={() => updateJob(job.id, 'accepted')}
                                            disabled={busy === job.id}
                                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                        >
                                            {busy === job.id ? <RefreshCw size={14} className="animate-spin" /> : <><ArrowRight size={14} /> Accept</>}
                                        </button>
                                    </div>
                                </motion.div>
                            )) : null}
                        </motion.div>
                    )}

                    {/* ── ACTIVE / MY RUNS ────────────────────────────── */}
                    {tab === 'active' && (
                        <motion.div key="active" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                            {myJobs.length === 0 && (
                                <div className="py-24 text-center bg-white/[0.02] rounded-[3rem] border border-dashed border-white/5 space-y-4">
                                    <div className="text-4xl">🚚</div>
                                    <p className="text-sm font-black text-slate-500 uppercase tracking-widest">No active deliveries</p>
                                    <p className="text-[10px] font-bold text-slate-700">Accept a mission from the Available tab</p>
                                </div>
                            )}
                            {myJobs.map(job => (
                                <motion.div
                                    key={job.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-slate-900 border-2 border-blue-500/20 rounded-[2.5rem] p-7 space-y-6 relative"
                                >
                                    {/* Header */}
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h3 className="text-lg font-black text-white">#{job.order_number?.slice(-8).toUpperCase()}</h3>
                                            <span className={`inline-block mt-1 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${job.delivery_status === 'accepted'
                                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                                                }`}>
                                                {job.delivery_status === 'accepted' ? '⏳ Accepted — Go Pickup' : '🚚 In Transit'}
                                            </span>
                                        </div>
                                        <div className="flex gap-2">
                                            {job.profiles?.phone && (
                                                <a href={`tel:${job.profiles.phone}`}
                                                    className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-400 hover:text-emerald-400 hover:border-emerald-500/20 transition-all">
                                                    <Phone size={16} />
                                                </a>
                                            )}
                                            {job.delivery_address && (
                                                <a
                                                    href={`https://maps.google.com/?q=${encodeURIComponent(job.delivery_address)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-3 bg-white/5 border border-white/5 rounded-2xl text-slate-400 hover:text-blue-400 hover:border-blue-500/20 transition-all"
                                                >
                                                    <Navigation size={16} />
                                                </a>
                                            )}
                                        </div>
                                    </div>

                                    {/* Step 1: Pickup */}
                                    <div className={`p-5 rounded-[1.5rem] border transition-all ${job.delivery_status === 'picked_up'
                                        ? 'bg-emerald-500/5 border-emerald-500/15 opacity-50'
                                        : 'bg-white/[0.03] border-white/5'
                                        }`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${job.delivery_status === 'picked_up' ? 'bg-emerald-500 text-white' : 'bg-blue-600 text-white'}`}>
                                                {job.delivery_status === 'picked_up' ? <CheckCircle2 size={16} /> : '01'}
                                            </div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Pickup from Shop</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-300">{job.print_shops?.name}</p>
                                        <p className="text-[10px] text-slate-600 mt-0.5">{job.print_shops?.address}</p>
                                        {job.delivery_status === 'accepted' && (
                                            <button
                                                onClick={() => updateJob(job.id, 'picked_up')}
                                                disabled={busy === job.id}
                                                className="mt-4 w-full py-3 bg-white text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                {busy === job.id ? <RefreshCw size={13} className="animate-spin" /> : <><Package size={13} /> Confirm Pickup</>}
                                            </button>
                                        )}
                                    </div>

                                    {/* Step 2: Deliver with OTP */}
                                    <div className={`p-5 rounded-[1.5rem] border transition-all ${job.delivery_status === 'accepted'
                                        ? 'opacity-25 pointer-events-none grayscale bg-white/[0.02] border-white/5'
                                        : 'bg-blue-500/5 border-blue-500/15'
                                        }`}>
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-black">02</div>
                                            <p className="text-[10px] font-black text-white uppercase tracking-widest">Deliver to Customer</p>
                                        </div>
                                        <p className="text-sm font-bold text-slate-300">{job.delivery_address}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">Customer: {job.profiles?.full_name}</p>
                                        {job.profiles?.phone && (
                                            <a href={`tel:${job.profiles.phone}`} className="inline-flex items-center gap-1.5 mt-2 text-[9px] font-bold text-emerald-400 hover:text-emerald-300">
                                                <Phone size={11} /> Call Customer
                                            </a>
                                        )}
                                        {job.delivery_notes && (
                                            <div className="mt-3 p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                                                <p className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mb-1">📝 Instructions</p>
                                                <p className="text-[10px] text-slate-400">{job.delivery_notes}</p>
                                            </div>
                                        )}

                                        {job.delivery_status === 'picked_up' && (
                                            <div className="mt-4 space-y-3">
                                                <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <ShieldCheck size={12} className="text-emerald-400" />
                                                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Enter Delivery OTP</p>
                                                    </div>
                                                    <p className="text-[8px] text-slate-600 mb-2">Ask customer for the OTP shown in their app</p>
                                                    <input
                                                        type="number"
                                                        placeholder="e.g. 4821"
                                                        value={otp[job.id] || ''}
                                                        onChange={e => setOtp({ ...otp, [job.id]: e.target.value })}
                                                        className="w-full bg-white/5 border border-white/10 focus:border-emerald-500 rounded-xl px-4 py-3 text-2xl font-black text-white text-center tracking-[0.5em] outline-none transition-all"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => updateJob(job.id, 'delivered', job.otp_code)}
                                                    disabled={!otp[job.id] || busy === job.id}
                                                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
                                                >
                                                    {busy === job.id
                                                        ? <RefreshCw size={14} className="animate-spin" />
                                                        : <><CheckCircle2 size={14} /> Mark as Delivered</>}
                                                </button>
                                                {/* Navigation button */}
                                                {job.delivery_address && (
                                                    <a
                                                        href={`https://maps.google.com/?q=${encodeURIComponent(job.delivery_address)}`}
                                                        target="_blank" rel="noopener noreferrer"
                                                        className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/5 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest hover:bg-white/10 transition-all"
                                                    >
                                                        <Navigation size={13} /> Open in Maps
                                                    </a>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Reject job button */}
                                    {job.delivery_status === 'accepted' && (
                                        <button
                                            onClick={() => updateJob(job.id, 'rejected')}
                                            disabled={busy === job.id}
                                            className="w-full py-2 text-[8px] font-black text-red-700 hover:text-red-400 uppercase tracking-widest transition-all"
                                        >
                                            &larr; Cancel &amp; Release Job
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {/* ── EARNINGS ─────────────────────────────────────── */}
                    {tab === 'earnings' && (
                        <motion.div key="earnings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Today', value: stats.today, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/15' },
                                    { label: 'This Week', value: stats.week, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/15' },
                                    { label: 'This Month', value: stats.month, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/15' },
                                    { label: 'Completed', value: stats.total, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/15', suffix: 'jobs' },
                                ].map(s => (
                                    <div key={s.label} className={`p-6 rounded-[2rem] border ${s.bg} space-y-1`}>
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{s.label}</p>
                                        <p className={`text-2xl font-black ${s.color} tracking-tight`}>
                                            {s.suffix ? s.value : `₹${s.value}`}
                                            {s.suffix && <span className="text-sm ml-1">{s.suffix}</span>}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-3">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">7-Day Earnings Chart</p>
                                <div className="bg-slate-900 border border-white/5 rounded-[2rem] p-5">
                                    <div className="flex items-end justify-between gap-2 h-24">
                                        {stats.weekDays.map((val, i) => {
                                            const maxVal = Math.max(...stats.weekDays, 1);
                                            const pct = (val / maxVal) * 100;
                                            const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                                            return (
                                                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                                    <div className="w-full flex items-end" style={{ height: '80px' }}>
                                                        <div
                                                            className="w-full bg-blue-600 rounded-t-lg transition-all"
                                                            style={{ height: `${Math.max(pct, 4)}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-[8px] font-black text-slate-600">{days[i]}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest px-1">Recent Deliveries</p>
                                {history.length === 0 && (
                                    <div className="py-12 text-center bg-white/[0.02] rounded-[2rem] border border-dashed border-white/5">
                                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No completed deliveries yet</p>
                                    </div>
                                )}
                                {history.map(h => (
                                    <div key={h.id} className="flex justify-between items-center p-5 bg-slate-900 border border-white/5 rounded-[1.5rem] hover:border-emerald-500/20 transition-all group">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center">
                                                <CheckCircle2 size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-white">#{h.order_number?.slice(-8).toUpperCase()}</p>
                                                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                                                    {new Date(h.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-base font-black text-emerald-400">+₹{h.delivery_fee || 30}</p>
                                            <p className="text-[8px] font-bold text-slate-700 uppercase">Paid</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── PROFILE ──────────────────────────────────────── */}
                    {tab === 'profile' && (
                        <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                            <div className="bg-slate-900 border border-white/5 rounded-[3rem] p-10 text-center relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
                                <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mx-auto text-3xl font-black text-white shadow-2xl shadow-blue-500/20 mb-6 overflow-hidden">
                                    {profile?.avatar_url
                                        ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                                        : profile?.full_name?.charAt(0) || 'P'
                                    }
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-tight">{profile?.full_name}</h2>
                                <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mt-1">Delivery Partner</p>

                                <div className="grid grid-cols-2 gap-4 mt-8 mb-8">
                                    <div className="bg-black/20 p-5 rounded-[1.5rem] border border-white/5">
                                        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mb-1">Total Runs</p>
                                        <p className="text-xl font-black text-emerald-400">{stats.total}</p>
                                    </div>
                                    <div className="bg-black/20 p-5 rounded-[1.5rem] border border-white/5">
                                        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mb-1">This Month</p>
                                        <p className="text-xl font-black text-blue-400">₹{stats.month}</p>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-6 border-t border-white/5 text-left">
                                    {[
                                        { icon: Phone, val: profile?.phone || 'Not set' },
                                        { icon: User, val: profile?.email || 'Not set' },
                                    ].map((row, i) => (
                                        <div key={i} className="flex items-center gap-3 px-5 py-4 bg-white/5 rounded-2xl border border-white/5">
                                            <row.icon size={16} className="text-slate-500 flex-shrink-0" />
                                            <p className="text-sm font-bold text-slate-300 truncate">{row.val}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="w-full py-5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <LogOut size={14} /> Sign Out
                            </button>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
}
