'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export default function PrintShopDashboard() {
  const [stats, setStats] = useState({
    ordersToday: 0,
    revenueToday: 0,
    activeJobs: 0,
    emergencyOrders: 0,
    readyOrders: 0,
    pendingPayments: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: prof }, { data: shop }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('print_shops').select('*').eq('owner_id', user.id).single()
      ]);

      setProfile(prof);
      setShop(shop);

      if (!shop) {
        setLoading(false);
        return;
      }

      // Optimization: Fetch only necessary data
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        { data: todayOrders },
        { data: recent },
        { count: activeCount },
        { count: emergencyCount },
        { count: readyCount },
        { count: pendingCount }
      ] = await Promise.all([
        // Today's orders and revenue
        supabase.from('orders').select('total_amount').eq('shop_id', shop.id).gte('created_at', today.toISOString()),
        // Recent 5 orders
        supabase.from('orders').select('*, profiles!user_id(full_name)').eq('shop_id', shop.id).order('created_at', { ascending: false }).limit(5),
        // Active Jobs count
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('shop_id', shop.id).in('status', ['shop_accepted', 'printing']),
        // Emergency count
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('shop_id', shop.id).eq('is_emergency', true).neq('status', 'completed'),
        // Ready for pickup count
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('shop_id', shop.id).eq('status', 'ready_for_pickup'),
        // Pending payments count
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('shop_id', shop.id).eq('payment_status', 'pending')
      ]);

      const revenue = todayOrders?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0;

      setStats({
        ordersToday: todayOrders?.length || 0,
        revenueToday: revenue,
        activeJobs: activeCount || 0,
        emergencyOrders: emergencyCount || 0,
        readyOrders: readyCount || 0,
        pendingPayments: pendingCount || 0
      });
      setRecentOrders(recent || []);

      // Calculate Chart Data (Past 7 Days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        return d;
      }).reverse();

      const { data: chartEntries } = await supabase
        .from('orders')
        .select('created_at, total_amount')
        .eq('shop_id', shop.id)
        .gte('created_at', last7Days[0].toISOString());

      const formattedChart = last7Days.map(date => {
        const dateStr = date.toLocaleDateString('en-US', { weekday: 'short' });
        const dayOrders = chartEntries?.filter(o => new Date(o.created_at).toDateString() === date.toDateString());
        return {
          day: dateStr,
          orders: dayOrders?.length || 0,
          revenue: dayOrders?.reduce((acc, curr) => acc + Number(curr.total_amount), 0) || 0
        };
      });

      setChartData(formattedChart);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateShopStatus = async (newStatus: string) => {
    if (!shop || updatingStatus) return;
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('print_shops')
        .update({ status: newStatus })
        .eq('id', shop.id);

      if (error) throw error;
      setShop({ ...shop, status: newStatus });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const channel = supabase
      .channel('dashboard-realtime')
      .on(
        'postgres_changes' as any,
        { event: '*', table: 'orders', schema: 'public' },
        () => {
          // Debounce or just fetch data again
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing Matrix...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit p-4 md:p-8 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none italic">
            Control Tower <span className="text-blue-600 block md:inline">2.0</span>
          </h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Node ID: {shop?.id?.slice(0, 8) || 'MAIN-HUB'}</p>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-2xl">
          {[
            { id: 'open', label: 'Live', color: 'bg-emerald-500', text: 'text-emerald-600' },
            { id: 'busy', label: 'Busy', color: 'bg-amber-500', text: 'text-amber-600' },
            { id: 'closed', label: 'Off', color: 'bg-red-500', text: 'text-red-600' }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => updateShopStatus(s.id)}
              disabled={updatingStatus}
              className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${shop?.status === s.id ? 'bg-white shadow-sm ' + s.text : 'text-slate-400 opacity-50'}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${s.color} ${shop?.status === s.id ? 'animate-pulse' : ''}`} />
              {s.label}
            </button>
          ))}
        </div>
      </header>

      <div className="flex gap-4">
        <div className="flex-1 bg-blue-600 rounded-[2rem] p-6 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
          <p className="text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Today Revenue</p>
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-bold opacity-80">₹</span>
            <span className="text-3xl font-black italic">{stats.revenueToday}</span>
          </div>
          <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white opacity-10 rounded-full blur-xl" />
        </div>
        <Link href="/dashboard/orders" className="flex-1 bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm active:scale-95 transition-all flex flex-col justify-center group hover:border-blue-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-blue-500">Active Queue</p>
          <div className="flex items-center gap-2">
            <span className="text-3xl font-black text-slate-900">{stats.activeJobs}</span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: stats.ordersToday, icon: '📦', color: 'blue' },
          { label: 'Priority SOS', value: stats.emergencyOrders, icon: '⚡', color: 'amber', highlight: stats.emergencyOrders > 0 },
          { label: 'Ready for Pickup', value: stats.readyOrders, icon: '✅', color: 'indigo' },
          { label: 'Pending Payments', value: stats.pendingPayments, icon: '🕒', color: 'rose' },
        ].map((card) => (
          <div
            key={card.label}
            className={`rounded-3xl bg-white p-6 shadow-sm border ${card.highlight ? 'border-amber-200 ring-4 ring-amber-50 animate-pulse' : 'border-slate-50'} flex flex-col items-center text-center gap-1 active:bg-slate-50 transition-colors`}
          >
            <span className="text-2xl mb-2">{card.icon}</span>
            <p className="text-2xl font-black text-slate-900 leading-none">{card.value}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mt-2">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Logistics & Dispatch Radar */}
      <section className="mt-8">
        <div className="rounded-[2.5rem] bg-white border border-slate-100 overflow-hidden shadow-sm">
          <div className="p-8 border-b border-slate-50 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-black text-slate-900 leading-none italic">Logistics Radar</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Live Delivery Flow • Global View</p>
            </div>
            <div className="flex gap-2">
              <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Network Live
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3">
            <div className="lg:col-span-2 h-[400px] bg-slate-100 relative group overflow-hidden">
              {/* Mock Map Background */}
              <div className="absolute inset-0 opacity-20 bg-[url('https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/0,0,1,0/1200x600?access_token=none')] bg-cover bg-center grayscale" />

              {/* Simulated Markers */}
              <div className="absolute inset-0">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center animate-pulse">
                    <div className="w-6 h-6 bg-blue-600 rounded-full border-4 border-white shadow-xl shadow-blue-500/50" />
                  </div>
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest text-center mt-2 bg-white/80 backdrop-blur px-2 py-1 rounded-lg">Hub Prime</p>
                </div>

                <div className="absolute top-[30%] left-[40%] group-hover:translate-y-[-5px] transition-transform cursor-pointer">
                  <div className="w-8 h-8 bg-amber-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-xs">📦</div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded whitespace-nowrap uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Active Delivery</div>
                </div>

                <div className="absolute top-[60%] left-[70%] animate-bounce">
                  <div className="w-8 h-8 bg-emerald-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-xs">🛵</div>
                </div>
              </div>

              <div className="absolute bottom-6 right-6 flex flex-col gap-2">
                <button className="w-10 h-10 bg-white rounded-2xl border border-slate-100 shadow-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-95">+</button>
                <button className="w-10 h-10 bg-white rounded-2xl border border-slate-100 shadow-xl flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all active:scale-95">-</button>
                <button className="w-10 h-10 bg-blue-600 rounded-2xl shadow-xl flex items-center justify-center text-white hover:bg-blue-700 transition-all active:scale-95" onClick={() => window.open('https://www.google.com/maps', '_blank')}>📍</button>
              </div>
            </div>
            <div className="border-l border-slate-50 bg-slate-50/10 p-6 overflow-y-auto max-h-[400px]">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Pending Courier Assignment</h3>
              <div className="space-y-3">
                {recentOrders.filter(o => o.delivery_needed && o.status !== 'completed').length > 0 ? (
                  recentOrders.filter(o => o.delivery_needed && o.status !== 'completed').map(o => (
                    <div key={o.id} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:border-blue-100 transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-[10px] font-black text-slate-900">#{o.order_number?.slice(-6)}</p>
                        <span className="text-[8px] font-black text-blue-500 uppercase">Searching...</span>
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold leading-tight line-clamp-2 italic">{o.delivery_address}</p>
                    </div>
                  ))
                ) : (
                  <div className="py-20 text-center opacity-30 italic">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No active deliveries</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="rounded-[2.5rem] bg-white border border-slate-50 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -mr-32 -mt-32 -z-10" />
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-xl font-black text-slate-900 leading-none">Performance Matrix</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Historical Job Velocity</p>
              </div>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: 24, border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontSize: 12, fontWeight: 900 }}
                  />
                  <Area type="monotone" dataKey="orders" stroke="#2563EB" strokeWidth={4} fillOpacity={1} fill="url(#ordersFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-[2.5rem] bg-white border border-slate-50 p-8 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-xl font-black text-slate-900 leading-none">Recent Activity</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Latest incoming jobs</p>
              </div>
              <Link href="/dashboard/orders" className="px-5 py-2.5 bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest rounded-xl hover:bg-white hover:text-blue-600 border border-slate-50 transition-all">View All Jobs</Link>
            </div>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-5 rounded-[2rem] border border-slate-50 bg-slate-50/20 hover:bg-white hover:border-blue-100 transition-all group shadow-sm hover:shadow-blue-500/5">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center font-black text-blue-600 text-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {order.profiles?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 tracking-tight">#{order.order_number?.slice(-8)}</p>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{order.profiles?.full_name || 'Guest User'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-slate-900">₹{order.total_amount}</p>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${order.status === 'completed' ? 'text-emerald-500' :
                      ['printing', 'shop_accepted'].includes(order.status) ? 'text-blue-500' : 'text-amber-500'
                      }`}>
                      {order.status?.replace(/_/g, ' ') || 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
              {recentOrders.length === 0 && (
                <div className="p-20 text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No recent jobs found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="rounded-[2.5rem] bg-slate-950 p-8 text-white shadow-2xl shadow-blue-500/10 relative overflow-hidden group border border-slate-900">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-1000" />
            <div className="flex justify-between items-start mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-md flex items-center justify-center text-xl">✨</div>
              <span className="text-[9px] font-black bg-blue-600 px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-blue-500/20">PRO CONSOLE</span>
            </div>
            <h3 className="text-2xl font-black leading-tight tracking-tight">NexPrint Hub Engine</h3>
            <p className="text-xs text-slate-500 mt-4 leading-relaxed font-medium">Enterprise multisite management, Advanced AI queue balancing, and terminal telemetry enabled.</p>
            <button className="mt-8 w-full py-5 bg-white text-slate-950 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-xl">Manage System</button>
          </div>

          <div className="rounded-[2.5rem] bg-white border border-slate-100 p-8 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 mb-8 tracking-tight leading-none">Console Shortcuts</h2>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Express Fulfillment', icon: '📦', href: '/dashboard/pickup' },
                { label: 'Revenue Analytics', icon: '💎', href: '/dashboard/payments' },
                { label: 'Establishment Info', icon: '🏢', href: '/dashboard/establishment' },
                { label: 'Personalized Profile', icon: '👤', href: '/dashboard/profile' },
                { label: 'Pricing Hub OS', icon: '⚙️', href: '/dashboard/pricing' },
              ].map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50/30 border border-slate-50 hover:bg-white hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all group"
                >
                  <span className="text-xl group-hover:scale-125 transition-all grayscale group-hover:grayscale-0">{item.icon}</span>
                  <span className="text-[11px] font-black text-slate-500 group-hover:text-slate-900 uppercase tracking-widest transition-colors">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
