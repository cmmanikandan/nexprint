'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, Store, Package, Loader2, MoreVertical } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ShopsPage() {
    type ShopRow = {
        id: string;
        name?: string;
        address?: string;
        email?: string;
        status?: string;
        orders?: Array<{ id: string }>;
        [key: string]: any;
    };

    const [shops, setShops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const { data } = await supabase
                    .from('print_shops')
                    .select('*, orders(id)')
                    .order('created_at', { ascending: false });

                const transformed = ((data || []) as ShopRow[]).map((shop) => ({
                    ...shop,
                    orderCount: shop.orders?.length || 0
                }));

                setShops(transformed);
            } catch (error) {
                console.error('Fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchShops();
    }, []);

    const filteredShops = shops.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.address?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) return (
        <div className="h-full flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
    );

    return (
        <div className="space-y-6 font-outfit pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Global Hubs</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Network Infrastructure • {shops.length} Shops</p>
                </div>
                <button className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 active:scale-95 transition-all flex items-center justify-center gap-2">
                    <Store size={16} />
                    Register New Hub
                </button>
            </div>

            <div className="bg-white border border-slate-100 rounded-2xl px-4 h-12 flex items-center gap-3 shadow-sm focus-within:ring-4 focus-within:ring-blue-50 transition-all">
                <Search size={18} className="text-slate-300" />
                <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Locate hub by name or region..."
                    className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-slate-700 w-full placeholder:text-slate-300"
                />
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Shop</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Location</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Orders</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status</th>
                            <th className="px-8 py-5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredShops.map((shop) => (
                            <tr key={shop.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shadow-lg shadow-slate-200">
                                            {shop.name?.charAt(0) || 'H'}
                                        </div>
                                        <div>
                                            <span className="font-black text-slate-900 text-sm block">{shop.name}</span>
                                            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest">{shop.email || 'No Email'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <MapPin size={14} className="text-slate-300" />
                                        <span className="text-xs font-medium max-w-[200px] truncate">{shop.address}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-2">
                                        <Package size={14} className="text-slate-300" />
                                        <span className="text-xs font-black text-slate-700">{shop.orderCount} Jobs</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-100 bg-emerald-50 text-emerald-600 shadow-sm">
                                        {shop.status || 'Active'}
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
