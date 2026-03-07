'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<any>({ full_name: '', email: '', phone: '', avatar_url: '', role: '' });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || user.id === undefined) return;

            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            // Extract Google DP and Name
            const googleName = user.user_metadata?.full_name || user.user_metadata?.name || '';
            const googlePic = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';

            if (profileData) {
                setProfile({
                    ...profileData,
                    full_name: profileData.full_name || googleName,
                    avatar_url: profileData.avatar_url || googlePic,
                });
            } else {
                setProfile({
                    full_name: googleName,
                    email: user.email || '',
                    phone: user.phone || '',
                    avatar_url: googlePic,
                    role: 'shop_owner'
                });
            }
            setLoading(false);
        };

        fetchProfile();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: profile.full_name,
                    phone: profile.phone,
                    avatar_url: profile.avatar_url
                })
                .eq('id', user.id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Personal profile updated!' });
        } catch (err: any) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Loading Admin Profile...</div>;

    return (
        <div className="max-w-4xl space-y-8 font-outfit">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Profile</h1>
                    <p className="text-slate-500 mt-1 font-medium">Manage your personal information and credentials</p>
                </div>
                <button
                    onClick={(e) => handleSave(e as any)}
                    disabled={saving}
                    className="px-6 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 group disabled:opacity-50"
                >
                    {saving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <span className="group-hover:scale-110 transition-transform">💾</span>
                    )}
                    Save Changes
                </button>
            </div>

            {message && (
                <div className={`p-4 rounded-2xl text-xs font-bold uppercase tracking-widest ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'
                    }`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-50">
                <form onSubmit={handleSave} className="space-y-6">
                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-24 h-24 rounded-3xl bg-blue-50 border-2 border-dashed border-blue-200 flex items-center justify-center text-4xl overflow-hidden">
                            {profile.avatar_url ? (
                                <img
                                    src={profile.avatar_url}
                                    alt=""
                                    referrerPolicy="no-referrer"
                                    onError={(e) => {
                                        setProfile({ ...profile, avatar_url: '' });
                                    }}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                "👤"
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Profile Picture</h3>
                            <p className="text-sm text-slate-400 mb-3">Upload a clean professional photo</p>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    setSaving(true);
                                    const formData = new FormData();
                                    formData.append('file', file);
                                    formData.append('upload_preset', 'cm_xerox');

                                    try {
                                        const res = await fetch(`https://api.cloudinary.com/v1_1/dznjnvmb7/image/upload`, {
                                            method: 'POST',
                                            body: formData
                                        });
                                        const data = await res.json();
                                        setProfile({ ...profile, avatar_url: data.secure_url });
                                        setMessage({ type: 'success', text: 'Image uploaded! Remember to save changes.' });
                                    } catch (err) {
                                        setMessage({ type: 'error', text: 'Upload failed' });
                                    } finally {
                                        setSaving(false);
                                    }
                                }}
                                className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                            <input
                                type="text"
                                value={profile.full_name}
                                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                placeholder="Your Name"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                            <input
                                type="email"
                                value={profile.email}
                                disabled
                                className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-100 text-slate-500 font-bold outline-none cursor-not-allowed"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                            <input
                                type="text"
                                value={profile.phone || ''}
                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                className="w-full px-5 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 font-bold text-slate-900 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all"
                                placeholder="+91 XXXXX XXXXX"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Access Role</label>
                            <div className="w-full px-5 py-4 rounded-2xl border border-blue-100 bg-blue-50/50 font-bold text-blue-600 flex items-center justify-between">
                                <span className="uppercase tracking-widest">{profile.role || 'SHOP OWNER'}</span>
                                <span className="text-[10px] bg-blue-600 text-white px-2 py-1 rounded-lg">VERIFIED</span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-50 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-4 bg-blue-600 text-white text-sm font-bold rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {saving ? 'SAVING...' : 'UPDATE ADMIN PROFILE'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
