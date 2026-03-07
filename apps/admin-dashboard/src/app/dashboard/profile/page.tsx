'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Mail, Shield, Calendar, Loader2, Save, Camera } from 'lucide-react';

export default function ProfilePage() {
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                setProfile(data);
            }
            setLoading(false);
        };
        fetchProfile();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        const formData = new FormData(e.currentTarget);
        const updates = {
            full_name: formData.get('fullName'),
            phone: formData.get('phone'),
            updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', profile.id);

        if (error) {
            setMessage({ type: 'error', text: error.message });
        } else {
            setProfile({ ...profile, ...updates });
            setMessage({ type: 'success', text: 'Identity parameters updated successfully' });
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 font-outfit pb-20">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Authority Profile</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">System Root • Core Identity Management</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm flex flex-col items-center text-center">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-slate-900 text-white flex items-center justify-center text-4xl font-black shadow-2xl shadow-slate-200">
                                {profile?.full_name?.charAt(0) || 'A'}
                            </div>
                            <button className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                                <Camera size={18} />
                            </button>
                        </div>

                        <div className="mt-6">
                            <h2 className="text-xl font-black text-slate-900 leading-none">{profile?.full_name || 'System Root'}</h2>
                            <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-2">Level 5 Access • Super Admin</p>
                        </div>

                        <div className="w-full mt-8 pt-8 border-t border-slate-50 space-y-4">
                            <div className="flex items-center gap-3 text-left">
                                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Shield size={14} />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Clearance</p>
                                    <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Root Authority</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-left">
                                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                                    <Calendar size={14} />
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Registry Date</p>
                                    <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">
                                        {new Date(profile?.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-500/20">
                        <h3 className="text-sm font-black uppercase tracking-widest">Security Protocol</h3>
                        <p className="text-[10px] font-medium text-blue-100 mt-2 leading-relaxed italic">
                            "Your identity is the anchor of the NexPrint ecosystem. Ensure your credentials remain encrypted and private."
                        </p>
                    </div>
                </div>

                {/* Settings Form */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-slate-50 bg-slate-50/50">
                            <h2 className="text-lg font-black text-slate-900 tracking-tight">Identity Parameters</h2>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Modify core profile details</p>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="p-8 space-y-6">
                            {message.text && (
                                <div className={`p-4 rounded-2xl border ${message.type === 'error' ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-center">{message.text}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Legal Designation</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input
                                            name="fullName"
                                            defaultValue={profile?.full_name}
                                            placeholder="Full Name"
                                            className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-5 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Communication Node</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input
                                            disabled
                                            value={profile?.email}
                                            className="w-full h-12 bg-slate-100 border border-slate-200 rounded-2xl pl-12 pr-5 text-[10px] font-black uppercase tracking-widest text-slate-400 outline-none cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Contact Frequency (Phone)</label>
                                    <input
                                        name="phone"
                                        defaultValue={profile?.phone}
                                        placeholder="+91 XXXXX XXXXX"
                                        className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none"
                                    />
                                </div>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 active:scale-95 transition-all flex items-center justify-center gap-2">
                                    {saving ? (
                                        <Loader2 size={16} className="animate-spin" />
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            Sync Registry Updates
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
