'use client';

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const data = [
    { name: 'Jan', orders: 400, revenue: 2400 },
    { name: 'Feb', orders: 300, revenue: 1398 },
    { name: 'Mar', orders: 200, revenue: 9800 },
    { name: 'Apr', orders: 278, revenue: 3908 },
    { name: 'May', orders: 189, revenue: 4800 },
    { name: 'Jun', orders: 239, revenue: 3800 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function ReportsPage() {
    return (
        <div className="space-y-8 pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Analytics & Reports</h1>
                    <p className="text-slate-500 mt-1">Detailed performance insights for your shop</p>
                </div>
                <div className="flex gap-2">
                    <select className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                        <option>Last 30 Days</option>
                        <option>Last 6 Months</option>
                        <option>Current Year</option>
                    </select>
                    <button className="px-5 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-blue-600 shadow-sm transition">
                        Export Report
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
                        Revenue Growth
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" />
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                        Order Volume
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="orders" fill="#10b981" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Key Statistics</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50 p-6 rounded-2xl">
                        <p className="text-sm font-medium text-slate-500">Avg. Order Value</p>
                        <h4 className="text-2xl font-bold text-slate-900 mt-2">₹425.00</h4>
                        <p className="text-xs text-emerald-600 mt-1">↑ 12% from last month</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl">
                        <p className="text-sm font-medium text-slate-500">Completion Rate</p>
                        <h4 className="text-2xl font-bold text-slate-900 mt-2">98.2%</h4>
                        <p className="text-xs text-emerald-600 mt-1">↑ 2% improvement</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-2xl">
                        <p className="text-sm font-medium text-slate-500">Return Customers</p>
                        <h4 className="text-2xl font-bold text-slate-900 mt-2">64%</h4>
                        <p className="text-xs text-blue-600 mt-1">Steady engagement</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
