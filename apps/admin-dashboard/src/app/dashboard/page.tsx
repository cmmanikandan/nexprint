'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  AreaChart, Area, BarChart, Bar, CartesianGrid,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import {
  TrendingUp, Store, Users, Package, ShieldCheck,
  AlertTriangle, CheckCircle2, XCircle, Loader2
} from 'lucide-react';

export default function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalShops: 0,
    activeShops: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    pendingApprovals: 0,
  });
  const [topShops, setTopShops] = useState<any[]>([]);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [shops, setShops] = useState<any[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [
        { data: shopsData },
        { data: ordersData },
        { count: userCount },
      ] = await Promise.all([
        supabase.from('print_shops').select('*, orders(id, total_amount, status, created_at)'),
        supabase.from('orders').select('id, total_amount, status, created_at, print_shops(name)').order('created_at', { ascending: false }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'user'),
      ]);

      const allShops = shopsData || [];
      const allOrders = ordersData || [];

      // Stats
      const totalRevenue = allOrders.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0);
      setStats({
        totalShops: allShops.length,
        activeShops: allShops.filter((s: any) => s.is_active !== false).length,
        totalOrders: allOrders.length,
        totalRevenue,
        totalUsers: userCount || 0,
        pendingApprovals: allShops.filter((s: any) => s.is_active === null || s.is_active === undefined).length,
      });

      setShops(allShops);

      // Top shops by revenue
      const shopRevenues = allShops.map((s: any) => ({
        name: s.name || 'Unnamed Shop',
        id: s.id,
        revenue: (s.orders || []).reduce((acc: number, o: any) => acc + Number(o.total_amount || 0), 0),
        orders: (s.orders || []).length,
        city: s.city || '—',
        is_active: s.is_active,
      })).sort((a: any, b: any) => b.revenue - a.revenue);
      setTopShops(shopRevenues);

      // Revenue last 7 days chart
      const last7 = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - i); d.setHours(0, 0, 0, 0); return d;
      }).reverse();

      const chart = last7.map(date => {
        const day = allOrders.filter((o: any) => new Date(o.created_at).toDateString() === date.toDateString());
        return {
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          revenue: day.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0),
          orders: day.length,
        };
      });
      setRevenueChart(chart);

      // Recent activity
      setRecentActivity(allOrders.slice(0, 10));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleShopStatus = async (shopId: string, currentStatus: boolean) => {
    setUpdating(shopId);
    await supabase.from('print_shops').update({ is_active: !currentStatus }).eq('id', shopId);
    await fetchAll();
    setUpdating(null);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Loading System Intelligence...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 font-outfit pb-16">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">System Overview</h1>
        <div className="flex items-center gap-2 mt-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NexPrint Global Network • Live</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: 'Network Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'blue', sub: 'All-time across all shops' },
          { label: 'Total Orders', value: stats.totalOrders.toLocaleString(), icon: Package, color: 'indigo', sub: 'System-wide' },
          { label: 'Registered Users', value: stats.totalUsers.toLocaleString(), icon: Users, color: 'emerald', sub: 'Total customers' },
          { label: 'Active Shops', value: `${stats.activeShops}/${stats.totalShops}`, icon: Store, color: 'amber', sub: 'Live terminals' },
          { label: 'Pending Approvals', value: stats.pendingApprovals, icon: AlertTriangle, color: 'rose', sub: 'Shops awaiting review', alert: stats.pendingApprovals > 0 },
          { label: 'Network Health', value: stats.activeShops > 0 ? '100%' : '0%', icon: ShieldCheck, color: 'emerald', sub: 'System uptime' },
        ].map((card) => (
          <div key={card.label} className={`bg-white rounded-[2rem] p-6 border shadow-sm relative overflow-hidden
            ${card.alert ? 'border-rose-200 ring-4 ring-rose-50' : 'border-slate-50'}`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 bg-${card.color}-50 text-${card.color}-600`}>
              <card.icon size={18} />
            </div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
            <p className="text-2xl font-black text-slate-900 mt-1 tracking-tight">{String(card.value)}</p>
            <p className="text-[9px] text-slate-400 font-bold mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-black text-slate-900 leading-none mb-1">Quick Vector</h2>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Rapid System Access Points</p>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Provision Authority', icon: Users, href: '/dashboard/users', color: 'blue' },
            { label: 'Register Hub', icon: Store, href: '/dashboard/shops', color: 'indigo' },
            { label: 'Network Reports', icon: TrendingUp, href: '/dashboard/reports', color: 'emerald' },
            { label: 'Profile Control', icon: ShieldCheck, href: '/dashboard/profile', color: 'slate' },
          ].map((action) => (
            <a
              key={action.label}
              href={action.href}
              className="flex flex-col items-center justify-center gap-4 p-6 rounded-[2rem] bg-slate-50 border border-slate-100 hover:bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5 transition-all group scale-100 active:scale-95"
            >
              <div className={`w-12 h-12 rounded-2xl bg-${action.color}-600 text-white flex items-center justify-center shadow-lg shadow-${action.color}-500/20 group-hover:rotate-6 transition-transform`}>
                <action.icon size={20} />
              </div>
              <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">{action.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 leading-none mb-1">Network Revenue</h2>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-8">7-Day Total Across All Shops</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: 10, fontWeight: 900 }} />
                <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={3} fill="url(#revFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 leading-none mb-1">Top Shops</h2>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-6">By Revenue</p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topShops.slice(0, 5)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 900 }} />
                <YAxis type="category" dataKey="name" width={80} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9, fontWeight: 900 }} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', fontSize: 10, fontWeight: 900 }} />
                <Bar dataKey="revenue" fill="#2563EB" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Shop Management Grid */}
      <div className="bg-white rounded-[2.5rem] border border-slate-50 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <h2 className="text-xl font-black text-slate-900">Shop Registry</h2>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Approve, suspend, or monitor all terminals</p>
        </div>
        <div className="divide-y divide-slate-50">
          {topShops.map((shop) => (
            <div key={shop.id} className="flex items-center gap-5 px-8 py-5 hover:bg-slate-50/50 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                {shop.name?.charAt(0) || 'S'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate">{shop.name}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{shop.city} • {shop.orders} orders</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-sm font-black text-slate-900">₹{shop.revenue.toLocaleString()}</p>
                <p className="text-[9px] font-black text-slate-400 uppercase">Revenue</p>
              </div>
              <button
                onClick={() => toggleShopStatus(shop.id, shop.is_active !== false)}
                disabled={updating === shop.id}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95
                  ${shop.is_active === false
                    ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100'
                    : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100'
                  }`}
              >
                {updating === shop.id
                  ? <Loader2 size={12} className="animate-spin" />
                  : shop.is_active === false
                    ? <><CheckCircle2 size={12} /> Activate</>
                    : <><XCircle size={12} /> Suspend</>
                }
              </button>
            </div>
          ))}
          {topShops.length === 0 && (
            <div className="py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
              No shops registered yet
            </div>
          )}
        </div>
      </div>

      {/* Live Activity Feed */}
      <div className="bg-slate-950 rounded-[2.5rem] p-8 border border-slate-900 shadow-2xl">
        <h2 className="text-lg font-black text-white mb-1">Live Activity Feed</h2>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-6">Latest orders across the network</p>
        <div className="space-y-3">
          {recentActivity.map((order, i) => (
            <div key={order.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 flex items-center justify-center text-sm">
                🖨️
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate">
                  {order.print_shops?.name || 'Unknown Shop'} — #{order.id?.slice(-6)}
                </p>
                <p className="text-[9px] font-black text-slate-500">
                  {new Date(order.created_at).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest
                ${order.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                  ['printing', 'shop_accepted'].includes(order.status) ? 'bg-blue-500/20 text-blue-400' :
                    'bg-amber-500/20 text-amber-400'}`}>
                {order.status?.replace(/_/g, ' ')}
              </span>
              <span className="text-sm font-black text-white flex-shrink-0">₹{order.total_amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
