'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [shopId, setShopId] = useState<string | null>(null);

    const fetchCustomers = async () => {
        setLoading(true);
        setError('');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // ── Step 1: Find which shop this admin/owner manages ──────────
            let resolvedShopId: string | null = null;

            // Try as owner first
            const { data: ownedShop } = await supabase
                .from('print_shops')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (ownedShop) {
                resolvedShopId = ownedShop.id;
            } else {
                // Try as staff
                const { data: staffRec } = await supabase
                    .from('shop_staff')
                    .select('shop_id')
                    .eq('user_id', user.id)
                    .single();
                if (staffRec) resolvedShopId = staffRec.shop_id;
            }

            setShopId(resolvedShopId);

            // ── Step 2: Get all orders for this shop (or all orders if no shop) ──
            let ordersQuery = supabase
                .from('orders')
                .select('user_id, total_amount, created_at, status')
                .order('created_at', { ascending: false });

            if (resolvedShopId) {
                ordersQuery = ordersQuery.eq('shop_id', resolvedShopId);
            }

            const { data: orders, error: ordersError } = await ordersQuery;
            if (ordersError) throw ordersError;

            if (!orders || orders.length === 0) {
                setCustomers([]);
                setLoading(false);
                return;
            }

            // ── Step 3: Get unique user IDs from orders ───────────────────
            const uniqueUserIds = [...new Set(orders.map(o => o.user_id).filter(Boolean))];

            // ── Step 4: Fetch profiles for those users ────────────────────
            const { data: profiles, error: profilesError } = await supabase
                .from('profiles')
                .select('id, full_name, email, phone, department, year, avatar_url, created_at')
                .in('id', uniqueUserIds);

            if (profilesError) throw profilesError;

            // ── Step 5: Merge order stats into each profile ───────────────
            const enriched = (profiles || []).map(profile => {
                const userOrders = orders.filter(o => o.user_id === profile.id);
                const totalSpent = userOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
                const completedOrders = userOrders.filter(o => o.status === 'completed').length;
                const lastOrder = userOrders[0]; // already sorted desc
                return {
                    ...profile,
                    orderCount: userOrders.length,
                    totalSpent,
                    completedOrders,
                    lastOrderAt: lastOrder?.created_at || null,
                };
            });

            // Sort by most orders first
            enriched.sort((a, b) => b.orderCount - a.orderCount);
            setCustomers(enriched);

        } catch (err: any) {
            console.error('Customers fetch error:', err);
            setError(err?.message || 'Failed to load customers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const filtered = customers.filter(c => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            c.full_name?.toLowerCase().includes(q) ||
            c.email?.toLowerCase().includes(q) ||
            c.phone?.includes(q) ||
            c.department?.toLowerCase().includes(q)
        );
    });

    const departments = [...new Set(customers.map(c => c.department).filter(Boolean))];
    const years = [...new Set(customers.map(c => c.year).filter(Boolean))].sort();

    return (
        <div className="space-y-8 font-outfit">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Customer Registry
                    </h1>
                    <p className="text-[10px] text-slate-400 mt-1 font-black uppercase tracking-[0.2em]">
                        {customers.length} Customers • {customers.reduce((s, c) => s + c.orderCount, 0)} Total Orders
                    </p>
                </div>
                <button
                    onClick={fetchCustomers}
                    className="px-5 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95"
                >
                    Refresh
                </button>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center px-5 py-3 gap-3">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    placeholder="Search by name, email, phone, department..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="bg-transparent border-none outline-none text-[11px] font-bold text-slate-700 dark:text-slate-300 w-full placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
                {search && (
                    <button onClick={() => setSearch('')} className="text-slate-300 hover:text-slate-600 text-xs">✕</button>
                )}
            </div>

            {/* Summary Chips */}
            {(departments.length > 0 || years.length > 0) && (
                <div className="flex flex-wrap gap-4">
                    {departments.length > 0 && (
                        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-100 dark:border-slate-800 rounded-[2rem] p-5 flex-1 min-w-[260px]">
                            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                Departments ({departments.length})
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {departments.map(dept => (
                                    <span key={dept as string} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800">
                                        {dept as string}
                                        <span className="ml-1.5 opacity-50">{customers.filter(c => c.department === dept).length}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                    {years.length > 0 && (
                        <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-100 dark:border-slate-800 rounded-[2rem] p-5 flex-1 min-w-[180px]">
                            <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                Year / Batch
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {years.map(year => (
                                    <span key={year as string} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                        {year as string}
                                        <span className="ml-1.5 opacity-40">{customers.filter(c => c.year === year).length}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* States */}
            {loading && (
                <div className="py-24 text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading customers…</p>
                </div>
            )}

            {error && !loading && (
                <div className="py-16 text-center bg-red-50 dark:bg-red-900/10 rounded-[2rem] border border-red-100 dark:border-red-800">
                    <p className="text-sm font-black text-red-500">⚠️ {error}</p>
                    <button onClick={fetchCustomers} className="mt-4 px-6 py-2 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest">Retry</button>
                </div>
            )}

            {!loading && !error && filtered.length === 0 && (
                <div className="py-24 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                    <div className="text-5xl mb-4">👤</div>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">
                        {search ? 'No matches found' : 'No customers yet'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-300 dark:text-slate-600 mt-2">
                        {search ? 'Try a different search term' : 'Customers appear here once they place an order'}
                    </p>
                </div>
            )}

            {/* Customer Grid */}
            {!loading && !error && filtered.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map(customer => (
                        <div key={customer.id} className="p-7 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-100 dark:hover:shadow-slate-900/50 transition-all hover:-translate-y-0.5">
                            <div className="absolute top-0 right-0 w-28 h-28 bg-blue-50/60 dark:bg-blue-900/10 rounded-full blur-2xl -mr-14 -mt-14 group-hover:bg-blue-100/70 dark:group-hover:bg-blue-800/20 transition-colors" />

                            {/* Avatar + Name */}
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-14 h-14 rounded-[1.2rem] bg-slate-900 dark:bg-slate-700 flex items-center justify-center text-white text-xl font-black shadow-lg overflow-hidden flex-shrink-0">
                                    {customer.avatar_url ? (
                                        <img src={customer.avatar_url} alt={customer.full_name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                        customer.full_name?.charAt(0)?.toUpperCase() || 'U'
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-slate-900 dark:text-white tracking-tight truncate">
                                        {customer.full_name || 'Unknown User'}
                                    </p>
                                    <p className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mt-0.5 truncate">
                                        {customer.department || 'General'}
                                        {customer.year ? ` · ${customer.year}` : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3 pb-5 border-b border-slate-50 dark:border-slate-800 mb-5">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl text-center">
                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Orders</p>
                                    <p className="text-lg font-black text-slate-900 dark:text-white tracking-tighter">{customer.orderCount}</p>
                                </div>
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-center">
                                    <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Spent</p>
                                    <p className="text-sm font-black text-emerald-700 dark:text-emerald-400 tracking-tighter">₹{customer.totalSpent}</p>
                                </div>
                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-center">
                                    <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Done</p>
                                    <p className="text-lg font-black text-blue-700 dark:text-blue-400 tracking-tighter">{customer.completedOrders}</p>
                                </div>
                            </div>

                            {/* Contact */}
                            <div className="space-y-1">
                                {customer.phone && (
                                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                        📱 {customer.phone}
                                    </p>
                                )}
                                {customer.email && (
                                    <p className="text-[9px] font-bold text-slate-300 dark:text-slate-600 truncate">
                                        ✉️ {customer.email}
                                    </p>
                                )}
                                {customer.lastOrderAt && (
                                    <p className="text-[8px] font-bold text-slate-200 dark:text-slate-700 uppercase tracking-widest">
                                        Last order: {new Date(customer.lastOrderAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
