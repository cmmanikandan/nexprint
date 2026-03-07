'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Phone, GraduationCap, Building2, Calendar,
    ArrowRight, CheckCircle2, Loader2, Sparkles, User
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function OnboardingPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [step, setStep] = useState(1);
    const [profile, setProfile] = useState<any>(null);
    const [formData, setFormData] = useState({
        phone: '',
        reg_no: '',
        department: '',
        year: '1st Year'
    });

    // Year text to integer (DB column is INTEGER)
    const yearToNum: Record<string, number> = {
        '1st Year': 1, '2nd Year': 2, '3rd Year': 3, '4th Year': 4, 'Post Grad': 5
    };

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/login');
                return;
            }

            // Fetch profile directly via supabase client (uses user session for RLS)
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (profileData?.is_onboarded) {
                router.replace('/dashboard');
                return;
            }

            const displayName = profileData?.full_name || profileData?.name
                || user.user_metadata?.full_name || user.user_metadata?.name || '';

            setProfile({
                id: user.id,
                email: profileData?.email || user.email,
                full_name: displayName,
                avatar_url: profileData?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null
            });

            // Pre-fill if data exists
            if (profileData) {
                const numToYear: Record<number, string> = {
                    1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: 'Post Grad'
                };
                setFormData({
                    phone: profileData.phone || '',
                    reg_no: profileData.reg_no || '',
                    department: profileData.department || '',
                    year: (typeof profileData.year === 'number'
                        ? numToYear[profileData.year]
                        : profileData.year) || '1st Year'
                });
            }

            setLoading(false);
        };
        checkUser();
    }, [router]);

    const handleSubmit = async () => {
        if (!formData.phone || !formData.reg_no || !formData.department) {
            return;
        }

        setSaving(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    phone: formData.phone,
                    reg_no: formData.reg_no,
                    department: formData.department,
                    year: yearToNum[formData.year] || 1,
                    name: profile.full_name || 'User',
                    full_name: profile.full_name || 'User',
                    is_onboarded: true,
                    updated_at: new Date().toISOString()
                })
                .eq('id', profile.id);

            if (error) throw error;

            setStep(3); // Success
            setTimeout(() => {
                router.replace('/dashboard');
            }, 2000);
        } catch (error: any) {
            console.error('Onboarding error:', error);
            alert(error.message || 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handleSkip = async () => {
        try {
            await supabase
                .from('profiles')
                .update({
                    is_onboarded: true,
                    name: profile.full_name || 'User',
                    full_name: profile.full_name || 'User'
                })
                .eq('id', profile.id);
        } catch { }
        router.replace('/dashboard');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center animate-pulse shadow-2xl shadow-blue-500/40">
                        <span className="text-2xl font-black text-white italic">N</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans flex items-center justify-center p-6 py-16">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent -z-10" />

            <div className="w-full max-w-lg">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="welcome"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-xl border border-slate-100 dark:border-slate-800 text-center"
                        >
                            <div className="mb-8">
                                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-blue-500/20 overflow-hidden mb-6">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-3xl font-black text-white italic">
                                            {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-[0.2em] mb-4">
                                    <Sparkles size={12} />
                                    Account Created Successfully
                                </div>

                                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 italic leading-tight">
                                    Welcome, {profile?.full_name?.split(' ')[0] || 'there'}! 👋
                                </h1>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Let&apos;s set up your NexPrint profile
                                </p>
                            </div>

                            <p className="text-xs text-slate-500 font-medium leading-relaxed mb-8">
                                We need a few more details to personalize your cloud printing experience and help nearby shops serve you better.
                            </p>

                            <button
                                onClick={() => setStep(2)}
                                className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                            >
                                Complete Profile <ArrowRight size={16} />
                            </button>

                            <button
                                onClick={handleSkip}
                                className="mt-4 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-500 transition-colors"
                            >
                                Skip for now
                            </button>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="details"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-xl border border-slate-100 dark:border-slate-800"
                        >
                            {/* Progress */}
                            <div className="flex gap-2 mb-8">
                                <div className="flex-1 h-1.5 bg-blue-600 rounded-full" />
                                <div className="flex-1 h-1.5 bg-blue-600 rounded-full" />
                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full" />
                            </div>

                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 italic">Your Details</h1>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Required to place print orders</p>
                            </div>

                            <div className="space-y-5">
                                {/* Phone */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Phone Number <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative group">
                                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            required
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm"
                                            placeholder="+91 9XXXX XXXXX"
                                        />
                                    </div>
                                </div>

                                {/* Reg No */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Register No / ID <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative group">
                                        <GraduationCap className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            required
                                            value={formData.reg_no}
                                            onChange={(e) => setFormData({ ...formData, reg_no: e.target.value })}
                                            className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm uppercase"
                                            placeholder="STU-XXXXX"
                                        />
                                    </div>
                                </div>

                                {/* Department */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Department <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            required
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 font-bold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-sm"
                                            placeholder="e.g. Computer Science"
                                        />
                                    </div>
                                </div>

                                {/* Year */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Year</label>
                                    <div className="relative group">
                                        <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                                        <select
                                            value={formData.year}
                                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                                            className="w-full pl-14 pr-10 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 font-bold outline-none focus:border-blue-500 transition-all text-sm appearance-none cursor-pointer"
                                        >
                                            <option>1st Year</option>
                                            <option>2nd Year</option>
                                            <option>3rd Year</option>
                                            <option>4th Year</option>
                                            <option>Post Grad</option>
                                        </select>
                                    </div>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={saving || !formData.phone || !formData.reg_no || !formData.department}
                                    className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all text-[10px] uppercase tracking-widest disabled:opacity-50 mt-4"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            Save & Continue <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={handleSkip}
                                    className="w-full py-2 text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-slate-500 transition-colors"
                                >
                                    Skip for now
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="success"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white dark:bg-slate-900 rounded-[3rem] p-12 shadow-2xl text-center space-y-8 border border-slate-100 dark:border-slate-800"
                        >
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
                                <CheckCircle2 size={56} />
                            </div>
                            <div className="space-y-3">
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-none italic">You&apos;re All Set!</h1>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                                    Your profile is complete. Redirecting to dashboard...
                                </p>
                            </div>
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin mx-auto" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
