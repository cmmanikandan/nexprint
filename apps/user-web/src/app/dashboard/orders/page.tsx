'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Star, MessageSquare, CheckCircle2, Search, Calendar, Filter, X, Clock, Printer, Package, AlertCircle, Zap, FileText, Eye, Download, MapPin, Phone, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ThemeToggle from '@/components/ThemeToggle';

const STATUS_STEPS = [
    { key: 'placed', label: 'Order Placed', icon: '📋', desc: 'Your order has been received.' },
    { key: 'shop_accepted', label: 'Shop Confirmed', icon: '✅', desc: 'Print shop has accepted your job.' },
    { key: 'printing', label: 'Printing', icon: '🖨️', desc: 'Files are being printed right now.' },
    { key: 'ready_for_pickup', label: 'Ready for Pickup', icon: '📦', desc: 'Your prints are ready! Come collect them.' },
    { key: 'completed', label: 'Completed', icon: '🎉', desc: 'Order successfully handed over.' },
];

function StatusTracker({ status }: { status: string }) {
    const currentIdx = STATUS_STEPS.findIndex(s => s.key === status);
    const current = STATUS_STEPS[currentIdx] || STATUS_STEPS[0];

    return (
        <div className="py-6">
            <div className="flex items-center gap-0 mb-6">
                {STATUS_STEPS.map((step, i) => {
                    const done = i < currentIdx;
                    const active = i === currentIdx;
                    return (
                        <div key={step.key} className="flex items-center flex-1">
                            <div className="flex flex-col items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-500 shadow-lg
                  ${done ? 'bg-emerald-500 scale-90' : active ? 'bg-blue-600 scale-110 ring-4 ring-blue-100' : 'bg-slate-100'}`}>
                                    {done ? '✓' : step.icon}
                                </div>
                                <p className={`text-[8px] font-black uppercase tracking-widest mt-2 text-center max-w-[60px] leading-tight
                  ${active ? 'text-blue-600' : done ? 'text-emerald-600' : 'text-slate-300'}`}>
                                    {step.label}
                                </p>
                            </div>
                            {i < STATUS_STEPS.length - 1 && (
                                <div className={`flex-1 h-1 mx-1 rounded-full transition-all duration-700
                  ${done ? 'bg-emerald-400' : 'bg-slate-100'}`} />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className={`p-5 rounded-3xl text-center ${status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20' :
                status === 'ready_for_pickup' ? 'bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20' :
                    'bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20'}`}>
                <p className={`text-sm font-black ${status === 'completed' ? 'text-emerald-700 dark:text-emerald-400' :
                    status === 'ready_for_pickup' ? 'text-amber-700 dark:text-amber-400' : 'text-blue-700 dark:text-blue-400'}`}>
                    {current.desc}
                </p>
                {status === 'ready_for_pickup' && (
                    <p className="text-[10px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest mt-2 animate-pulse">
                        Show your order QR at the counter!
                    </p>
                )}
            </div>
        </div>
    );
}

export default function OrderHistoryPage() {
    type OrderRow = {
        id: string;
        status: string;
        created_at: string;
        order_number?: string;
        print_shops?: { name?: string; address?: string; phone?: string } | null;
        [key: string]: any;
    };

    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
    const [comment, setComment] = useState('');
    const [rating, setRating] = useState(5);
    const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null);

    const [filterTab, setFilterTab] = useState<'all' | 'today' | 'active' | 'completed'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [previewFile, setPreviewFile] = useState<{ url: string, name: string } | null>(null);

    const fetchOrders = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('orders')
            .select('*, order_items(*), print_shops(name, address, phone)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        const orderList: OrderRow[] = (data || []) as OrderRow[];
        setOrders(orderList);
        const active = orderList.find((o) => !['completed', 'cancelled'].includes(o.status));
        if (active && !activeOrderId) setActiveOrderId(active.id);
        setLoading(false);
    };

    useEffect(() => {
        fetchOrders();
        const channel = supabase
            .channel('user-orders-tracking')
            .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders())
            .on('postgres_changes' as any, { event: '*', schema: 'public', table: 'order_items' }, () => fetchOrders())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleSubmitFeedback = async (orderId: string, shopId: string) => {
        if (!comment.trim()) return;
        setSubmittingFeedback(orderId);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { error } = await supabase.from('feedback').insert({ order_id: orderId, shop_id: shopId, user_id: user.id, rating: rating, comment: comment });
            if (error) throw error;
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, feedback_given: true } : o));
            setComment('');
            setRating(5);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setSubmittingFeedback(null);
        }
    };

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'completed': return { bg: 'bg-white dark:bg-slate-900', border: 'border-slate-100 dark:border-slate-800', accent: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', icon: <CheckCircle2 size={16} />, glow: 'shadow-emerald-500/5', side: 'bg-emerald-500' };
            case 'ready_for_pickup': return { bg: 'bg-white dark:bg-slate-900', border: 'border-amber-100 dark:border-amber-900/50', accent: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', icon: <Package size={16} />, glow: 'shadow-amber-500/10', side: 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]' };
            case 'printing': return { bg: 'bg-white dark:bg-slate-900', border: 'border-indigo-100 dark:border-indigo-900/50', accent: 'bg-indigo-600', text: 'text-indigo-600 dark:text-indigo-400', icon: <Printer size={16} className="animate-pulse" />, glow: 'shadow-indigo-500/10', side: 'bg-indigo-600 shadow-[0_0_15px_rgba(79,70,229,0.4)]' };
            case 'shop_accepted': return { bg: 'bg-white dark:bg-slate-900', border: 'border-blue-100 dark:border-blue-900/50', accent: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400', icon: <CheckCircle2 size={16} />, glow: 'shadow-blue-500/10', side: 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]' };
            case 'cancelled': return { bg: 'bg-white dark:bg-slate-900', border: 'border-slate-100 dark:border-slate-800', accent: 'bg-slate-300', text: 'text-slate-400 dark:text-slate-500', icon: <AlertCircle size={16} />, glow: 'shadow-slate-500/5', side: 'bg-slate-300' };
            default: return { bg: 'bg-white dark:bg-slate-900', border: 'border-slate-50 dark:border-slate-800', accent: 'bg-slate-900', text: 'text-slate-900 dark:text-white', icon: <Clock size={16} />, glow: 'shadow-slate-500/5', side: 'bg-slate-200 dark:bg-slate-700' };
        }
    };

    const filteredOrders = orders.filter(o => {
        if (filterTab === 'today') {
            const today = new Date().toDateString();
            if (new Date(o.created_at).toDateString() !== today) return false;
        } else if (filterTab === 'active') {
            if (['completed', 'cancelled'].includes(o.status)) return false;
        } else if (filterTab === 'completed') {
            if (o.status !== 'completed') return false;
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            const matchesId = o.order_number?.toLowerCase().includes(q);
            const matchesShop = o.print_shops?.name?.toLowerCase().includes(q);
            if (!matchesId && !matchesShop) return false;
        }
        if (selectedDate) {
            if (new Date(o.created_at).toISOString().split('T')[0] !== selectedDate) return false;
        }
        return true;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Loading orders...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 font-sans pb-32">
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800">
                <div className="px-6 pt-5 pb-4">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white italic">Order History</h1>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">Your Printing Feed • {filteredOrders.length} records</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <ThemeToggle />
                            <div className="relative">
                                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10" />
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${selectedDate ? 'bg-blue-600 border-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                    <Calendar size={18} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl flex items-center px-4 py-2.5 gap-3 border border-slate-100/50 dark:border-slate-700/50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                            <Search size={16} className="text-slate-400" />
                            <input placeholder="Search for Order ID or Shop..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-[11px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300 w-full placeholder:text-slate-300 dark:placeholder:text-slate-600" />
                            {searchQuery && <button onClick={() => setSearchQuery('')} className="text-slate-300 hover:text-slate-500"><X size={14} /></button>}
                        </div>
                        <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-2xl w-full">
                            {['all', 'today', 'active', 'completed'].map((tab) => (
                                <button key={tab} onClick={() => setFilterTab(tab as any)} className={`flex-1 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all ${filterTab === tab ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}>{tab}</button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <div className="max-w-2xl mx-auto px-4 pt-6 space-y-4">
                {filteredOrders.length === 0 && (
                    <div className="py-32 text-center">
                        <div className="text-5xl mb-4">🖨️</div>
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No orders yet</p>
                        <Link href="/dashboard/shops" className="mt-6 inline-block px-8 py-4 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-3xl hover:bg-blue-700 shadow-xl shadow-blue-500/20 transition-all">Find a Print Shop</Link>
                    </div>
                )}

                {filteredOrders.map((order) => {
                    const isActive = !['completed', 'cancelled'].includes(order.status);
                    const isExpanded = activeOrderId === order.id;
                    const theme = getStatusTheme(order.status);

                    return (
                        <div key={order.id} className={`group relative bg-white dark:bg-slate-900 rounded-[2rem] border ${theme.border} overflow-hidden transition-all duration-300 shadow-sm ${theme.glow} ${isExpanded ? 'scale-[1.02]' : ''}`}>
                            <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${theme.side} transition-all duration-500`} />

                            <button className="w-full p-6 flex flex-col gap-4 text-left" onClick={() => setActiveOrderId(isExpanded ? null : order.id)}>
                                <div className="flex justify-between items-start w-full">
                                    <div className="flex gap-4 items-center">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 bg-slate-50 dark:bg-slate-800 ${theme.text} border border-slate-100 dark:border-slate-700`}>{theme.icon}</div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight italic">ORDER #{order.order_number?.slice(-6).toUpperCase()}</h3>
                                                {order.is_emergency && <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping" />}
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-1">{order.print_shops?.name || 'Hub Location'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-slate-900 dark:text-white italic leading-none">₹{order.total_amount}</p>
                                        <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 mt-1 uppercase tracking-widest">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className={`px-4 py-2 rounded-xl text-[8px] font-bold uppercase tracking-widest flex items-center gap-2 ${theme.bg} ${theme.text} border border-current opacity-80 backdrop-blur-sm`}><div className={`w-1 h-1 rounded-full ${theme.accent} animate-pulse`} />{order.status?.replace(/_/g, ' ')}</div>
                                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800 text-[8px] font-bold text-slate-400 uppercase tracking-widest rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-2 transition-all">
                                        <FileText size={10} className={order.order_items?.length ? 'text-blue-500' : 'animate-pulse text-amber-500'} />
                                        {order.order_items?.length ? `${order.order_items.length} Files` : 'Syncing Files...'}
                                    </div>
                                    {order.is_emergency && <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-500 text-[8px] font-bold uppercase tracking-widest rounded-xl border border-red-100 dark:border-red-800 flex items-center gap-2"><Zap size={10} /> Express</div>}
                                </div>
                                {!isExpanded && isActive && <div className="w-full h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all"><p className="text-[9px] font-bold text-slate-300 group-hover:text-blue-600 uppercase tracking-[0.3em] transition-all italic">Track Progress</p></div>}
                            </button>

                            {isExpanded && (
                                <div className="px-6 pb-6 border-t border-slate-50 dark:border-slate-800">
                                    <StatusTracker status={order.status} />
                                    <div className="space-y-2">
                                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Documents in this order</p>
                                        {(order.order_items || []).map((item: any) => (
                                            <div key={item.id} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                                <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-base flex-shrink-0">📄</div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.file_name}</p>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase">{item.print_type} • {item.total_pages} pages • {item.copies} copies</p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setPreviewFile({ url: item.file_url, name: item.file_name })} className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 transition-all shadow-sm"><Eye size={14} /></button>
                                                    <a href={item.file_url} download={item.file_name} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-100 transition-all shadow-sm"><Download size={14} /></a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-4 p-5 rounded-[1.8rem] border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-3 text-slate-200 dark:text-slate-700 group-hover:text-blue-500 transition-colors">{order.delivery_needed ? <Zap size={20} /> : <MapPin size={20} />}</div>
                                        {order.delivery_needed ? (
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">🚀 Delivery Address</p>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-300">{order.delivery_address}</p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold italic">Note: {order.delivery_notes || 'No instructions'}</p>
                                                <div className="flex gap-2 mt-2"><span className={`px-3 py-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-lg text-[8px] font-bold uppercase ${order.delivery_status === 'delivered' ? 'text-emerald-500' : 'text-blue-500'}`}>{order.delivery_status || 'Pending'}</span></div>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">📍 Pickup Spot</p>
                                                <p className="text-xs font-bold text-slate-800 dark:text-slate-300">{order.print_shops?.name || 'Local Shop'}</p>
                                                <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold">{order.print_shops?.address}</p>
                                                {order.status !== 'completed' && order.status !== 'cancelled' && (
                                                    <button onClick={(e) => {
                                                        e.stopPropagation();
                                                        const addr = prompt("Enter delivery location (e.g. Block C, Room 202):");
                                                        if (addr) {
                                                            const notes = prompt("Any extra delivery instructions? (e.g. Leave at gate):");
                                                            supabase.from('orders').update({
                                                                delivery_needed: true,
                                                                delivery_address: addr,
                                                                delivery_notes: notes || '',
                                                                delivery_fee: 20,
                                                                total_amount: Number(order.total_amount) + 20
                                                            }).eq('id', order.id).then(() => fetchOrders());
                                                        }
                                                    }} className="mt-3 w-full py-2.5 bg-blue-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">Change to Delivery (+₹20)</button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {order.status === 'completed' && !order.feedback_given && (
                                        <div className="mt-6 p-6 bg-blue-50/50 dark:bg-blue-500/10 rounded-3xl border border-blue-100/50 dark:border-blue-500/20 space-y-4">
                                            <div className="flex gap-2">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <button key={s} onClick={() => setRating(s)} className="transition-transform active:scale-90"><Star size={24} fill={s <= rating ? '#3B82F6' : 'transparent'} stroke={s <= rating ? '#3B82F6' : '#CBD5E1'} /></button>
                                                ))}
                                            </div>
                                            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Review..." className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-xs font-bold text-slate-700 dark:text-slate-300 h-20 outline-none focus:border-blue-500 transition-all" />
                                            <button onClick={() => handleSubmitFeedback(order.id, order.shop_id)} disabled={submittingFeedback === order.id || !comment.trim()} className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-500 transition-all">{submittingFeedback === order.id ? 'Submitting...' : 'Submit Review'}</button>
                                        </div>
                                    )}
                                    {order.status === 'completed' && (
                                        <Link
                                            href={`/dashboard/print-files?shop=${order.shop_id}&repeat=${order.order_number?.slice(-6)}`}
                                            onClick={() => setActiveOrderId(null)}
                                            className="mt-3 w-full py-4 bg-blue-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                                        >
                                            <Printer size={14} /> Repeat This Order
                                        </Link>
                                    )}
                                    {order.status === 'completed' && (
                                        <button onClick={(e) => { e.stopPropagation(); const shopPhone = order.print_shops?.phone?.replace(/\D/g, '') || '911234567890'; window.open(`https://wa.me/${shopPhone}?text=${encodeURIComponent(`Invoice for Order #${order.order_number?.slice(-6)}`)}`, '_blank'); }} className="mt-2 w-full py-4 bg-emerald-500 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3">Get WhatsApp Invoice</button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <AnimatePresence>
                {previewFile && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setPreviewFile(null)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-4xl h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-white/5" onClick={e => e.stopPropagation()}>
                            <div className="p-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">{previewFile.name}</h3>
                                </div>
                                <button onClick={() => setPreviewFile(null)} className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all active:scale-95"><X size={18} /></button>
                            </div>
                            <div className="flex-1 bg-slate-100 dark:bg-slate-950">
                                {String(previewFile.url).includes('nexprint://') ?
                                    <div className="flex items-center justify-center h-full text-center p-8"><p className="text-sm font-black text-slate-900 dark:text-white">Syncing with Shop...</p></div> :
                                    <iframe src={previewFile.url} className="w-full h-full border-none" title="Document Preview" />
                                }
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
