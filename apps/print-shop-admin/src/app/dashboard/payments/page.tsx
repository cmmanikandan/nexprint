'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie,
    AreaChart,
    Area
} from 'recharts';
import {
    DollarSign,
    Download,
    Wallet,
    FileText,
    Users as UsersIcon,
    ArrowUpRight,
    Search,
    Calendar,
    Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

export default function PaymentsPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        successful: 0,
        delivery: 0,
        gst: 0,
        partnerPayouts: 0,
        shopNet: 0
    });
    const [chartData, setChartData] = useState<any[]>([]);
    const [revenueSplit, setRevenueSplit] = useState<any[]>([]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data: shop } = await supabase
                .from('print_shops')
                .select('id')
                .eq('owner_id', session.user.id)
                .single();

            if (!shop) return;

            const { data, error } = await supabase
                .from('orders')
                .select(`
                    *,
                    profiles!user_id(full_name),
                    delivery_partner:profiles!delivery_partner_id(full_name)
                `)
                .eq('shop_id', shop.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPayments(data || []);

            const successful = data?.filter(p => p.payment_status === 'paid') || [];
            const pending = data?.filter(p => p.payment_status !== 'paid') || [];

            const gross = successful.reduce((acc, curr) => acc + Number(curr.total_amount), 0);
            const deliveryRev = successful.reduce((acc, curr) => acc + (curr.delivery_needed ? (curr.delivery_fee || 20) : 0), 0);

            const gst = gross * 0.18;
            const partnerPayouts = successful.reduce((acc, curr) =>
                acc + (curr.delivery_partner_id ? (curr.delivery_fee || 20) * 0.7 : 0), 0
            );
            const shopNet = gross - gst - partnerPayouts;

            setStats({
                total: gross,
                pending: pending.length,
                successful: successful.length,
                delivery: deliveryRev,
                gst,
                partnerPayouts,
                shopNet
            });

            setRevenueSplit([
                { name: 'Shop Net', value: shopNet },
                { name: 'GST (Tax)', value: gst },
                { name: 'Partner Payouts', value: partnerPayouts }
            ]);

            const last15Days = Array.from({ length: 15 }, (_, i) => {
                const d = new Date();
                d.setDate(d.getDate() - i);
                return d.toISOString().split('T')[0];
            }).reverse();

            const chart = last15Days.map(date => {
                const dayOrders = successful.filter(p => p.created_at.startsWith(date));
                const dayTotal = dayOrders.reduce((acc, curr) => acc + Number(curr.total_amount), 0);
                return {
                    date: date.split('-').slice(1).join('/'),
                    revenue: dayTotal
                };
            });
            setChartData(chart);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const exportCSV = () => {
        const headers = ['Order #', 'Customer', 'Partner', 'Amount', 'GST', 'Status', 'Date'];
        const rows = payments.map(p => [
            p.order_number,
            p.profiles?.full_name || 'Guest',
            p.delivery_partner?.full_name || 'N/A',
            p.total_amount,
            (Number(p.total_amount) * 0.18).toFixed(2),
            p.payment_status,
            new Date(p.created_at).toLocaleDateString()
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `nexprint_fiscal_audit_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 font-outfit">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center animate-bounce mx-auto shadow-2xl shadow-indigo-200">
                    <DollarSign size={20} className="text-white" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Reconciling Ledgers...</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-10 font-outfit pb-32">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase tracking-widest border border-emerald-100">Verified Hub</div>
                        <div className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-black uppercase tracking-widest">Q3 FY26</div>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Settlements HUB</h1>
                    <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-[0.3em] italic">Automated Fiscal Reconciliation & Payout Engine</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
                        <Calendar size={14} />
                        Filter Period
                    </button>
                    <button
                        onClick={exportCSV}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-500/20 active:scale-95"
                    >
                        <Download size={14} />
                        Export Audit Warehouse
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Gross Revenue', value: stats.total, trend: '+18.4%', icon: Wallet, color: 'indigo' },
                    { label: 'Shop Net Pay', value: stats.shopNet, trend: '+12.2%', icon: DollarSign, color: 'emerald' },
                    { label: 'Partner Payouts', value: stats.partnerPayouts, trend: 'Active', icon: UsersIcon, color: 'amber' },
                    { label: 'GST Accrual', value: stats.gst, trend: '18% Fixed', icon: FileText, color: 'slate' },
                ].map((card, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={card.label}
                        className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center mb-6">
                            <card.icon size={20} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{card.label}</p>
                        <div className="flex items-baseline gap-3">
                            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">₹{Math.round(card.value).toLocaleString()}</h3>
                            <span className="text-[9px] font-black text-emerald-500 flex items-center gap-0.5">
                                {card.trend} <ArrowUpRight size={12} />
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm space-y-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-slate-900 leading-none tracking-tight">Financial Velocity</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3 italic">Cashflow Dynamics (Last 15 Days)</p>
                        </div>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 10, fontWeight: 900 }} />
                                <Tooltip />
                                <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={4} fill="url(#colorRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-[3.5rem] p-10 border border-slate-100 shadow-sm space-y-10">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 leading-none tracking-tight">Settlement Split</h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3 italic">Net Profit After Disbursals</p>
                    </div>
                    <div className="h-[280px] relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={revenueSplit}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={70}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {revenueSplit.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="space-y-4 pt-6">
                        {revenueSplit.map((item, i) => (
                            <div key={item.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.name}</span>
                                </div>
                                <span className="text-xs font-black text-slate-900">₹{Math.round(item.value).toLocaleString()}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Fiscal Ledger</h3>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3 italic">Real-time Transactional Sync</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input
                            type="text"
                            placeholder="Search Ledger..."
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none transition-all"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/20 border-b border-slate-50">
                                <th className="py-8 px-10 text-[9px] font-black text-slate-400 uppercase tracking-widest">Transaction</th>
                                <th className="py-8 px-10 text-[9px] font-black text-slate-400 uppercase tracking-widest">Entity</th>
                                <th className="py-8 px-10 text-[9px] font-black text-slate-400 uppercase tracking-widest">Partner</th>
                                <th className="py-8 px-10 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                <th className="py-8 px-10 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Revenue</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {payments.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-all">
                                    <td className="py-8 px-10 text-sm font-black text-slate-900">{item.order_number}</td>
                                    <td className="py-8 px-10 text-xs font-black text-slate-700 uppercase">{item.profiles?.full_name || 'Guest User'}</td>
                                    <td className="py-8 px-10 text-[10px] font-black text-indigo-600 uppercase tracking-widest">{item.delivery_partner?.full_name || 'N/A'}</td>
                                    <td className="py-8 px-10">
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest ${item.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {item.payment_status || 'PENDING'}
                                        </div>
                                    </td>
                                    <td className="py-8 px-10 text-right text-sm font-black text-slate-900 italic">₹{item.total_amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {payments.length === 0 && (
                    <div className="py-32 text-center">
                        <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Awaiting Financial Activity...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
