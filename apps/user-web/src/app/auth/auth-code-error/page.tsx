'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, RefreshCw, MessageSquare } from 'lucide-react';

function AuthErrorContent() {
    const searchParams = useSearchParams();
    const error = searchParams.get('error_description') || searchParams.get('error') || 'Authentication flow interrupted';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-outfit flex items-center justify-center p-6">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-100/10 via-transparent to-transparent -z-10" />

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[3rem] p-12 shadow-2xl border border-slate-100 dark:border-slate-800 text-center space-y-8"
            >
                <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto shadow-sm">
                    <ShieldAlert size={40} />
                </div>

                <div className="space-y-3">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-none italic uppercase tracking-tight">Login Failed</h1>
                    <div className="p-4 bg-red-50/50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20">
                        <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase tracking-widest leading-relaxed">
                            {error}
                        </p>
                    </div>
                </div>

                <div className="space-y-3 pt-4">
                    <Link
                        href="/signup"
                        className="flex items-center justify-center gap-3 w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl"
                    >
                        <RefreshCw size={14} /> Try Again
                    </Link>
                    <Link
                        href="/"
                        className="flex items-center justify-center gap-3 w-full py-5 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 active:scale-95 transition-all"
                    >
                        <ArrowLeft size={14} /> Go Back
                    </Link>
                </div>

                <div className="pt-6 border-t border-slate-50 dark:border-slate-800">
                    <p className="text-[9px] text-slate-300 font-bold uppercase tracking-[0.2em] leading-relaxed">
                        If this persists, ensures Google Auth is enabled in your Supabase Dashboard and Redirect URLs are whitelisted.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 dark:bg-slate-950" />}>
            <AuthErrorContent />
        </Suspense>
    );
}
