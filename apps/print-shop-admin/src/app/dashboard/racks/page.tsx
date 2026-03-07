'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Box, GraduationCap, Building2, PackageCheck, ChevronRight, Layers, LayoutGrid, Search } from 'lucide-react';

export default function RacksPage() {
    const [loading, setLoading] = useState(true);
    const [racks, setRacks] = useState<any[]>([]);
    const [orders, setOrders] = useState<any[]>([]);
    const [newRack, setNewRack] = useState({ name: '', category: '' });
    const [saving, setSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: shop } = await supabase
            .from('print_shops')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (shop) {
            // Fetch Racks
            const { data: rackData } = await supabase
                .from('racks')
                .select('*')
                .eq('shop_id', shop.id)
                .order('name', { ascending: true });

            // Fetch Orders currently in racks
            const { data: orderData } = await supabase
                .from('orders')
                .select('*, profiles!user_id(full_name, department, year)')
                .eq('shop_id', shop.id)
                .eq('status', 'ready_for_pickup');

            setRacks(rackData || []);
            setOrders(orderData || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
        const channel = supabase.channel('rack-live-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchData())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'racks' }, () => fetchData())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, []);

    const handleAddRack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRack.name) return;
        setSaving(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: shop } = await supabase
            .from('print_shops')
            .select('id')
            .eq('owner_id', user.id)
            .single();

        if (shop) {
            const { error } = await supabase.from('racks').insert({
                shop_id: shop.id,
                name: newRack.name,
                category: newRack.category
            });

            if (error) {
                alert(`Rack Error: ${error.message}`);
            } else {
                setNewRack({ name: '', category: '' });
                fetchData();
            }
        }
        setSaving(false);
    };

    const deleteRack = async (id: string) => {
        if (!confirm('Are you sure? Orders assigned to this rack will remain active but loose their location.')) return;
        await supabase.from('racks').delete().eq('id', id);
        fetchData();
    };

    const handoverOrder = async (orderId: string) => {
        const { error } = await supabase.from('orders').update({ status: 'completed' }).eq('id', orderId);
        if (error) alert(error.message);
        else fetchData();
    };

    // --- Hierarchical Data Processing ---
    const getRackHierarchy = () => {
        return racks.map(rack => {
            const rackOrders = orders.filter(o => o.rack_id === rack.id);
            const depts = Array.from(new Set(rackOrders.map(o => o.profiles?.department || 'GENERAL')));

            return {
                ...rack,
                departments: depts.map(dept => {
                    const deptOrders = rackOrders.filter(o => (o.profiles?.department || 'GENERAL') === dept);
                    const years = Array.from(new Set(deptOrders.map(o => o.profiles?.year || 'V')));

                    return {
                        name: dept,
                        years: years.map(year => ({
                            name: year,
                            orders: deptOrders.filter(o => (o.profiles?.year || 'V') === year)
                        }))
                    };
                })
            };
        }).filter(rack => !searchQuery || rack.name.toLowerCase().includes(searchQuery.toLowerCase()) || rack.departments.some((d: any) => d.name.toLowerCase().includes(searchQuery.toLowerCase())));
    };

    const hierarchy = getRackHierarchy();

    return (
        <div className="space-y-10 font-outfit pb-20">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-50 shadow-sm sticky top-0 z-40">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Live Staging Matrix</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Hierarchical Document Retrieval System</p>
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex-1 md:w-64 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                        <input
                            placeholder="SEARCH RACKS/DEPTS..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border border-transparent focus:bg-white focus:border-blue-100 outline-none text-[10px] font-black uppercase tracking-widest transition-all"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8 items-start">
                {/* Creation Terminal */}
                <div className="xl:sticky xl:top-36 space-y-6">
                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
                        <div className="relative z-10">
                            <h3 className="text-xl font-black mb-1 flex items-center gap-3">
                                <Box className="text-blue-400" /> New Staging Point
                            </h3>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-8">Deploying infrastructure</p>

                            <form onSubmit={handleAddRack} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">STAGING IDENTIFIER</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. RACK-A"
                                        value={newRack.name}
                                        onChange={(e) => setNewRack({ ...newRack, name: e.target.value })}
                                        className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-white text-sm outline-none focus:border-blue-500 focus:bg-white/10 transition-all placeholder:text-slate-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">ALLOCATED CATEGORY</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. CSE 1st Year"
                                        value={newRack.category}
                                        onChange={(e) => setNewRack({ ...newRack, category: e.target.value })}
                                        className="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 font-bold text-white text-sm outline-none focus:border-blue-500 focus:bg-white/10 transition-all placeholder:text-slate-600"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 text-[10px] uppercase tracking-widest mt-2"
                                >
                                    {saving ? 'DEPLOYING...' : 'INITIATE DEPLOYMENT'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] p-6 border border-slate-100 space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">System Overview</h4>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-slate-50 rounded-2xl text-center">
                                <p className="text-2xl font-black text-slate-900">{racks.length}</p>
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nodes Active</p>
                            </div>
                            <div className="p-4 bg-blue-50 rounded-2xl text-center">
                                <p className="text-2xl font-black text-blue-600">{orders.length}</p>
                                <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest">Staged Jobs</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Matrix Content */}
                <div className="xl:col-span-3 space-y-8">
                    {loading ? (
                        <div className="py-20 flex flex-col items-center gap-4">
                            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculating Staging Nodes...</p>
                        </div>
                    ) : hierarchy.length === 0 ? (
                        <div className="bg-white rounded-[3rem] p-24 text-center border-4 border-dashed border-slate-50">
                            <LayoutGrid className="mx-auto text-slate-200 mb-6" size={48} />
                            <h3 className="text-sm font-black text-slate-300 uppercase tracking-widest">No active staging infrastructure found</h3>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-8">
                            {hierarchy.map((rack) => (
                                <div key={rack.id} className="bg-white rounded-[3rem] border border-slate-50 shadow-sm relative overflow-hidden group">
                                    {/* Rack Header */}
                                    <div className="bg-slate-50 px-8 py-6 flex items-center justify-between border-b border-slate-100">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-2xl font-black text-slate-900 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                {rack.name.charAt(rack.name.length - 1)}
                                            </div>
                                            <div>
                                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{rack.name}</h2>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 italic">{rack.category || 'GENERAL STAGING'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="bg-white border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                {rack.departments.reduce((acc: number, d: any) => acc + d.years.reduce((ya: number, y: any) => ya + y.orders.length, 0), 0)} Jobs Staged
                                            </div>
                                            <button
                                                onClick={() => deleteRack(rack.id)}
                                                className="w-10 h-10 rounded-xl bg-white border border-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                                            >✕</button>
                                        </div>
                                    </div>

                                    {/* Rack Body: Departments */}
                                    <div className="p-8 space-y-8">
                                        {rack.departments.length === 0 ? (
                                            <div className="text-center py-10 opacity-30 italic text-xs font-bold text-slate-400">--- NO JOBS STAGED IN THIS NODE ---</div>
                                        ) : (
                                            rack.departments.map((dept: any) => (
                                                <div key={dept.name} className="space-y-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Building2 size={16} /></div>
                                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight italic">{dept.name}</h4>
                                                        <div className="h-[1px] flex-1 bg-slate-50" />
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {dept.years.map((year: any) => (
                                                            <div key={year.name} className="bg-slate-50/30 rounded-[2rem] border border-slate-100 p-6 space-y-4">
                                                                <div className="flex items-center justify-between px-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <GraduationCap size={14} className="text-blue-400" />
                                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">{year.name}</span>
                                                                    </div>
                                                                    <span className="text-[8px] font-black bg-white border border-slate-100 px-2.5 py-1 rounded-lg text-slate-400">{year.orders.length} ITEMS</span>
                                                                </div>

                                                                <div className="space-y-2">
                                                                    {year.orders.map((order: any) => (
                                                                        <div key={order.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group/order hover:border-blue-200 transition-all shadow-sm">
                                                                            <div className="min-w-0">
                                                                                <p className="text-[11px] font-black text-slate-900 tracking-tight truncate uppercase">
                                                                                    {order.profiles?.full_name || 'Guest'}
                                                                                </p>
                                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">#{order.order_number?.slice(-8)}</p>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[10px] font-black italic text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">₹{order.total_amount}</span>
                                                                                <button
                                                                                    onClick={() => handoverOrder(order.id)}
                                                                                    className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-emerald-500 transition-all shadow-lg active:scale-95"
                                                                                    title="Quick Handover"
                                                                                >
                                                                                    <PackageCheck size={16} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
