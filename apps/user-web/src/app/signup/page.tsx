'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Phone, GraduationCap, Building2,
    Calendar, Lock, ArrowLeft, ArrowRight, ShieldCheck,
    Loader2, CheckCircle2, Eye, EyeOff
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        regNo: '',
        department: '',
        year: '1st Year',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const departments = [
        "Computer Science & Engineering",
        "Information Technology",
        "Electronics & Communication",
        "Electrical & Electronics",
        "Mechanical Engineering",
        "Civil Engineering",
        "Bio-Technology",
        "Artificial Intelligence & Data Science",
        "Business Administration (MBA)",
        "Bachelors of Commerce (B.Com)",
        "Bachelors of Science (B.Sc)",
        "Bachelors of Arts (B.A)",
        "Other"
    ];

    const validateEmail = (email: string) => {
        return String(email)
            .toLowerCase()
            .match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    };

    const nextStep = () => {
        setError(null);
        if (step === 1) {
            if (!formData.fullName.trim()) { setError("Full name is required"); return; }
            if (!validateEmail(formData.email)) { setError("Please enter a valid email address"); return; }
            if (formData.phone.length < 10) { setError("Please enter a valid phone number"); return; }
        }
        if (step === 2) {
            if (!formData.regNo.trim()) { setError("Register number / ID is required"); return; }
            if (!formData.department) { setError("Please select your department"); return; }
        }
        setStep(s => s + 1);
    };

    const prevStep = () => {
        setError(null);
        setStep(s => s - 1);
    };

    const handleGoogleSignup = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                }
            });
            if (error) throw error;
        } catch (err: any) {
            console.error('Google Auth Error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match!");
            return;
        }

        setLoading(true);
        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        phone: formData.phone,
                        reg_no: formData.regNo,
                        department: formData.department,
                        year: formData.year,
                        role: 'user'
                    }
                }
            });

            if (signUpError) throw signUpError;

            setStep(4); // Success Step
        } catch (err: any) {
            console.error('Signup Error:', err);
            setError(err.message || "Database synchronization failed. Please ensure SQL schema is updated.");
        } finally {
            setLoading(false);
        }
    };

    const containerVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 }
    };

    return (
        <div className="min-h-screen bg-[#07070f] font-outfit flex items-center justify-center p-6 py-20 relative overflow-hidden selection:bg-blue-500 selection:text-white">
            {/* Background orbs */}
            <div className="fixed inset-0 pointer-events-none -z-10">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[140px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-700/8 blur-[120px]" />
            </div>
            {/* Grid overlay */}
            <div className="fixed inset-0 -z-10 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)', backgroundSize: '60px 60px' }}
            />
            {/* Back button */}
            <Link
                href="/"
                className="fixed top-6 left-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.08] transition-all text-[9px] font-black uppercase tracking-widest group"
            >
                <ArrowLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                Back to Home
            </Link>

            <div className="w-full max-w-lg">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1" {...containerVariants}
                            className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-[3rem] p-10 shadow-2xl"
                        >
                            {/* Inner Progress Indicators */}
                            <div className="flex justify-between mb-10 px-4">
                                {[1, 2, 3].map((s) => (
                                    <div key={s} className="flex flex-col items-center gap-2">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-500 shadow-sm ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-300'
                                            }`}>
                                            {step > s ? <CheckCircle2 size={16} /> : s}
                                        </div>
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${step >= s ? 'text-blue-600' : 'text-slate-300'
                                            }`}>
                                            {s === 1 ? 'Primary' : s === 2 ? 'Academic' : 'Security'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="text-center mb-10">
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 italic">Create Account</h1>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enter your primary details</p>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">!</div>
                                        <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                    <div className="relative group">
                                        <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            required
                                            value={formData.fullName}
                                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                            className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 font-bold outline-none focus:border-blue-500 transition-all text-sm"
                                            placeholder="Ex: Manikandan Prabhu"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                    <div className="relative group">
                                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            required
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 font-bold outline-none focus:border-blue-500 transition-all text-sm"
                                            placeholder="user@university.edu"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                    <div className="relative group">
                                        <Phone className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            required
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 font-bold outline-none focus:border-blue-500 transition-all text-sm"
                                            placeholder="+91..."
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={nextStep}
                                    className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                                >
                                    Next Step <ArrowRight size={16} />
                                </button>

                                <div className="relative py-4">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-100 dark:border-slate-800"></div>
                                    </div>
                                    <div className="relative flex justify-center text-[8px] uppercase font-black tracking-widest">
                                        <span className="bg-white dark:bg-slate-900 px-4 text-slate-400">Social Integration</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handleGoogleSignup}
                                    type="button"
                                    className="w-full py-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all group"
                                >
                                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Continue with Google</span>
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2" {...containerVariants}
                            className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-[3rem] p-10 shadow-2xl"
                        >
                            {/* Inner Progress Indicators */}
                            <div className="flex justify-between mb-10 px-4">
                                {[1, 2, 3].map((s) => (
                                    <div key={s} className="flex flex-col items-center gap-2">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-500 shadow-sm ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-300'
                                            }`}>
                                            {step > s ? <CheckCircle2 size={16} /> : s}
                                        </div>
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${step >= s ? 'text-blue-600' : 'text-slate-300'
                                            }`}>
                                            {s === 1 ? 'Primary' : s === 2 ? 'Academic' : 'Security'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center mb-10">
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 italic">Academic Details</h1>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enter your student information</p>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">!</div>
                                        <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Register No / ID</label>
                                    <div className="relative group">
                                        <GraduationCap className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            required
                                            value={formData.regNo}
                                            onChange={(e) => setFormData({ ...formData, regNo: e.target.value })}
                                            className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 font-bold outline-none focus:border-blue-500 transition-all text-sm uppercase"
                                            placeholder="STU-XXXXX"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Department</label>
                                    <div className="relative group">
                                        <Building2 className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <select
                                            required
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full pl-14 pr-10 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 font-bold outline-none focus:border-blue-500 transition-all text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">Select Department</option>
                                            {departments.map((dept) => (
                                                <option key={dept} value={dept}>{dept}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Year</label>
                                    <div className="relative group flex items-center">
                                        <Calendar className="absolute left-5 w-5 h-5 text-slate-300" />
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
                                <div className="flex gap-4">
                                    <button onClick={prevStep} className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 hover:bg-slate-50 transition-all">
                                        <ArrowLeft size={20} />
                                    </button>
                                    <button
                                        onClick={nextStep}
                                        className="flex-1 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                                    >
                                        Next Step <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3" {...containerVariants}
                            className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-[3rem] p-10 shadow-2xl"
                        >
                            {/* Inner Progress Indicators */}
                            <div className="flex justify-between mb-10 px-4">
                                {[1, 2, 3].map((s) => (
                                    <div key={s} className="flex flex-col items-center gap-2">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all duration-500 shadow-sm ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-300'
                                            }`}>
                                            {step > s ? <CheckCircle2 size={16} /> : s}
                                        </div>
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${step >= s ? 'text-blue-600' : 'text-slate-300'
                                            }`}>
                                            {s === 1 ? 'Primary' : s === 2 ? 'Academic' : 'Security'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <div className="text-center mb-10">
                                <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2 italic">Security</h1>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Choose your password</p>
                            </div>

                            <AnimatePresence>
                                {error && (
                                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                        className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">!</div>
                                        <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider">{error}</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <form onSubmit={handleSignup} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Create Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            required
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full pl-14 pr-12 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 font-bold outline-none focus:border-blue-500 transition-all text-sm"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                                    <div className="relative group">
                                        <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                        <input
                                            required
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={formData.confirmPassword}
                                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            className="w-full pl-14 pr-12 py-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 font-bold outline-none focus:border-blue-500 transition-all text-sm"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <button type="button" onClick={prevStep} className="p-5 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-400 hover:bg-slate-50 transition-all">
                                        <ArrowLeft size={20} />
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex-1 py-5 bg-slate-900 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all text-[10px] uppercase tracking-widest disabled:opacity-50"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="animate-spin text-blue-500" size={18} />
                                                Creating Account...
                                            </>
                                        ) : (
                                            <>
                                                Create Account <ArrowRight size={16} />
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white/[0.04] backdrop-blur-2xl border border-white/[0.08] rounded-[3rem] p-10 shadow-2xl text-center space-y-8"
                        >
                            {/* Animated check */}
                            <div className="relative mx-auto w-24 h-24">
                                <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                                <div className="relative w-24 h-24 bg-emerald-500/15 rounded-full flex items-center justify-center border border-emerald-500/30">
                                    <CheckCircle2 size={48} className="text-emerald-400" />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h1 className="text-3xl font-black text-white leading-none italic">Account Created!</h1>
                                <p className="text-[11px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">
                                    Welcome to NexPrint, {formData.fullName.split(' ')[0] || 'there'}!
                                </p>
                            </div>

                            {/* Next steps */}
                            <div className="text-left space-y-3 bg-white/[0.04] rounded-2xl p-5 border border-white/[0.06]">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3">Next Steps</p>
                                {[
                                    { icon: '📧', text: `Verify your email at ${formData.email}` },
                                    { icon: '🔑', text: 'Click the link in the email to activate' },
                                    { icon: '🖨️', text: 'Start your first print order!' },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <span className="text-base">{item.icon}</span>
                                        <p className="text-xs font-bold text-white/60 leading-snug">{item.text}</p>
                                    </div>
                                ))}
                            </div>

                            <Link
                                href="/login"
                                className="block w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-blue-500/20"
                            >
                                Go to Login →
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>

                <p className="mt-12 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Already have an account? <Link href="/login" className="text-blue-600 hover:underline decoration-2 underline-offset-4">Login Here</Link>
                </p>
            </div>
        </div>
    );
}
