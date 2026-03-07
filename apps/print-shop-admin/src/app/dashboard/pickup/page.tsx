'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function PickupPage() {
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [order, setOrder] = useState<any>(null);
    const [error, setError] = useState('');

    const handleSearch = async (val: string) => {
        setSearch(val);
        if (val.length >= 6) {
            setLoading(true);
            setError('');
            try {
                const { data, error: fetchError } = await supabase
                    .from('orders')
                    .select('*, profiles(full_name, department, phone), order_items(*), racks(name, category)')
                    .or(`order_number.ilike.%${val}%,id.eq.${val}`) // Support full ID or order number snippet
                    .single();

                if (fetchError) throw fetchError;
                setOrder(data);
            } catch (err) {
                setOrder(null);
                setError('Order not found or invalid ID');
            } finally {
                setLoading(false);
            }
        } else {
            setOrder(null);
        }
    };

    const completeOrder = async () => {
        if (!order) return;
        setLoading(true);
        try {
            const { error: updateError } = await supabase
                .from('orders')
                .update({
                    status: 'completed',
                    payment_status: 'paid' // Assuming payment is collected at pickup if not already paid
                })
                .eq('id', order.id);

            if (updateError) throw updateError;

            // Log activity
            await supabase.from('activity_logs').insert({
                shop_id: order.shop_id,
                action: 'order_pickup_completed',
                details: { order_number: order.order_number, amount: order.total_amount }
            });

            setOrder({ ...order, status: 'completed', payment_status: 'paid' });
            alert('Order successfully handed over and closed.');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 font-outfit pb-20">
            <div className="text-center space-y-4">
                <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center text-3xl mx-auto shadow-2xl shadow-blue-200 animate-bounce">
                    📦
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight">Express Pickup Terminal</h1>
                <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] leading-relaxed">
                    Scan order QR or enter ID to <br /> verify and complete handover
                </p>
            </div>

            <div className="relative group">
                <div className="absolute inset-y-0 left-8 flex items-center pointer-events-none transition-colors group-focus-within:text-blue-600">
                    <span className="text-2xl">🔍</span>
                </div>
                <input
                    autoFocus
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder="SCAN CUSTOMER QR OR ENTER ID..."
                    className="w-full pl-20 pr-10 py-10 bg-white border-2 border-slate-50 rounded-[3rem] text-xl font-black uppercase tracking-widest focus:ring-8 focus:ring-blue-500/5 focus:border-blue-600 transition-all shadow-xl shadow-slate-100/50 placeholder:text-slate-200"
                />
                {loading && (
                    <div className="absolute inset-y-0 right-10 flex items-center">
                        <div className="w-6 h-6 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {order && (
                <div className="bg-white rounded-[3rem] p-10 shadow-2xl border-2 border-emerald-100 animate-in slide-in-from-bottom-10 duration-500 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl -mr-32 -mt-32 -z-10" />

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-10 border-b border-slate-50">
                        <div>
                            <span className="px-5 py-2 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">Order Verified</span>
                            <h2 className="text-3xl font-black text-slate-900 mt-4 tracking-tight">{order.order_number}</h2>
                            <p className="text-sm font-black text-slate-300 uppercase tracking-widest mt-1">Logged: {new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="bg-slate-950 text-white px-8 py-6 rounded-[2rem] text-center shadow-xl shadow-slate-200 min-w-[200px]">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Collection Spot</p>
                            <p className="text-2xl font-black italic">{order.racks?.name || 'QUEUED'}</p>
                            <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-1">{order.racks?.category || 'PROD ZONE'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Partner Details</label>
                                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                                    <p className="text-xl font-black text-slate-900">{order.profiles?.full_name}</p>
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">{order.profiles?.department || 'Visitor'} Member</p>
                                    <p className="text-sm font-bold text-slate-500 mt-3">Phone: {order.profiles?.phone || 'Not linked'}</p>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Job Configuration</label>
                                <div className="space-y-2">
                                    {order.order_items?.map((item: any) => (
                                        <div key={item.id} className="flex justify-between items-center py-3 border-b border-slate-50">
                                            <p className="text-sm font-black text-slate-700 uppercase italic truncate max-w-[200px]">{item.file_name}</p>
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.copies} CPYS / {item.print_type}</p>
                                                <p className="text-[10px] font-black text-blue-600 mt-0.5">₹{item.price || 0}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col h-full gap-4">
                            <div className="flex-1 bg-white border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center p-8 text-center">
                                <span className="text-4xl mb-4">💳</span>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Financial Status</p>
                                <p className="text-3xl font-black text-slate-900 italic">₹{order.total_amount}</p>
                                <span className={`mt-3 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${order.payment_status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600 animate-pulse'}`}>
                                    {order.payment_status || 'UNPAID'}
                                </span>
                            </div>

                            <button
                                onClick={completeOrder}
                                disabled={loading || order.status === 'completed'}
                                className={`w-full py-8 rounded-[2rem] text-sm font-black uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center justify-center gap-3
                                    ${order.status === 'completed'
                                        ? 'bg-slate-100 text-slate-400 shadow-none'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-100 active:scale-95'
                                    }
                                `}
                            >
                                {order.status === 'completed' ? 'ALREADY COLLECTED' : (
                                    <>
                                        <span>REALIZE & CLOSE ORDER</span>
                                        <span className="text-xl">➔</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[2rem] text-center animate-shake">
                    <p className="text-xs font-black text-rose-600 uppercase tracking-[0.2em]">{error}</p>
                    <p className="text-[10px] font-bold text-rose-400 mt-1">Please verify the code and try again</p>
                </div>
            )}

            {!order && !loading && !error && (
                <div className="py-20 text-center opacity-20">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.5em]">Terminal Standby</p>
                </div>
            )}
        </div>
    );
}
