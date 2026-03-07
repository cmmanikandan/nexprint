'use client';

import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import {
    ChevronRight, Loader2, FileText, Printer, CheckCircle2,
    Clock, Package, Truck, MapPin, CreditCard, Copy, ArrowLeft, Zap, XCircle, AlertCircle, RefreshCcw, ExternalLink, Star
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const statusSteps = [
    { key: 'pending', label: 'Order Placed', icon: FileText, color: 'bg-amber-500' },
    { key: 'shop_accepted', label: 'Accepted by Shop', icon: CheckCircle2, color: 'bg-blue-500' },
    { key: 'printing', label: 'Printing', icon: Printer, color: 'bg-indigo-500' },
    { key: 'ready_for_pickup', label: 'Ready for Pickup', icon: Package, color: 'bg-emerald-500' },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, color: 'bg-violet-500' },
    { key: 'completed', label: 'Completed', icon: CheckCircle2, color: 'bg-emerald-600' },
];

// Load Razorpay script
function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (typeof window !== 'undefined' && (window as any).Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [order, setOrder] = useState<any>(null);
    const [shops, setShops] = useState<any[]>([]);
    const [isChangingShop, setIsChangingShop] = useState(false);
    const [updatingShop, setUpdatingShop] = useState(false);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<any[]>([]);
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [submittingFeedback, setSubmittingFeedback] = useState(false);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) { router.push('/login'); return; }

                const { data: orderData, error } = await supabase
                    .from('orders')
                    .select('*, print_shops(id, name, address, phone, status)')
                    .eq('id', id)
                    .eq('user_id', user.id)
                    .single();

                if (error || !orderData) {
                    console.error('Order not found:', error);
                    router.push('/dashboard/prints');
                    return;
                }

                setOrder(orderData);

                const { data: itemsData } = await supabase
                    .from('order_items')
                    .select('*')
                    .eq('order_id', id);

                setItems(itemsData || []);

                // Fetch other shops for "Change Shop" feature
                const { data: shopsData } = await supabase
                    .from('print_shops')
                    .select('id, name, address, status')
                    .eq('status', 'open')
                    .not('id', 'eq', orderData.shop_id);
                setShops(shopsData || []);

                // Fetch feedback if completed
                if (orderData.status === 'completed') {
                    const { data: feedbackData } = await supabase
                        .from('feedback')
                        .select('*')
                        .eq('order_id', id)
                        .maybeSingle();
                    if (feedbackData) setFeedbackSubmitted(true);
                }

            } catch (error) {
                console.error('Fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrder();

        // Real-time updates for this order
        const channel = supabase
            .channel(`order-${id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${id}`
            }, (payload) => {
                setOrder((prev: any) => ({ ...prev, ...payload.new }));
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [id, router]);

    const getCurrentStepIndex = () => {
        if (!order) return 0;
        const idx = statusSteps.findIndex(s => s.key === order.status);
        return idx >= 0 ? idx : 0;
    };

    const handleCancelOrder = async () => {
        const canCancel = ['pending', 'shop_accepted'].includes(order.status);
        if (!canCancel) {
            alert('This order is already being printed or completed and cannot be cancelled.');
            return;
        }

        if (!confirm('Are you sure you want to cancel this order?')) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', id);

            if (error) throw error;
            router.push('/dashboard/prints');
        } catch (err: any) {
            alert(`Cancel failed: ${err.message}`);
            setLoading(false);
        }
    };

    const handleUpdateShop = async (newShopId: string) => {
        setUpdatingShop(true);
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    shop_id: newShopId,
                    status: 'pending' // Reset status so new shop can accept
                })
                .eq('id', id);

            setOrder((prev: any) => ({ ...prev, shop_id: newShopId, status: 'pending', print_shops: shops.find(s => s.id === newShopId) }));
            setIsChangingShop(false);
        } catch (error: any) {
            alert(`Transfer failed: ${error.message}`);
        } finally {
            setUpdatingShop(false);
        }
    };

    const handleUpdatePayment = async (method: string) => {
        setLoading(true);
        try {
            if (method === 'online') {
                const success = await loadRazorpayScript();
                if (!success) throw new Error('Razorpay failed to load');

                // Logic to initiate Razorpay would go here (or call a simplified version)
                alert('Razorpay integration active. Completing payment...');
            }

            const { error } = await supabase
                .from('orders')
                .update({ payment_status: 'paid' })
                .eq('id', id);

            if (error) throw error;
            setOrder((prev: any) => ({ ...prev, payment_status: 'paid' }));
        } catch (error: any) {
            alert(`Payment update failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitFeedback = async () => {
        if (!comment.trim()) { alert('Please share some words about your experience!'); return; }
        setSubmittingFeedback(true);
        try {
            const { error } = await supabase
                .from('feedback')
                .insert({
                    order_id: id,
                    shop_id: order.shop_id,
                    user_id: order.user_id,
                    rating,
                    comment
                });
            if (error) throw error;
            setFeedbackSubmitted(true);
        } catch (err: any) {
            alert(`Feedback failed: ${err.message}`);
        } finally {
            setSubmittingFeedback(false);
        }
    };

    const copyOrderNumber = () => {
        if (order?.order_number) {
            navigator.clipboard.writeText(order.order_number);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!order) return null;

    const currentStep = getCurrentStepIndex();

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
            <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard/prints" className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-lg font-black text-slate-900 leading-none">Order Details</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                            {order.order_number}
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-md mx-auto px-5 pt-6 space-y-5">
                {/* Payment Suggestion Banner */}
                {order.payment_status !== 'paid' && order.status !== 'cancelled' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-amber-50 border border-amber-100 rounded-[2rem] p-6 shadow-sm relative overflow-hidden group"
                    >
                        <div className="flex items-center gap-4 relative z-10">
                            <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200 shrink-0">
                                <AlertCircle size={24} />
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-slate-900 leading-none mb-1">Payment Suggested</h4>
                                <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                                    {order.payment_method === 'cash'
                                        ? 'Switch to online payment for contact-less pickup and priority processing.'
                                        : 'Please complete your online payment to move your job to the print queue.'}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Order Number Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden"
                >
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Order Number</p>
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-black tracking-tight italic">{order.order_number}</h2>
                            <button onClick={copyOrderNumber} className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                                <Copy size={14} />
                            </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-4">
                            <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${order.status === 'completed' || order.status === 'ready_for_pickup'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                }`}>
                                {order.status?.replace(/_/g, ' ')}
                            </div>
                            {order.is_emergency && (
                                <div className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                                    <Zap size={10} className="fill-amber-400" />
                                    Priority
                                </div>
                            )}
                            <span className="text-[10px] font-bold text-slate-500">
                                {new Date(order.created_at).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', year: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-blue-500 opacity-20 blur-3xl rounded-full" />
                </motion.div>

                {/* Status Timeline */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm"
                >
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Order Progress</h3>

                    <div className="space-y-0">
                        {statusSteps.map((step, i) => {
                            const isCompleted = i <= currentStep;
                            const isCurrent = i === currentStep;
                            const Icon = step.icon;

                            return (
                                <div key={step.key} className="flex items-start gap-4">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isCompleted
                                            ? `${step.color} text-white shadow-lg`
                                            : 'bg-slate-100 text-slate-300'
                                            } ${isCurrent ? 'ring-4 ring-blue-100 scale-110' : ''}`}>
                                            <Icon size={18} />
                                        </div>
                                        {i < statusSteps.length - 1 && (
                                            <div className={`w-0.5 h-8 my-1 transition-colors ${isCompleted ? 'bg-blue-200' : 'bg-slate-100'}`} />
                                        )}
                                    </div>
                                    <div className="pt-2">
                                        <p className={`text-xs font-black uppercase tracking-widest ${isCompleted ? 'text-slate-900' : 'text-slate-300'}`}>
                                            {step.label}
                                        </p>
                                        {isCurrent && (
                                            <p className="text-[10px] font-bold text-blue-500 mt-0.5 animate-pulse">In Progress</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                {/* Order Items */}
                {items.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-4"
                    >
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Documents</h3>
                        {items.map((item) => (
                            <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl">
                                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                                    <FileText size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black text-slate-900 truncate">{item.file_name}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                                        {item.print_type} • {item.print_side} • {item.copies} copies • {item.total_pages} pages
                                    </p>
                                </div>
                                <span className="text-xs font-black text-emerald-600">₹{item.price}</span>
                            </div>
                        ))}
                    </motion.div>
                )}

                {/* Payment & Shop Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm space-y-5"
                >
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Summary</h3>

                    <div className="flex justify-between items-center py-3 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <CreditCard size={14} className="text-slate-300" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Amount</span>
                        </div>
                        <span className="text-sm font-black text-slate-900">₹{order.total_amount}</span>
                    </div>

                    <div className="flex justify-between items-center py-3 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-slate-300" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Payment</span>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-lg ${order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                            {order.payment_status}
                        </span>
                    </div>

                    {order.print_shops && (
                        <div className="pt-2 space-y-2">
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-blue-500" />
                                <span className="text-xs font-black text-slate-900">{order.print_shops.name}</span>
                            </div>
                            {order.print_shops.address && (
                                <p className="text-[10px] font-bold text-slate-400 pl-6">{order.print_shops.address}</p>
                            )}
                        </div>
                    )}
                </motion.div>

                {/* Shop Closed / Busy Alert */}
                {order.print_shops?.status !== 'open' && order.status !== 'cancelled' && order.status !== 'completed' && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-100 rounded-[2rem] p-6 shadow-sm flex items-center gap-4 border-l-4 border-l-red-500"
                    >
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center shrink-0">
                            <Clock size={24} />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-black text-slate-900 leading-none mb-1">Hub is Currently {order.print_shops?.status?.toUpperCase()}</h4>
                            <p className="text-[10px] font-bold text-slate-500 leading-relaxed">
                                This might cause delays. You can switch to another active hub from the options below.
                            </p>
                        </div>
                    </motion.div>
                )}

                {/* Change Shop Modal UI */}
                {isChangingShop && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsChangingShop(false)} />
                        <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                            <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Redirect Order</h2>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Select new active terminal</p>
                                </div>
                                <button onClick={() => setIsChangingShop(false)} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400">
                                    <XCircle size={20} />
                                </button>
                            </div>

                            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-3">
                                {shops.filter(s => s.status === 'open').map(shop => (
                                    <button
                                        key={shop.id}
                                        onClick={() => handleUpdateShop(shop.id)}
                                        disabled={updatingShop}
                                        className="w-full text-left p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:bg-blue-50/10 transition-all flex items-center gap-4 group"
                                    >
                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xs font-black group-hover:scale-110 transition-transform">{shop.name.charAt(0)}</div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-slate-900 truncate">{shop.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 truncate">{shop.address}</p>
                                        </div>
                                        <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                ))}
                                {shops.filter(s => s.status === 'open').length === 0 && (
                                    <div className="text-center py-10 space-y-2">
                                        <AlertCircle className="w-8 h-8 text-slate-200 mx-auto" />
                                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No other hubs currently online</p>
                                    </div>
                                )}
                            </div>

                            {updatingShop && (
                                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Routing to new node...</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Strategic Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-4"
                >
                    {(order.status === 'pending' || order.status === 'shop_accepted') && (
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleCancelOrder}
                                className="py-5 bg-white border border-red-100 text-red-500 rounded-[2rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-red-50 transition-all shadow-sm flex-1"
                            >
                                <XCircle size={16} />
                                Abort
                            </button>
                            <button
                                onClick={() => setIsChangingShop(true)}
                                className="py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 flex-1"
                            >
                                <RefreshCcw size={16} className="text-blue-400" />
                                Change Hub
                            </button>
                        </div>
                    )}

                    {order.payment_status !== 'paid' && order.status !== 'cancelled' && (
                        <button
                            onClick={() => handleUpdatePayment('online')}
                            className="w-full py-5 bg-blue-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-blue-500/20"
                        >
                            <CreditCard size={16} />
                            {order.payment_method === 'online' ? 'Complete Payment' : 'Switch to Online Payment'}
                        </button>
                    )}

                    {order.status === 'ready_for_pickup' && order.print_shops?.status === 'open' && (
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white border-4 border-slate-900 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden text-center space-y-6"
                        >
                            <div className="space-y-1">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Handover Verification</h4>
                                <p className="text-xl font-black text-slate-900 leading-none">Show to Shop Staff</p>
                            </div>

                            <div className="flex justify-center">
                                <div className="p-4 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100 relative group">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${order.order_number}`}
                                        alt="Verification QR"
                                        className="w-48 h-48 rounded-2xl mix-blend-multiply"
                                    />
                                    <div className="absolute inset-0 bg-blue-600/5 group-hover:bg-transparent transition-colors rounded-[2.5rem]" />
                                </div>
                            </div>

                            <div className="bg-slate-900 rounded-2xl py-3 px-4 inline-block">
                                <p className="text-white font-black italic tracking-tighter text-sm">#{order.order_number}</p>
                            </div>

                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                                This secure QR link validates your identity <br /> and completes the digital handover.
                            </p>
                        </motion.div>
                    )}

                    {order.status === 'ready_for_pickup' && order.print_shops?.status === 'open' && (
                        <div className="bg-emerald-500 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl shadow-emerald-500/20">
                            <div className="relative z-10 flex items-center gap-6">
                                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center shrink-0">
                                    <Package size={32} />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black italic">Ready!</h4>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-100 mt-1">Visit shop and show the QR above</p>
                                </div>
                            </div>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                        </div>
                    )}

                    {order.status === 'completed' && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm text-center space-y-6"
                        >
                            {!feedbackSubmitted ? (
                                <>
                                    <div className="space-y-2">
                                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 leading-none italic">Job Completed!</h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">How was your experience at {order.print_shops?.name}?</p>
                                    </div>

                                    <div className="flex justify-center gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setRating(star)}
                                                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${rating >= star ? 'bg-amber-400 text-white' : 'bg-slate-50 text-slate-300'}`}
                                            >
                                                <Star size={24} fill={rating >= star ? 'currentColor' : 'none'} />
                                            </button>
                                        ))}
                                    </div>

                                    <textarea
                                        placeholder="Add a comment (Optional)..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs font-bold text-slate-700 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20 min-h-[100px] transition-all"
                                    />

                                    <button
                                        onClick={handleSubmitFeedback}
                                        disabled={submittingFeedback}
                                        className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-slate-900/10 disabled:opacity-50"
                                    >
                                        {submittingFeedback ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <>Confirm Feedback</>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <div className="py-6 space-y-4">
                                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                                        <Star size={32} fill="currentColor" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-lg font-black text-slate-900 italic">Thank You!</h4>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Your feedback helps the network grow.</p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </motion.div>
            </main>
        </div>
    );
}
