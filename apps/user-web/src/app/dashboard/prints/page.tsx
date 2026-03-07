'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2, LayoutGrid, MapPin, User, ChevronRight, Search, Clock, CheckCircle2, Clock3 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ThemeToggle from '@/components/ThemeToggle';

export default function PrintsPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { router.push('/login'); return; }

                const { data } = await supabase
                    .from('orders')
                    .select('*, print_shops(name)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false });

                setOrders(data || []);
            } catch (error) {
                console.error('Orders fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, [router]);

    const filteredOrders = orders.filter(o =>
        filter === 'all' ||
        (filter === 'active' && !['completed', 'cancelled'].includes(o.status)) ||
        (filter === 'completed' && o.status === 'completed')
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Loading your prints...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans text-[var(--foreground)] bg-[var(--background)] pb-32">
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 sticky top-0 z-50">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <ChevronRight className="rotate-180" size={20} />
                        </Link>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white">Print Orders</h1>
                    </div>
                    <ThemeToggle />
                </div>

                <div className="flex gap-2 p-1.5 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    {['all', 'active', 'completed'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${filter === f ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </header>

            <main className="max-w-md mx-auto px-5 pt-8 space-y-4">
                {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                    <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${order.status === 'delivered' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                    }`}>
                                    {order.status === 'delivered' ? <CheckCircle2 size={24} /> : <Clock3 size={24} />}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1.5 truncate">
                                        JOB #{order.order_number?.slice(-8) || 'NEX'}
                                    </h3>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">
                                        {order.print_shops?.name || 'Loading Hub...'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-slate-900 dark:text-white italic">₹{order.total_amount}</p>
                                <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 uppercase mt-0.5 tracking-widest">
                                    {new Date(order.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 mb-6">
                            <div className={`px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest border ${order.status === 'delivered' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40' :
                                'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/40'
                                }`}>
                                {order.status?.replace(/_/g, ' ')}
                            </div>
                            <div className="px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700 flex items-center gap-1.5">
                                <FileText size={10} />
                                Multi-File Order
                            </div>
                        </div>

                        <Link href={`/dashboard/prints/${order.id}`} className="w-full flex items-center justify-center gap-2 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:bg-blue-600 dark:hover:bg-blue-600 hover:text-white transition-all group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                            Track Status
                        </Link>
                    </motion.div>
                )) : (
                    <div className="py-20 text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                            <FileText size={32} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">No matching orders</p>
                            <p className="text-[10px] text-slate-300 dark:text-slate-600 uppercase tracking-widest">Your printing history is clear</p>
                        </div>
                    </div>
                )}
            </main>

        </div>
    );
}
