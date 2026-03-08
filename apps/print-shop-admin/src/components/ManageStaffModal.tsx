'use client';

import { useState, useEffect } from 'react';
import { X, User, Mail, Phone, Loader2, CheckCircle2, Shield, KeyRound, Eye, EyeOff, Trash2, Ban } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

const USER_WEB_API_BASE = (process.env.NEXT_PUBLIC_USER_WEB_URL || '').replace(/\/$/, '');

interface ManageStaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    member: any;
}

export default function ManageStaffModal({ isOpen, onClose, onSuccess, member }: ManageStaffModalProps) {
    const [loading, setLoading] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState({
        full_name: member?.full_name || '',
        phone: member?.phone || '',
        password: ''
    });

    // A member is an orphan if it's from shop_staff but has no user_id. 
    // If it's a direct profile, it's never an orphan.
    const isOrphan = member ? (member.role ? false : !member.user_id) : true;

    useEffect(() => {
        if (member) {
            setForm({
                full_name: member.full_name || '',
                phone: member.phone || '',
                password: ''
            });
        }
    }, [member]);

    const handleAction = async (action: string, data?: any) => {
        setLoading(action);
        setError(null);
        try {
            const userId = member.user_id || member.id;

            // If orphan and trying to delete, just delete the shop_staff record
            if (isOrphan && action === 'delete') {
                const { error: dbError } = await supabase.from('shop_staff').delete().eq('id', member.id);
                if (dbError) throw dbError;
                onSuccess();
                onClose();
                return;
            }

            const res = await fetch(`${USER_WEB_API_BASE}/api/auth/manage-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    action,
                    data: data || form
                }),
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.error || 'Action failed');

            if (action === 'delete') {
                onSuccess();
                onClose();
                return;
            }

            setDone(true);
            setTimeout(() => {
                setDone(false);
                if (action === 'update_profile') onSuccess();
            }, 2000);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(null);
        }
    };

    if (!member) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden font-outfit">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Manage {member.full_name}</h2>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">Staff Permissions & Security</p>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 shadow-sm border border-slate-100">
                                <X size={20} />
                            </button>
                        </div>

                        {isOrphan && (
                            <div className="mx-8 mt-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-3">
                                <Shield size={20} className="text-amber-500 shrink-0" />
                                <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider leading-relaxed">
                                    This member has no linked account. Profile edits and password resets are disabled.
                                </div>
                            </div>
                        )}

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left: Profile Edit */}
                            <div className={`space-y-4 ${isOrphan ? 'opacity-40 pointer-events-none' : ''}`}>
                                <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <User size={14} className="text-violet-600" /> General Info
                                </h3>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <input
                                            value={form.full_name}
                                            onChange={e => setForm({ ...form, full_name: e.target.value })}
                                            className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold outline-none focus:border-violet-500 transition-all"
                                            placeholder="Full Name"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <input
                                            value={form.phone}
                                            onChange={e => setForm({ ...form, phone: e.target.value })}
                                            className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 text-sm font-bold outline-none focus:border-violet-500 transition-all"
                                            placeholder="Phone Number"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleAction('update_profile')}
                                        disabled={!!loading || isOrphan}
                                        className="w-full py-3 bg-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-violet-700 transition-all shadow-lg shadow-violet-200"
                                    >
                                        {loading === 'update_profile' ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Update Profile'}
                                    </button>
                                </div>

                                <div className="pt-4 space-y-4">
                                    <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <KeyRound size={14} className="text-emerald-600" /> Change Password
                                    </h3>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={form.password}
                                            onChange={e => setForm({ ...form, password: e.target.value })}
                                            className="w-full pl-5 pr-12 py-3 rounded-2xl bg-emerald-50/30 border border-emerald-100 text-sm font-bold outline-none focus:border-emerald-500 transition-all"
                                            placeholder="New Password"
                                        />
                                        <button onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => handleAction('update_password')}
                                        disabled={!form.password || !!loading || isOrphan}
                                        className="w-full py-3 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50"
                                    >
                                        {loading === 'update_password' ? <Loader2 size={16} className="animate-spin mx-auto" /> : 'Set New Password'}
                                    </button>
                                </div>
                            </div>

                            {/* Right: Danger Zone */}
                            <div className="space-y-6">
                                <div className={`p-6 rounded-[2rem] bg-amber-50/50 border border-amber-100 space-y-4 ${isOrphan ? 'opacity-40 pointer-events-none' : ''}`}>
                                    <h3 className="text-[11px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2">
                                        <Ban size={14} /> Access Control
                                    </h3>
                                    <p className="text-[10px] text-amber-600 font-bold leading-relaxed">
                                        Temporarily block this member from accessing the terminal.
                                    </p>
                                    <button
                                        onClick={() => handleAction('block', { blocked: true })}
                                        className="w-full py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
                                    >
                                        Block Access
                                    </button>
                                </div>

                                <div className="p-6 rounded-[2rem] bg-red-50/50 border border-red-100 space-y-4">
                                    <h3 className="text-[11px] font-black text-red-700 uppercase tracking-widest flex items-center gap-2">
                                        <Trash2 size={14} /> Termination
                                    </h3>
                                    <p className="text-[10px] text-red-600 font-bold leading-relaxed">
                                        {isOrphan ? 'Remove this invalid staff entry from your shop records.' : 'Permanently delete this account. This action cannot be undone.'}
                                    </p>
                                    <button
                                        onClick={() => {
                                            if (confirm(`Are you absolutely sure? This will permanently ${isOrphan ? 'remove' : 'delete'} the staff ${isOrphan ? 'record' : 'account'}.`)) {
                                                handleAction('delete');
                                            }
                                        }}
                                        className="w-full py-3 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200"
                                    >
                                        {isOrphan ? 'Remove Staff' : 'Delete Staff'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="m-8 p-4 bg-red-50 text-red-600 rounded-2xl text-[11px] font-bold text-center border border-red-100">
                                {error}
                            </div>
                        )}

                        {done && (
                            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex items-center justify-center z-50">
                                <div className="text-center animate-bounce">
                                    <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
                                    <h4 className="text-lg font-black text-slate-900 uppercase">Changes Applied!</h4>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
