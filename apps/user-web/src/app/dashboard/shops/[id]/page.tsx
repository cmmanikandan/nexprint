'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import {
    ChevronRight, Loader2, MapPin, Star, Clock, Phone, Mail,
    Printer, ArrowLeft, CheckCircle2, Navigation, Copy
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [shop, setShop] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShop = async () => {
            try {
                const { data, error } = await supabase
                    .from('print_shops')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error || !data) {
                    router.push('/dashboard/shops');
                    return;
                }
                setShop(data);
            } catch (error) {
                console.error('Shop fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchShop();
    }, [id, router]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!shop) return null;

    const isOpen = shop.status === 'open';

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/shops" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                        <ArrowLeft size={20} />
                    </Link>
                    <h1 className="text-xl font-black text-slate-900 truncate">{shop.name}</h1>
                </div>
            </header>

            <main className="max-w-md mx-auto px-5 pt-6 space-y-5">
                {/* Shop Header Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden"
                >
                    <div className="flex items-start gap-5 mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20 shrink-0">
                            {shop.image_url ? (
                                <img src={shop.image_url} alt={shop.name} className="w-full h-full object-cover rounded-2xl" />
                            ) : (
                                <span className="text-2xl font-black text-white italic">{shop.name.charAt(0)}</span>
                            )}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-xl font-black text-slate-900 leading-tight mb-1">{shop.name}</h2>
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${isOpen ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                    {isOpen ? 'Open Now' : shop.status === 'busy' ? 'Busy' : 'Closed'}
                                </div>
                                <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-black">
                                    <Star size={12} fill="currentColor" />
                                    {shop.rating || '4.8'}
                                    <span className="text-slate-400 font-bold ml-0.5">({shop.total_ratings || 0})</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {shop.description && (
                        <p className="text-xs font-medium text-slate-500 leading-relaxed mb-6">{shop.description}</p>
                    )}

                    <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-blue-500 opacity-10 blur-2xl rounded-full" />
                </motion.div>

                {/* Info Cards */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-5"
                >
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shop Information</h3>

                    <div className="flex items-start gap-4 py-3 border-b border-slate-50">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                            <MapPin size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Address</p>
                            <p className="text-xs font-bold text-slate-700">{shop.address || 'Campus Hub, Sector 45'}</p>
                        </div>
                    </div>

                    {shop.phone && (
                        <div className="flex items-start gap-4 py-3 border-b border-slate-50">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                                <Phone size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone</p>
                                <p className="text-xs font-bold text-slate-700">{shop.phone}</p>
                            </div>
                        </div>
                    )}

                    {shop.email && (
                        <div className="flex items-start gap-4 py-3 border-b border-slate-50">
                            <div className="w-10 h-10 bg-violet-50 text-violet-600 rounded-xl flex items-center justify-center shrink-0">
                                <Mail size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Email</p>
                                <p className="text-xs font-bold text-slate-700">{shop.email}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-start gap-4 py-3">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                            <Clock size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Timing</p>
                            <p className="text-xs font-bold text-slate-700">
                                {shop.open_time && shop.close_time
                                    ? `${shop.open_time} — ${shop.close_time}`
                                    : '9:00 AM — 9:00 PM'}
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Pricing */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-5"
                >
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pricing</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 rounded-2xl p-5 text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">B&W / page</p>
                            <p className="text-2xl font-black text-slate-900 italic">₹{shop.bw_price_per_page || '0.50'}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-5 text-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Color / page</p>
                            <p className="text-2xl font-black text-slate-900 italic">₹{shop.color_price_per_page || '2.00'}</p>
                        </div>
                    </div>

                    {shop.delivery_available && (
                        <div className="flex items-center gap-2 py-3 justify-center">
                            <CheckCircle2 size={14} className="text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Delivery Available</span>
                        </div>
                    )}
                </motion.div>

                {/* Action Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <Link
                        href="/dashboard/print-files"
                        className="block w-full py-5 bg-blue-600 text-white rounded-3xl text-[10px] font-black uppercase tracking-widest text-center active:scale-95 transition-all shadow-xl shadow-blue-500/20"
                    >
                        <div className="flex items-center justify-center gap-3">
                            <Printer size={18} />
                            Print at this Shop
                        </div>
                    </Link>
                </motion.div>
            </main>
        </div>
    );
}
