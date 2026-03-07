'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Phone, GraduationCap, Building2, Calendar,
    Loader2, LogOut, Camera, Save, Settings, HelpCircle,
    Info, ChevronLeft, Zap, Globe, Share2, Bell, Moon,
    Trash2, Key, CheckCircle2, AlertCircle, RefreshCw,
    Shield, MessageSquare, ExternalLink, Star, X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ThemeToggle from '@/components/ThemeToggle';

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────
interface ToastState { msg: string; type: 'ok' | 'err' | 'info'; }
interface ConfirmState { title: string; body: string; danger?: boolean; onConfirm: () => void; }
interface Errors { full_name?: string; phone?: string; reg_no?: string; department?: string; }

const PHONE_RE = /^[6-9]\d{9}$/;

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────
export default function ProfilePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'help'>('profile');
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [notifEnabled, setNotifEnabled] = useState(false);
    const [stats, setStats] = useState({ totalOrders: 0, totalSpent: 0 });
    const [sendingReset, setSendingReset] = useState(false);

    const [toast, setToast] = useState<ToastState | null>(null);
    const [confirmModal, setConfirmModal] = useState<ConfirmState | null>(null);

    const [editData, setEditData] = useState({
        full_name: '', phone: '', reg_no: '', department: '', year: ''
    });
    const [errors, setErrors] = useState<Errors>({});

    const numToYear: Record<number, string> = {
        1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: 'Post Grad'
    };
    const yearToNum: Record<string, number> = {
        '1st Year': 1, '2nd Year': 2, '3rd Year': 3, '4th Year': 4, 'Post Grad': 5
    };

    // ── Toast helper ──
    const showToast = (msg: string, type: ToastState['type'] = 'ok') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    // ── Confirm helper (in-app modal) ──
    const askConfirm = (config: ConfirmState) => setConfirmModal(config);

    // ─────────────────────────────────────────
    // Fetch profile
    // ─────────────────────────────────────────
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { router.push('/login'); return; }

                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
                const { data: spentData } = await supabase.from('orders').select('total_amount').eq('user_id', user.id);
                const spent = (spentData || []).reduce((a: number, o: any) => a + (Number(o.total_amount) || 0), 0);
                setStats({ totalOrders: orderCount || 0, totalSpent: spent });

                const sessionPic = user.user_metadata?.avatar_url || user.user_metadata?.picture || null;
                const yearDisplay = data?.year
                    ? (typeof data.year === 'number' ? numToYear[data.year] || `${data.year}` : data.year)
                    : '';

                const profileData = {
                    ...(data || {}),
                    id: data?.id || user.id,
                    email: data?.email || user.email,
                    full_name: data?.full_name || data?.name || user.user_metadata?.full_name || 'NexPrint User',
                    avatar_url: data?.avatar_url || sessionPic,
                    balance: data?.balance || 0,
                    provider: user.app_metadata?.provider || 'email',
                };
                setProfile(profileData);
                setEditData({
                    full_name: profileData.full_name || '',
                    phone: data?.phone || '',
                    reg_no: data?.reg_no || '',
                    department: data?.department || '',
                    year: yearDisplay
                });
                if ('Notification' in window) setNotifEnabled(Notification.permission === 'granted');
            } catch (error) {
                console.error('Profile fetch error:', error);
                showToast('Failed to load profile', 'err');
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [router]);

    // ─────────────────────────────────────────
    // Validate form
    // ─────────────────────────────────────────
    const validate = (): boolean => {
        const errs: Errors = {};
        if (!editData.full_name.trim()) errs.full_name = 'Name is required';
        if (editData.phone && !PHONE_RE.test(editData.phone.replace(/\s|-/g, '')))
            errs.phone = 'Enter valid 10-digit mobile number';
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    // ─────────────────────────────────────────
    // Save profile
    // ─────────────────────────────────────────
    const handleSave = async () => {
        if (!validate()) {
            showToast('Please fix the errors below', 'err');
            return;
        }
        setSaving(true);
        try {
            const { error } = await supabase.from('profiles').update({
                full_name: editData.full_name.trim(),
                name: editData.full_name.trim(),
                phone: editData.phone.trim(),
                reg_no: editData.reg_no.trim(),
                department: editData.department.trim(),
                year: yearToNum[editData.year] || (parseInt(editData.year) || null),
                updated_at: new Date().toISOString()
            }).eq('id', profile.id);

            if (error) throw error;
            setProfile({ ...profile, ...editData, full_name: editData.full_name.trim() });
            setErrors({});
            setEditing(false);
            showToast('✅ Profile saved successfully!', 'ok');
        } catch (error: any) {
            showToast(error.message || 'Failed to save profile', 'err');
        } finally {
            setSaving(false);
        }
    };

    // ─────────────────────────────────────────
    // Avatar upload
    // ─────────────────────────────────────────
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile?.id) return;

        if (file.size > 5 * 1024 * 1024) {
            showToast('Image must be under 5MB', 'err');
            return;
        }
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file', 'err');
            return;
        }

        setUploadingAvatar(true);
        try {
            const ext = file.name.split('.').pop();
            const path = `avatars/${profile.id}.${ext}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
            const avatar_url = urlData.publicUrl + `?v=${Date.now()}`;
            await supabase.from('profiles').update({ avatar_url }).eq('id', profile.id);
            setProfile({ ...profile, avatar_url });
            showToast('Profile photo updated!', 'ok');
        } catch (err: any) {
            showToast(err.message || 'Upload failed', 'err');
        } finally {
            setUploadingAvatar(false);
            e.target.value = '';
        }
    };

    // ─────────────────────────────────────────
    // Notifications
    // ─────────────────────────────────────────
    const toggleNotifications = async () => {
        if (!('Notification' in window)) {
            showToast('Notifications not supported in this browser', 'err');
            return;
        }
        if (Notification.permission === 'denied') {
            showToast('Notifications blocked — go to browser Settings → Notifications to re-enable', 'info');
            return;
        }
        if (Notification.permission === 'granted') {
            showToast('To disable, block NexPrint in browser notification settings', 'info');
            return;
        }
        const result = await Notification.requestPermission();
        if (result === 'granted') {
            setNotifEnabled(true);
            new Notification('NexPrint', { body: '🎉 You will now get order alerts!', icon: '/logo.png' });
            showToast('Order alerts enabled!', 'ok');
        } else {
            showToast('Notification permission denied', 'err');
        }
    };

    // ─────────────────────────────────────────
    // Change password
    // ─────────────────────────────────────────
    const handleChangePassword = async () => {
        if (profile?.provider !== 'email') {
            showToast(`Password change not available — you signed in with ${profile?.provider}`, 'info');
            return;
        }
        setSendingReset(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
                redirectTo: `${window.location.origin}/auth/reset-password`,
            });
            if (error) throw error;
            showToast('Password reset email sent! Check your inbox.', 'ok');
        } catch (err: any) {
            showToast(err.message || 'Failed to send reset email', 'err');
        } finally {
            setSendingReset(false);
        }
    };

    // ─────────────────────────────────────────
    // Sign out all devices
    // ─────────────────────────────────────────
    const handleSignOutAll = () => {
        askConfirm({
            title: 'Sign Out All Devices',
            body: 'You will be logged out from all devices including this one. You will need to sign in again.',
            danger: false,
            onConfirm: async () => {
                try {
                    await supabase.auth.signOut({ scope: 'global' });
                    router.push('/login');
                } catch (err: any) {
                    showToast(err.message || 'Error signing out', 'err');
                }
            }
        });
    };

    // ─────────────────────────────────────────
    // Delete account
    // ─────────────────────────────────────────
    const handleDeleteAccount = () => {
        askConfirm({
            title: '⚠️ Delete Account',
            body: 'This will permanently delete all your orders, print history, and data. This action cannot be undone.',
            danger: true,
            onConfirm: () => {
                // Actual deletion requires server-side Admin API — guide user to contact support
                showToast('Request sent. Our team will delete your account within 24 hours.', 'info');
            }
        });
    };

    // ─────────────────────────────────────────
    // Share NexPrint
    // ─────────────────────────────────────────
    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'NexPrint',
                    text: 'Zero-wait cloud printing on campus! 🖨️',
                    url: window.location.origin,
                });
            } catch (e) { /* user cancelled */ }
        } else {
            await navigator.clipboard.writeText(window.location.origin);
            showToast('Link copied to clipboard!', 'ok');
        }
    };

    // ─────────────────────────────────────────
    // Logout
    // ─────────────────────────────────────────
    const handleLogout = () => {
        askConfirm({
            title: 'Sign Out',
            body: 'Are you sure you want to sign out from NexPrint?',
            danger: false,
            onConfirm: async () => {
                await supabase.auth.signOut();
                router.push('/login');
            }
        });
    };

    // ─────────────────────────────────────────
    // Loading state
    // ─────────────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                        <span className="text-white font-black italic text-lg">N</span>
                    </div>
                    <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Loading Profile...</p>
                </div>
            </div>
        );
    }

    // ─────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────
    return (
        <div className="min-h-screen font-sans text-[var(--foreground)] bg-slate-50 dark:bg-slate-950 pb-32">

            {/* ── Toast ── */}
            <AnimatePresence>
                {toast && (
                    <motion.div key="toast"
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl text-white text-xs font-bold max-w-[90vw] ${toast.type === 'ok' ? 'bg-emerald-600 shadow-emerald-500/30' :
                                toast.type === 'err' ? 'bg-red-600 shadow-red-500/30' :
                                    'bg-blue-600 shadow-blue-500/30'
                            }`}
                    >
                        {toast.type === 'ok' ? <CheckCircle2 size={15} /> : toast.type === 'err' ? <AlertCircle size={15} /> : <Info size={15} />}
                        <span>{toast.msg}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Confirm Modal ── */}
            <AnimatePresence>
                {confirmModal && (
                    <>
                        <motion.div key="confirm-bg"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setConfirmModal(null)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150]"
                        />
                        <motion.div key="confirm-box"
                            initial={{ scale: 0.92, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.92, opacity: 0, y: 20 }}
                            className="fixed bottom-6 left-4 right-4 z-[160] bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-2xl max-w-md mx-auto"
                        >
                            <h3 className="text-base font-black text-slate-900 dark:text-white mb-2">{confirmModal.title}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">{confirmModal.body}</p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setConfirmModal(null)}
                                    className="flex-1 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                                >Cancel</button>
                                <button
                                    onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }}
                                    className={`flex-1 py-3 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg ${confirmModal.danger ? 'bg-red-600 shadow-red-500/20' : 'bg-blue-600 shadow-blue-500/20'
                                        }`}
                                >Confirm</button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

            {/* ── Header ── */}
            <div className="bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-100/50 dark:border-slate-800/50">
                <div className="max-w-md mx-auto px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()}
                            className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-500 active:scale-90 transition-all">
                            <ChevronLeft size={20} />
                        </button>
                        <h1 className="text-base font-black text-slate-900 dark:text-white">Account</h1>
                    </div>
                    <div className="flex gap-2">
                        <ThemeToggle />
                        {editing && (
                            <button onClick={handleSave} disabled={saving}
                                className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30 active:scale-90 transition-all disabled:opacity-50">
                                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-md mx-auto px-5 pt-5 space-y-4">

                {/* ── Identity Card ── */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-7 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                        <div className="absolute -top-8 -right-8 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl" />
                        <div className="relative flex flex-col items-center">
                            {/* Avatar */}
                            <div className="relative mb-4">
                                <div className="p-0.5 rounded-[2rem] bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600">
                                    <div className="w-24 h-24 rounded-[1.8rem] overflow-hidden border-4 border-white dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
                                        {uploadingAvatar ? (
                                            <div className="w-full h-full flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                                                <Loader2 size={24} className="text-blue-600 animate-spin" />
                                            </div>
                                        ) : profile?.avatar_url ? (
                                            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                                                <span className="text-3xl font-black text-white italic">{(profile?.full_name || 'U').charAt(0).toUpperCase()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-1 -right-1 w-9 h-9 bg-white dark:bg-slate-800 rounded-full shadow-lg flex items-center justify-center text-blue-600 border border-slate-100 dark:border-slate-700 active:scale-90 transition-all"
                                    title="Change photo">
                                    <Camera size={15} />
                                </button>
                            </div>

                            <h2 className="text-xl font-black text-slate-900 dark:text-white">{profile?.full_name}</h2>
                            <p className="text-xs text-slate-400 mt-0.5">{profile?.email}</p>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 w-full mt-6 pt-5 border-t border-slate-50 dark:border-slate-800">
                                <div className="text-center">
                                    <p className="text-xl font-black text-slate-900 dark:text-white italic">{stats.totalOrders}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Orders</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-black text-slate-900 dark:text-white italic">₹{stats.totalSpent.toFixed(0)}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Spent</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xl font-black text-blue-600 dark:text-blue-400 italic">Pro</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Tier</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── Tabs ── */}
                <div className="flex bg-white dark:bg-slate-900 rounded-3xl p-1.5 shadow-sm border border-slate-100 dark:border-slate-800">
                    {(['profile', 'settings', 'help'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all ${activeTab === tab ? 'bg-slate-900 dark:bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>
                            {tab === 'profile' ? <User size={13} /> : tab === 'settings' ? <Settings size={13} /> : <HelpCircle size={13} />}
                            <span className="text-[9px] font-black uppercase tracking-widest">{tab}</span>
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">

                    {/* ════════════════════════════════ PROFILE TAB ════════════════════════════════ */}
                    {activeTab === 'profile' && (
                        <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

                            {/* Personal */}
                            <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                                <div className="px-5 pt-4 pb-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Personal Details</p>
                                </div>
                                <div className="px-3 pb-3 space-y-0.5">
                                    <FieldRow
                                        icon={<User size={15} />} label="Full Name" value={editData.full_name}
                                        editing={editing} error={errors.full_name}
                                        onChange={(v: string) => { setEditData({ ...editData, full_name: v }); setErrors({ ...errors, full_name: '' }); }}
                                    />
                                    <FieldRow
                                        icon={<Phone size={15} />} label="Phone Number" value={editData.phone}
                                        placeholder="+91 98765 43210" type="tel" editing={editing} error={errors.phone}
                                        onChange={(v: string) => { setEditData({ ...editData, phone: v }); setErrors({ ...errors, phone: '' }); }}
                                    />
                                    <FieldRow icon={<Mail size={15} />} label="Email Address" value={profile?.email} disabled />
                                </div>
                            </div>

                            {/* Academic */}
                            <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                                <div className="px-5 pt-4 pb-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Academic Info</p>
                                </div>
                                <div className="px-3 pb-3 space-y-0.5">
                                    <FieldRow
                                        icon={<GraduationCap size={15} />} label="Register Number" value={editData.reg_no}
                                        placeholder="University / College ID" editing={editing} error={errors.reg_no}
                                        onChange={(v: string) => setEditData({ ...editData, reg_no: v })}
                                    />
                                    <FieldRow
                                        icon={<Building2 size={15} />} label="Department" value={editData.department}
                                        placeholder="e.g. Computer Science" editing={editing} error={errors.department}
                                        onChange={(v: string) => setEditData({ ...editData, department: v })}
                                    />
                                    {/* Year selector */}
                                    <div className="p-3 rounded-2xl flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0">
                                            <Calendar size={15} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Year of Study</p>
                                            {editing ? (
                                                <select value={editData.year}
                                                    onChange={e => setEditData({ ...editData, year: e.target.value })}
                                                    className="text-sm font-black text-slate-900 dark:text-white bg-transparent outline-none mt-0.5 w-full border-b-2 border-transparent focus:border-blue-500 transition-all">
                                                    <option value="">— Select Year —</option>
                                                    {['1st Year', '2nd Year', '3rd Year', '4th Year', 'Post Grad'].map(y => <option key={y}>{y}</option>)}
                                                </select>
                                            ) : (
                                                <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{editData.year || '—'}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action buttons */}
                            {editing ? (
                                <div className="space-y-2">
                                    <button onClick={handleSave} disabled={saving}
                                        className="w-full py-4 rounded-[1.8rem] bg-blue-600 text-white font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50">
                                        {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                    <button onClick={() => { setEditing(false); setErrors({}); }}
                                        className="w-full py-3 text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors">
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button onClick={() => setEditing(true)}
                                    className="w-full py-4 rounded-[1.8rem] bg-slate-900 dark:bg-slate-800 text-white font-black uppercase text-[9px] tracking-widest active:scale-95 transition-all shadow-lg shadow-slate-200/50 dark:shadow-none flex items-center justify-center gap-2">
                                    <User size={14} /> Edit Profile
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* ════════════════════════════════ SETTINGS TAB ════════════════════════════════ */}
                    {activeTab === 'settings' && (
                        <motion.div key="settings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

                            {/* App */}
                            <SettingsGroup title="App Settings">
                                {/* Notifications */}
                                <SettingsRow
                                    icon={<Bell size={15} className="text-blue-500" />}
                                    bg="bg-blue-50 dark:bg-blue-900/20"
                                    label="Order Alerts"
                                    desc={notifEnabled ? 'Notifications are enabled' : 'Get alerts when your order status changes'}
                                    onClick={toggleNotifications}
                                    right={
                                        <div className={`w-10 h-6 rounded-full relative transition-all ${notifEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-1 transition-all ${notifEnabled ? 'left-5' : 'left-1'}`} />
                                        </div>
                                    }
                                />
                                {/* Dark Mode */}
                                <SettingsRow
                                    icon={<Moon size={15} className="text-indigo-500" />}
                                    bg="bg-indigo-50 dark:bg-indigo-900/20"
                                    label="Dark Mode"
                                    desc="Toggle light / dark appearance"
                                    right={<ThemeToggle />}
                                    onClick={() => { }}
                                />
                            </SettingsGroup>

                            {/* Security */}
                            <SettingsGroup title="Security">
                                <SettingsRow
                                    icon={sendingReset ? <Loader2 size={15} className="text-orange-500 animate-spin" /> : <Key size={15} className="text-orange-500" />}
                                    bg="bg-orange-50 dark:bg-orange-900/20"
                                    label="Change Password"
                                    desc={profile?.provider === 'email' ? 'Send a password reset link to your email' : `Using ${profile?.provider} sign-in — no password set`}
                                    onClick={sendingReset ? undefined : handleChangePassword}
                                />
                                <SettingsRow
                                    icon={<RefreshCw size={15} className="text-amber-500" />}
                                    bg="bg-amber-50 dark:bg-amber-900/20"
                                    label="Sign Out All Devices"
                                    desc="Revoke all active sessions everywhere"
                                    onClick={handleSignOutAll}
                                />
                                <SettingsRow
                                    icon={<Trash2 size={15} className="text-red-500" />}
                                    bg="bg-red-50 dark:bg-red-900/20"
                                    label="Delete Account"
                                    desc="Permanently remove all your data"
                                    labelClass="text-red-600 dark:text-red-400"
                                    onClick={handleDeleteAccount}
                                    danger
                                />
                            </SettingsGroup>

                            {/* Sign out */}
                            <button onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 dark:bg-red-400/5 text-red-600 dark:text-red-400 rounded-[1.8rem] text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all border border-red-100 dark:border-red-900/10">
                                <LogOut size={14} /> Sign Out
                            </button>
                        </motion.div>
                    )}

                    {/* ════════════════════════════════ HELP TAB ════════════════════════════════ */}
                    {activeTab === 'help' && (
                        <motion.div key="help" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">

                            {/* Support hero */}
                            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-7 text-white text-center shadow-xl shadow-blue-500/20">
                                <div className="w-14 h-14 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <Zap size={26} className="text-white" />
                                </div>
                                <h4 className="text-lg font-black tracking-tight">How can we help?</h4>
                                <p className="text-sm text-blue-100/80 mt-1.5 leading-relaxed">Our team responds within 2 hours on business days.</p>
                            </div>

                            {/* Contact options */}
                            <SettingsGroup title="Contact Support">
                                {/* Email */}
                                <a href="mailto:support@nexprint.cloud" className="block">
                                    <SettingsRow
                                        icon={<MessageSquare size={15} className="text-blue-500" />}
                                        bg="bg-blue-50 dark:bg-blue-900/20"
                                        label="Email Support"
                                        desc="support@nexprint.cloud"
                                        right={<ExternalLink size={13} className="text-slate-300" />}
                                        onClick={() => { }}
                                    />
                                </a>
                                {/* Order issues */}
                                <Link href="/dashboard/orders">
                                    <SettingsRow
                                        icon={<Shield size={15} className="text-emerald-500" />}
                                        bg="bg-emerald-50 dark:bg-emerald-900/20"
                                        label="Order Issues"
                                        desc="View your orders and raise a dispute"
                                        onClick={() => { }}
                                    />
                                </Link>
                                {/* Rate app */}
                                <SettingsRow
                                    icon={<Star size={15} className="text-amber-500" />}
                                    bg="bg-amber-50 dark:bg-amber-900/20"
                                    label="Rate NexPrint"
                                    desc="Love NexPrint? Leave us a review!"
                                    onClick={() => {
                                        showToast('Thank you! Reviews help us grow 🙏', 'ok');
                                    }}
                                />
                                {/* Share */}
                                <SettingsRow
                                    icon={<Share2 size={15} className="text-pink-500" />}
                                    bg="bg-pink-50 dark:bg-pink-900/20"
                                    label="Share NexPrint"
                                    desc="Invite friends — they'll thank you!"
                                    onClick={handleShare}
                                />
                                {/* Website */}
                                <a href="https://nexprint.cloud" target="_blank" rel="noreferrer" className="block">
                                    <SettingsRow
                                        icon={<Globe size={15} className="text-teal-500" />}
                                        bg="bg-teal-50 dark:bg-teal-900/20"
                                        label="Visit Website"
                                        desc="nexprint.cloud"
                                        right={<ExternalLink size={13} className="text-slate-300" />}
                                        onClick={() => { }}
                                    />
                                </a>
                            </SettingsGroup>

                            {/* Version badge */}
                            <div className="text-center pb-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-full">
                                    <Info size={11} className="text-slate-400" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">NexPrint v2.5.0</span>
                                </div>
                                <p className="text-[8px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em] mt-2">Engineered by NEX Dynamics</p>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
}

// ─────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────

function FieldRow({ icon, label, value, editing, onChange, placeholder, disabled, type = 'text', error }: any) {
    return (
        <div className={`px-2 py-2.5 rounded-2xl ${disabled ? 'opacity-50' : ''}`}>
            <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0 ${error ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : ''}`}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-[8px] font-bold uppercase tracking-widest ${error ? 'text-red-500' : 'text-slate-400'}`}>{label}</p>
                    {editing && !disabled ? (
                        <input type={type} value={value} onChange={e => onChange(e.target.value)}
                            placeholder={placeholder}
                            className={`text-sm font-black text-slate-900 dark:text-white bg-transparent outline-none w-full mt-0.5 border-b-2 transition-all ${error ? 'border-red-400' : 'border-transparent focus:border-blue-500'}`}
                        />
                    ) : (
                        <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5 truncate">{value || '—'}</p>
                    )}
                    {error && <p className="text-[8px] font-bold text-red-500 mt-0.5">{error}</p>}
                </div>
                {!disabled && editing && !error && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse flex-shrink-0" />}
            </div>
        </div>
    );
}

function SettingsGroup({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
            <div className="px-5 pt-4 pb-2">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">{title}</p>
            </div>
            <div className="px-3 pb-3 space-y-0.5">{children}</div>
        </div>
    );
}

function SettingsRow({ icon, bg, label, desc, right, onClick, danger, labelClass }: any) {
    return (
        <button onClick={onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all active:scale-[0.98] text-left ${danger ? 'hover:bg-red-50 dark:hover:bg-red-900/10' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
            <div className={`w-8 h-8 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>{icon}</div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-black ${labelClass || 'text-slate-800 dark:text-slate-100'}`}>{label}</p>
                {desc && <p className="text-[8px] text-slate-400 font-bold mt-0.5 truncate">{desc}</p>}
            </div>
            {right || <ChevronRightSmall danger={danger} />}
        </button>
    );
}

function ChevronRightSmall({ danger }: { danger?: boolean }) {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            className={danger ? 'text-red-300 dark:text-red-800' : 'text-slate-300 dark:text-slate-700'}>
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );
}
