'use client';

import { useState, useEffect } from 'react';
import { Search, Loader2, MoreVertical, Store, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const { data } = await supabase
                    .from('orders')
                    .select('*, profiles(full_name), print_shops(name)')
                    .order('created_at', { ascending: false });
                setOrders(data || []);
            } catch (error) {
                console.error('Fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const filteredOrders = orders.filter(o =>
        o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
        o.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        o.print_shops?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'cancelled': return 'bg-red-50 text-red-600 border-red-100';
            case 'printing': return 'bg-blue-50 text-blue-600 border-blue-100';
            default: return 'bg-amber-50 text-amber-600 border-amber-100';
        }
    };

    if (loading) return (
        <div className="h-full flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 font-outfit pb-20">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Global Ledger</h1>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Transaction History • {orders.length} Total Records</p>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl px-4 h-12 flex items-center gap-3 shadow-sm focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                <Search size={18} className="text-slate-300" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by order ID, customer, or shop..."
                    className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-slate-700 w-full placeholder:text-slate-300"
                />
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Order ID</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Customer</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shop</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                            <th className="px-8 py-5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredOrders.map((order) => (
                            <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-5 whitespace-nowrap">
                                    <span className="font-black text-slate-900 text-xs tracking-tighter uppercase">{order.order_number}</span>
                                    <p className="text-[8px] font-bold text-slate-300 mt-0.5">{new Date(order.created_at).toLocaleString()}</p>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        <Users size={12} className="text-slate-300" />
                                        <span className="text-xs font-black text-slate-700">{order.profiles?.full_name || 'Anonymous'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        <Store size={12} className="text-slate-300" />
                                        <span className="text-xs font-black text-slate-700">{order.print_shops?.name || 'Local Station'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="text-xs font-black text-slate-900 tracking-tight italic">₹{order.total_amount}</span>
                                </td>
                                <td className="px-8 py-5 whitespace-nowrap">
                                    <span className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-sm ${getStatusStyle(order.status)}`}>
                                        {order.status?.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <button className="text-slate-300 hover:text-slate-600 p-2 rounded-xl transition-colors">
                                        <MoreVertical size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
