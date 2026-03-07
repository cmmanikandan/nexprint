'use client';

import { motion } from 'framer-motion';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${className}`}
            {...props}
        />
    );
}

export function DashboardSkeleton() {
    return (
        <div className="max-w-md mx-auto px-5 pt-8 space-y-8">
            {/* Analytics Card Skeleton */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 space-y-6">
                <div className="flex justify-between items-center">
                    <Skeleton className="w-20 h-3 bg-slate-700" />
                    <Skeleton className="w-4 h-4 rounded-full bg-slate-700" />
                </div>
                <div className="flex items-baseline gap-2">
                    <Skeleton className="w-32 h-10 bg-slate-700" />
                    <Skeleton className="w-16 h-3 bg-slate-700" />
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div className="space-y-2">
                        <Skeleton className="w-12 h-2 bg-slate-700" />
                        <Skeleton className="w-8 h-6 bg-slate-700" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="w-12 h-2 bg-slate-700" />
                        <Skeleton className="w-8 h-6 bg-slate-700" />
                    </div>
                </div>
                <Skeleton className="w-full h-12 rounded-2xl bg-slate-700" />
            </div>

            {/* Actions Grid Skeleton */}
            <div className="grid grid-cols-1 gap-3">
                <Skeleton className="w-full h-24 rounded-[2rem]" />
                <div className="grid grid-cols-2 gap-3">
                    <Skeleton className="w-full h-32 rounded-[1.8rem]" />
                    <Skeleton className="w-full h-32 rounded-[1.8rem]" />
                </div>
            </div>

            {/* List Skeleton */}
            <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                    <Skeleton className="w-24 h-3" />
                    <Skeleton className="w-12 h-3" />
                </div>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <Skeleton className="w-12 h-12 rounded-xl flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="w-2/3 h-3" />
                            <Skeleton className="w-1/3 h-2" />
                        </div>
                        <div className="space-y-2 text-right">
                            <Skeleton className="w-12 h-3 ml-auto" />
                            <Skeleton className="w-16 h-4 rounded-full ml-auto" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
