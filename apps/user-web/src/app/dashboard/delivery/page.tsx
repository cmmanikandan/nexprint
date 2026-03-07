'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Truck, Package } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DeliveryPage() {
    const router = useRouter();

    useEffect(() => {
        // Smart redirect: delivery partners → /delivery-hub, users → /dashboard/orders
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            if (!session) { router.replace('/dashboard/orders'); return; }
            const { data: profile } = await supabase
                .from('profiles').select('role').eq('id', session.user.id).single();
            if (profile?.role === 'delivery_partner') {
                router.replace('/delivery-hub');
            } else {
                setTimeout(() => router.replace('/dashboard/orders'), 1800);
            }
        });
    }, [router]);

    return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center px-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-sm w-full text-center space-y-6"
            >
                <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-3xl flex items-center justify-center mx-auto shadow-lg"
                >
                    <Truck size={36} />
                </motion.div>
                <div>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                        Redirecting…
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Taking you to the right place.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Link href="/dashboard/orders"
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
                        <Package size={14} /> My Orders
                    </Link>
                    <Link href="/delivery-hub"
                        className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">
                        <Truck size={14} /> Delivery Hub
                    </Link>
                </div>
            </motion.div>
        </div>
    );
}
