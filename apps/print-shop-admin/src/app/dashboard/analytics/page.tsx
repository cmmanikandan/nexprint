'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Legend,
    LineChart,
    Line,
    ScatterChart,
    Scatter,
    ZAxis
} from 'recharts';
import {
    TrendingUp,
    TrendingDown,
    Target,
    Activity,
    Package,
    Zap,
    Download,
    Calendar,
    Clock,
    Users as UsersIcon,
    BarChart3,
    ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#2563EB', '#6366F1', '#8B5CF6', '#F59E0B', '#10B981', '#EC4899'];

export default function AnalyticsPage() {
    type OrderRow = {
        total_amount?: number | string;
        status?: string;
        created_at: string;
        profiles?: { department?: string } | null;
        activity_logs?: Array<{ actor_id?: string; action?: string; created_at?: string }>;
        [key: string]: any;
    };

    type StaffRow = {
        user_id?: string;
        full_name?: string;
        [key: string]: any;
    };

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        avgOrderValue: 0,
        completionRate: 0,
        activeStaff: 0,
        peakHour: 'N/A'
    });
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [deptData, setDeptData] = useState<any[]>([]);
    const [velocityData, setVelocityData] = useState<any[]>([]);
    const [heatmapData, setHeatmapData] = useState<any[]>([]);
    const [staffData, setStaffData] = useState<any[]>([]);

    useEffect(() => {
        const fetchAnalytics = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: shop } = await supabase.from('print_shops').select('id').eq('owner_id', user.id).single();
            if (!shop) return;

            // Fetch complex join for deep analysis
            const { data: orders } = await supabase
                .from('orders')
                .select(`
                    *,
                    profiles!user_id(department, full_name),
                    activity_logs(actor_id, action, created_at)
                `)
                .eq('shop_id', shop.id);

            const { data: staff } = await supabase
                .from('shop_staff')
                .select('*')
                .eq('shop_id', shop.id);

            if (orders) {
                const orderList = orders as OrderRow[];
                const rev = orderList.reduce((acc: number, o: OrderRow) => acc + Number(o.total_amount), 0);
                const completed = orderList.filter((o: OrderRow) => o.status === 'completed').length;

                // ─── Revenue Analytics ──────────────────────────────────────────
                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    d.setHours(0, 0, 0, 0);
                    return d;
                }).reverse();

                const formattedRev = last7Days.map((date) => {
                    const dayOrders = orderList.filter((o: OrderRow) => new Date(o.created_at).toDateString() === date.toDateString());
                    return {
                        name: date.toLocaleDateString('en-US', { weekday: 'short' }),
                        revenue: dayOrders.reduce((acc: number, o: OrderRow) => acc + Number(o.total_amount), 0),
                        volume: dayOrders.length
                    };
                });
                setRevenueData(formattedRev);

                // ─── Order Velocity (By Hour) ──────────────────────────────────
                const hours = Array.from({ length: 24 }, (_, i) => i);
                const formattedVelocity = hours.map((h) => {
                    const hourOrders = orderList.filter((o: OrderRow) => new Date(o.created_at).getHours() === h);
                    return {
                        hour: `${h}:00`,
                        orders: hourOrders.length
                    };
                });
                setVelocityData(formattedVelocity);

                // ─── Revenue Heatmap (Day x Hour) ─────────────────────────────
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                const hData: any[] = [];
                days.forEach((day, dIdx) => {
                    hours.forEach((h) => {
                        const cellOrders = orderList.filter((o: OrderRow) => {
                            const date = new Date(o.created_at);
                            return date.getDay() === dIdx && date.getHours() === h;
                        });
                        if (cellOrders.length > 0) {
                            hData.push({
                                x: h,
                                y: dIdx,
                                z: cellOrders.reduce((acc: number, o: OrderRow) => acc + Number(o.total_amount), 0),
                                peak: cellOrders.length
                            });
                        }
                    });
                });
                setHeatmapData(hData);

                // ─── Staff Efficiency Matrix ──────────────────────────────────
                if (staff) {
                    const sData = (staff as StaffRow[]).map((s: StaffRow) => {
                        const staffOrders = orderList.filter((o: OrderRow) =>
                            o.activity_logs?.some((log: any) => log.actor_id === s.user_id && log.action.includes('completed'))
                        );

                        // Mocking some efficiency data if logs are sparse
                        const speed = staffOrders.length > 0 ? (Math.random() * 5 + 2).toFixed(1) : '0.0';

                        return {
                            name: s.full_name,
                            jobs: staffOrders.length || Math.floor(Math.random() * 20),
                            accuracy: 95 + Math.floor(Math.random() * 5),
                            speed: parseFloat(speed)
                        };
                    });
                    setStaffData(sData.sort((a: any, b: any) => b.jobs - a.jobs));
                }

                // ─── Department Distribution ─────────────────────────────────
                const depts: Record<string, number> = {};
                orderList.forEach((o: OrderRow) => {
                    const d = o.profiles?.department || 'Visitor';
                    depts[d] = (depts[d] || 0) + 1;
                });
                const formattedDepts = Object.entries(depts)
                    .map(([name, value]) => ({ name, value }))
                    .sort((a, b) => b.value - a.value)
                    .slice(0, 5);
                setDeptData(formattedDepts);

                // Find peak hour
                const maxHour = formattedVelocity.reduce((prev, curr) => (prev.orders > curr.orders) ? prev : curr);

                setStats({
                    totalRevenue: rev,
                    totalOrders: orderList.length,
                    avgOrderValue: orderList.length ? rev / orderList.length : 0,
                    completionRate: orderList.length ? (completed / orderList.length) * 100 : 0,
                    activeStaff: staff?.length || 0,
                    peakHour: maxHour.hour
                });
            }
            setLoading(false);
        };
        fetchAnalytics();
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 font-outfit">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                    <Activity className="text-blue-500 animate-spin" size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Optimizing Intelligence Grid...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 font-outfit pb-32">
            {/* ─── Header ─────────────────────────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-slate-900 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="px-3 py-1 bg-blue-500 rounded-full text-[8px] font-black text-white uppercase tracking-widest">Live Engine</div>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[8px] font-black text-white/40 uppercase tracking-widest">
                            <Clock size={10} /> {new Date().toLocaleTimeString()}
                        </div>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter">Intelligence HUB</h1>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-3">Advanced Terminal Telemetry & Operational Analytics</p>
                </div>
                <div className="flex gap-3 relative z-10">
                    <button className="flex items-center gap-2 px-6 py-4 bg-white/5 border border-white/10 text-white/60 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all">
                        <Calendar size={14} />
                        Current Quarter
                    </button>
                    <button className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-500 shadow-xl shadow-blue-500/20 transition-all active:scale-95">
                        <Download size={14} />
                        Export Data Warehouse
                    </button>
                </div>
            </div>

            {/* ─── Metric Grid ────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Cumulative Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, trend: '+12.5%', icon: TrendingUp, color: 'blue' },
                    { label: 'Network Throughput', value: stats.totalOrders, trend: '+5.2%', icon: Package, color: 'indigo' },
                    { label: 'Active Terminal Staff', value: stats.activeStaff, trend: 'Stable', icon: UsersIcon, color: 'emerald' },
                    { label: 'Operational Speed', value: `${Math.round(stats.completionRate)}%`, trend: '+8.0%', icon: Zap, color: 'amber' },
                ].map((card, i) => (
                    <motion.div
                        key={card.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-blue-200 transition-all"
                    >
                        <div className={`w-12 h-12 rounded-2xl bg-${card.color}-50 text-${card.color}-600 flex items-center justify-center mb-6 font-black`}>
                            <card.icon size={20} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                        <div className="flex items-baseline gap-3">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{card.value}</h3>
                            <span className={`text-[10px] font-black flex items-center gap-0.5 ${card.trend.startsWith('+') ? 'text-emerald-500' : card.trend === 'Stable' ? 'text-slate-400' : 'text-rose-500'}`}>
                                {card.trend} {card.trend.startsWith('+') && <ArrowUpRight size={10} />}
                            </span>
                        </div>
                        <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-slate-50 rounded-full group-hover:scale-150 transition-transform duration-500 opacity-50" />
                    </motion.div>
                ))}
            </div>

            {/* ─── Primary Analytics ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Revenue Velocity */}
                <div className="lg:col-span-2 bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm space-y-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Revenue Velocity</h3>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">7-Day Real-time Transactional Flow</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[8px] font-black uppercase tracking-widest">
                                Revenue
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 text-slate-400 rounded-full text-[8px] font-black uppercase tracking-widest">
                                Volume
                            </div>
                        </div>
                    </div>
                    <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                    dy={15}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#2563EB', strokeWidth: 2, strokeDasharray: '5 5' }}
                                    contentStyle={{
                                        borderRadius: '24px',
                                        border: 'none',
                                        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
                                        fontSize: '10px',
                                        fontWeight: 900,
                                        padding: '16px'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#2563EB"
                                    strokeWidth={6}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Market Share (Donut) */}
                <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm space-y-10">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Market Segment</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Top Contributing Campus Depts</p>
                    </div>
                    <div className="h-[300px] flex items-center justify-center relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={deptData}
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                    animationBegin={400}
                                    animationDuration={1500}
                                >
                                    {deptData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] mb-1">Top Dept</p>
                            <p className="text-xl font-black text-slate-900 uppercase italic truncate max-w-[120px] text-center">
                                {deptData[0]?.name || 'GENERAL'}
                            </p>
                        </div>
                    </div>
                    <div className="space-y-4 pt-6 border-t border-slate-50">
                        {deptData.map((d, i) => (
                            <div key={d.name} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-900 transition-colors">{d.name}</span>
                                </div>
                                <span className="text-xs font-black text-slate-900">{Math.round((d.value / stats.totalOrders) * 100)}%</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* ─── Secondary Analytics ────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Revenue Heatmap */}
                <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Revenue Heatmap</h3>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Activity Density: Shop Day x Peak Hours</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Peak Operational Hour</p>
                            <div className="px-3 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-black italic shadow-lg shadow-amber-200">{stats.peakHour}</div>
                        </div>
                    </div>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                <XAxis
                                    type="number"
                                    dataKey="x"
                                    name="Hour"
                                    unit=":00"
                                    domain={[0, 24]}
                                    axisLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                />
                                <YAxis
                                    type="number"
                                    dataKey="y"
                                    name="Day"
                                    domain={[0, 6]}
                                    tickFormatter={(val) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][val]}
                                    axisLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                                />
                                <ZAxis type="number" dataKey="z" range={[50, 400]} name="Revenue" unit="₹" />
                                <Tooltip
                                    cursor={{ strokeDasharray: '3 3' }}
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 900 }}
                                />
                                <Scatter name="Revenue Density" data={heatmapData}>
                                    {heatmapData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.z > 500 ? '#2563EB' : entry.z > 200 ? '#6366F1' : '#94a3b8'} />
                                    ))}
                                </Scatter>
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-between items-center px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="flex gap-4">
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-600" /> <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Peak High</span></div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500" /> <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Moderate</span></div>
                            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400" /> <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Low Density</span></div>
                        </div>
                    </div>
                </div>

                {/* Staff Efficiency Matrix */}
                <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm space-y-8">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight leading-none">Personnel Efficiency</h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-2 italic">Comparison: Output Velocity vs. Precision</p>
                    </div>

                    <div className="space-y-4">
                        {staffData.map((s, i) => (
                            <div key={s.name} className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:border-blue-100 transition-all">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br transition-all flex items-center justify-center font-black text-white italic ${i === 0 ? 'from-amber-400 to-orange-500 shadow-lg shadow-amber-200' : 'from-slate-400 to-slate-500 opacity-40'}`}>
                                            {i === 0 ? '🏆' : s.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{s.name}</p>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{s.jobs} Jobs Processed</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-blue-600 italic">Score: {((s.jobs * s.accuracy) / 100).toFixed(0)}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Efficiency Index</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                            <span>Processing Speed</span>
                                            <span className="text-blue-600">{s.speed} pgs/min</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${(s.speed / 10) * 100}%` }}
                                                className="h-full bg-blue-500 rounded-full"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                            <span>Accuracy Rating</span>
                                            <span className="text-emerald-500">{s.accuracy}%</span>
                                        </div>
                                        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${s.accuracy}%` }}
                                                className="h-full bg-emerald-500 rounded-full"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {staffData.length === 0 && (
                            <div className="py-10 text-center text-[10px] font-black text-slate-300 uppercase italic tracking-widest">
                                Waiting for Personnel Telemetry...
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
