'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-16 px-10 flex flex-col items-center justify-center text-center bg-white/50 dark:bg-slate-900/50 border border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem]"
        >
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6 relative">
                <Icon size={40} strokeWidth={1.5} />
                <div className="absolute inset-0 bg-blue-500/5 blur-2xl rounded-full" />
            </div>

            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{title}</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2 max-w-[200px] leading-relaxed">
                {description}
            </p>

            {action && (
                <div className="mt-8">
                    {action}
                </div>
            )}
        </motion.div>
    );
}
