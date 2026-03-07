'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Star,
    MessageSquare,
    User,
    Calendar,
    Filter,
    ArrowRight,
    TrendingUp,
    Award,
    AlertCircle,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeedbackPage() {
    const [feedback, setFeedback] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [shop, setShop] = useState<any>(null);
    const [filter, setFilter] = useState('all'); // all, pending, resolved
    const [stats, setStats] = useState({
        average: 0,
        total: 0,
        positive: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: shopData } = await supabase
                    .from('print_shops')
                    .select('id, name')
                    .eq('owner_id', user.id)
                    .single();

                if (shopData) {
                    setShop(shopData);
                    const { data: feedbackData, error: fbError } = await supabase
                        .from('feedback')
                        .select(`
                          id, order_id, shop_id, user_id, rating, comment, created_at,
                          profiles(full_name, avatar_url),
                          orders(order_number, total_amount, status)
                        `)
                        .eq('shop_id', shopData.id)
                        .order('created_at', { ascending: false });

                    if (fbError) {
                        console.error('Feedback fetch error:', fbError);
                    }

                    if (feedbackData) {
                        setFeedback(feedbackData);

                        // Calculate Stats
                        const total = feedbackData.length;
                        const avg = total > 0 ? feedbackData.reduce((acc, curr) => acc + curr.rating, 0) / total : 0;
                        const pos = feedbackData.filter(f => f.rating >= 4).length;

                        setStats({
                            average: Number(avg.toFixed(1)),
                            total,
                            positive: pos
                        });
                    }
                }
            } catch (error) {
                console.error('Error fetching feedback:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // Subscribe to new feedback
        const channel = supabase
            .channel('new-feedback')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'feedback'
            }, () => {
                fetchData();
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, []);

    const toggleResolved = async (id: string, current: boolean) => {
        try {
            const { error } = await supabase
                .from('feedback')
                .update({ is_resolved: !current })
                .eq('id', id);

            if (error) throw error;
            setFeedback(prev => prev.map(f => f.id === id ? { ...f, is_resolved: !current } : f));
        } catch (error: any) {
            alert(error.message);
        }
    };

    const filteredFeedback = feedback.filter(f => {
        if (filter === 'all') return true;
        if (filter === 'pending') return !f.is_resolved;
        if (filter === 'resolved') return f.is_resolved;
        return true;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            {/* Header & Stats Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Feedback Hub</h1>
                    <p className="text-slate-500 font-medium mt-1">Real-time intelligence from your customers</p>
                </div>

                <div className="flex gap-4">
                    <div className="px-6 py-4 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                            <Star size={24} fill="currentColor" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Avg Rating</p>
                            <h3 className="text-xl font-black text-slate-900">{stats.average} / 5</h3>
                        </div>
                    </div>

                    <div className="px-6 py-4 bg-white border border-slate-100 rounded-[2rem] shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Positivity</p>
                            <h3 className="text-xl font-black text-slate-900">{stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0}%</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 bg-slate-100/50 p-1 rounded-2xl w-fit">
                {['all', 'pending', 'resolved'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filter === f
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Feedback Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                    {filteredFeedback.map((item, index) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                            className={`bg-white border p-6 rounded-[2.5rem] shadow-sm relative overflow-hidden group ${item.is_resolved ? 'border-slate-100 opacity-75' : 'border-blue-100'
                                }`}
                        >
                            {/* Top Row: User & Rating */}
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl border-2 border-white shadow-sm flex items-center justify-center text-slate-400 overflow-hidden">
                                        {item.profiles?.avatar_url ? (
                                            <img src={item.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 leading-none mb-1">
                                            {item.profiles?.full_name || 'Anonymous User'}
                                        </h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                            Order #{item.orders?.order_number}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-0.5">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                            key={s}
                                            size={14}
                                            fill={s <= item.rating ? '#F59E0B' : 'transparent'}
                                            stroke={s <= item.rating ? '#F59E0B' : '#CBD5E1'}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Comment */}
                            <div className="bg-slate-50 rounded-2xl p-4 mb-4 relative">
                                <MessageSquare className="absolute -top-2 -left-2 text-blue-100" size={24} />
                                <p className="text-xs font-bold text-slate-700 leading-relaxed italic">
                                    "{item.comment}"
                                </p>
                            </div>

                            {/* Footer Meta */}
                            <div className="flex justify-between items-center pt-4 border-t border-slate-50 mt-auto">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <Clock size={12} />
                                        {new Date(item.created_at).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <CheckCircle2 size={12} className={item.is_resolved ? 'text-emerald-500' : 'text-slate-300'} />
                                        {item.is_resolved ? 'Resolved' : 'Pending'}
                                    </div>
                                </div>

                                <button
                                    onClick={() => toggleResolved(item.id, item.is_resolved)}
                                    className={`p-2 rounded-xl transition-all ${item.is_resolved
                                        ? 'bg-slate-50 text-slate-400 hover:bg-white border border-slate-100'
                                        : 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:scale-105 hover:bg-blue-700'
                                        }`}
                                    title={item.is_resolved ? "Mark as Pending" : "Mark as Resolved"}
                                >
                                    <ArrowRight size={16} />
                                </button>
                            </div>

                            {/* Background Accent */}
                            {!item.is_resolved && (
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredFeedback.length === 0 && (
                    <div className="col-span-full py-20 bg-white border-2 border-dashed border-slate-100 rounded-[3rem] text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto text-slate-200">
                            <MessageSquare size={40} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-300 uppercase tracking-widest">No Feedback Yet</h3>
                            <p className="text-slate-400 text-xs font-bold">Feedback will appear here once customers rate their orders</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
