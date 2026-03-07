'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin,
    FileText,
    User,
    Plus,
    Bell,
    CreditCard,
    ChevronRight,
    Zap,
    LayoutGrid,
    LogOut,
    Loader2,
    X,
    CheckCircle2,
    Clock,
    TrendingUp,
    History,
    Activity,
    ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ThemeToggle from '@/components/ThemeToggle';

import { DashboardSkeleton, Skeleton } from '@/components/Skeleton';
import { EmptyState } from '@/components/EmptyState';

export default function UserDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [activities, setActivities] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalSpent: 0,
        pendingOrders: 0
    });

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    router.push('/login');
                    return;
                }

                // Fetch Profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profileData && !profileData.is_onboarded) {
                    router.push('/onboarding');
                    return;
                }

                setProfile({
                    ...profileData,
                    id: profileData?.id || user.id,
                    full_name: profileData?.full_name || profileData?.name || user.user_metadata?.full_name || 'NexPrint User',
                    avatar_url: profileData?.avatar_url || user.user_metadata?.avatar_url || null,
                    email: profileData?.email || user.email
                });

                // Fetch All Orders for Analytics
                const { data: allOrders } = await supabase
                    .from('orders')
                    .select('id, total_amount, status')
                    .eq('user_id', user.id);

                if (allOrders) {
                    const spent = allOrders.reduce((acc: number, curr: any) => acc + (Number(curr.total_amount) || 0), 0);
                    const pending = allOrders.filter((o: any) => !['completed', 'cancelled'].includes(o.status)).length;
                    setStats({
                        totalOrders: allOrders.length,
                        totalSpent: spent,
                        pendingOrders: pending
                    });
                }

                // Fetch Recent Activity
                const { data: recentOrders } = await supabase
                    .from('orders')
                    .select('*, print_shops(name)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                setActivities(recentOrders || []);

                // Build notifications from recent orders
                const notifs = (recentOrders || []).map((order: any) => ({
                    id: order.id,
                    title: getNotifTitle(order.status),
                    body: `Order #${order.order_number?.slice(-6) || 'JOB'} • ${order.print_shops?.name || 'Local Terminal'}`,
                    time: order.updated_at || order.created_at,
                    status: order.status,
                    amount: order.total_amount,
                }));
                setNotifications(notifs);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                // Artificial delay for smooth UX transition
                setTimeout(() => setLoading(false), 800);
            }
        };

        fetchDashboardData();
    }, [router]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    // Derive notification text from order status
    const getNotifTitle = (status: string) => {
        const map: Record<string, string> = {
            pending: '🕐 Order Received',
            shop_accepted: '✅ Shop Accepted Your Order',
            printing: '🖨️ Printing in Progress',
            ready_pickup: '📦 Ready for Pickup!',
            out_delivery: '🚀 Out for Delivery',
            completed: '🎉 Order Completed',
            cancelled: '❌ Order Cancelled',
        };
        return map[status] || '🔔 Order Update';
    };

    const timeAgo = (iso: string) => {
        if (!iso) return '';
        const diff = (Date.now() - new Date(iso).getTime()) / 1000;
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)]">
                <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Skeleton className="w-10 h-10 rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="w-12 h-2" />
                            <Skeleton className="w-24 h-4" />
                        </div>
                    </div>
                </header>
                <DashboardSkeleton />
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans text-[var(--foreground)] bg-[var(--background)] transition-colors duration-300">
            {/* Header */}
            <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-5 py-3 sticky top-0 z-50">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    {/* Brand + User Identity */}
                    <div className="flex items-center gap-3">
                        {/* User Avatar (dp) */}
                        <div className="relative flex-shrink-0">
                            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-md ring-2 ring-blue-500/20">
                                {profile?.avatar_url ? (
                                    <img
                                        src={profile.avatar_url}
                                        alt={profile?.full_name || 'User'}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                                        <span className="text-white font-black text-base italic">
                                            {(profile?.full_name || 'U').charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {/* Online dot */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                        </div>

                        {/* Name + Brand */}
                        <div className="flex flex-col leading-none gap-0.5">
                            <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">NexPrint</span>
                            <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight truncate max-w-[130px]">
                                {profile?.full_name || 'User'}
                            </span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                        <ThemeToggle />
                        <button
                            onClick={() => setShowNotifications(true)}
                            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative"
                        >
                            <Bell size={18} />
                            {stats.pendingOrders > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                                    {stats.pendingOrders}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </header>


            <main className="max-w-md mx-auto px-5 pt-6 space-y-6 pb-24">

                {/* Analytics Snapshot */}
                <section className="bg-slate-900 dark:bg-slate-950 border border-white/5 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-200 dark:shadow-none">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/10 rounded-full -ml-12 -mb-12 blur-2xl" />

                    <div className="relative z-10 space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">Snapshot</h2>
                            <TrendingUp size={16} className="text-blue-400" />
                        </div>

                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black italic tracking-tight text-white">₹{stats.totalSpent.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-nowrap">Total Spent</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            <div>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Orders Placed</p>
                                <p className="text-xl font-black italic">{stats.totalOrders}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">In Pipeline</p>
                                <p className="text-xl font-black italic text-blue-400">{stats.pendingOrders}</p>
                            </div>
                        </div>

                        <Link href="/dashboard/orders" className="flex items-center justify-between w-full p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group">
                            <div className="flex items-center gap-3">
                                <History size={14} className="text-slate-400" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Order History</span>
                            </div>
                            <ArrowUpRight size={14} className="text-slate-500 group-hover:text-white transition-colors" />
                        </Link>
                    </div>
                </section>

                {/* Primary Actions */}
                <section className="grid grid-cols-1 gap-3">
                    <Link href="/dashboard/print-files" className="group">
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-6 flex items-center justify-between shadow-sm hover:shadow-xl transition-all hover:-translate-y-1">
                            <div className="flex items-center gap-5">
                                <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                                    <Plus size={28} strokeWidth={3} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold dark:text-white italic">New Order</h3>
                                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Upload Documents</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-slate-200 dark:text-slate-700 group-hover:text-blue-600 transition-colors" />
                        </div>
                    </Link>

                    <div className="grid grid-cols-2 gap-3">
                        <Link href="/dashboard/shops" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all active:scale-95">
                            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/20 text-amber-500 dark:text-amber-400 rounded-xl flex items-center justify-center">
                                <MapPin size={22} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Print Shops</h4>
                                <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Find Pickup Points</p>
                            </div>
                        </Link>

                        <Link href="/dashboard/orders" className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all active:scale-95">
                            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                                <History size={22} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">My Orders</h4>
                                <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Track & History</p>
                            </div>
                        </Link>
                    </div>
                </section>



                {/* Real-time Order Stream */}
                <section className="space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Recent Activity</h3>
                        <Link href="/dashboard/orders" className="text-[10px] font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-full transition-colors uppercase">View All</Link>
                    </div>

                    <div className="space-y-3">
                        {activities.length > 0 ? (
                            activities.map((order) => (
                                <Link href={`/dashboard/prints/${order.id}`} key={order.id} className="block group">
                                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-4 transition-all hover:border-blue-100 hover:shadow-lg hover:shadow-blue-500/5">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-slate-50 dark:bg-slate-800 border border-slate-50 dark:border-slate-700 transition-colors group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20`}>
                                            {order.status === 'completed' ? '📦' : order.status === 'cancelled' ? '❌' : '⏳'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h5 className="font-bold text-slate-900 dark:text-white text-xs truncate uppercase tracking-tight italic">Order #{order.order_number?.slice(-6) || 'JOB'}</h5>
                                                {['printing', 'shop_accepted'].includes(order.status) && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                                                )}
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">
                                                {order.print_shops?.name || 'Local Terminal'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-900 dark:text-white leading-none">₹{order.total_amount}</p>
                                            <span className={`text-[7px] font-bold uppercase tracking-tighter mt-1 block px-2 py-0.5 rounded-full border border-current ${order.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-800' :
                                                order.status === 'cancelled' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100/50 dark:border-red-800' :
                                                    'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100/50 dark:border-blue-800'
                                                }`}>
                                                {order.status?.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        ) : (
                            <EmptyState
                                icon={Activity}
                                title="No Active Sessions"
                                description="Start your first print job to see real-time insights here."
                                action={
                                    <Link href="/dashboard/print-files" className="px-6 py-3 bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
                                        Upload Now
                                    </Link>
                                }
                            />
                        )}
                    </div>
                </section>
            </main>
            {/* ── Notification Drawer ── */}
            <AnimatePresence>
                {showNotifications && (
                    <>
                        <motion.div key="notif-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowNotifications(false)}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]" />

                        <motion.div key="notif-panel"
                            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                            className="fixed bottom-0 left-0 right-0 z-[70] bg-white dark:bg-slate-900 rounded-t-[2.5rem] shadow-2xl max-h-[80vh] flex flex-col"
                        >
                            <div className="flex justify-center pt-3 pb-1">
                                <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                            </div>
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                                        <Bell size={18} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white">Notifications</h3>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{notifications.length} updates</p>
                                    </div>
                                </div>
                                <button onClick={() => setShowNotifications(false)} className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 active:scale-90 transition-all">
                                    <X size={16} />
                                </button>
                            </div>

                            <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-16 text-center">
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                                            <Bell size={28} className="text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <p className="text-sm font-black text-slate-400 italic">All clear!</p>
                                        <p className="text-[9px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest mt-1">No notifications yet</p>
                                    </div>
                                ) : notifications.map((notif) => (
                                    <Link key={notif.id} href={`/dashboard/prints/${notif.id}`} onClick={() => setShowNotifications(false)}
                                        className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 border border-transparent hover:border-blue-100 transition-all group">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${notif.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-900/20' : notif.status === 'cancelled' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-blue-50 dark:bg-blue-900/20'}`}>
                                            {notif.status === 'completed' ? '🎉' : notif.status === 'cancelled' ? '❌' : notif.status === 'ready_pickup' ? '📦' : notif.status === 'printing' ? '🖨️' : '🕐'}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-slate-900 dark:text-white">{notif.title}</p>
                                            <p className="text-[9px] font-bold text-slate-400 mt-0.5 truncate">{notif.body}</p>
                                            <p className="text-[8px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest mt-1">{timeAgo(notif.time)}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-xs font-black text-slate-700 dark:text-slate-300">₹{notif.amount}</p>
                                            <ChevronRight size={12} className="text-slate-300 mt-1 ml-auto group-hover:text-blue-500 transition-colors" />
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            <div className="px-4 pb-6 pt-3 border-t border-slate-100 dark:border-slate-800">
                                <Link href="/dashboard/orders" onClick={() => setShowNotifications(false)}
                                    className="flex items-center justify-center gap-2 w-full py-4 bg-slate-900 dark:bg-slate-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                                    <History size={14} /> View All Orders
                                </Link>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
