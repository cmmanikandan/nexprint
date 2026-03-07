'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Clock,
    Save,
    ToggleLeft,
    ToggleRight,
    CheckCircle2,
    Zap,
    AlertTriangle,
    Timer,
    Activity,
    ChefHat,
    ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
    monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
    thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
};

const DEFAULT_HOURS: Record<string, { open: string; close: string; closed: boolean }> = {
    monday: { open: '09:00', close: '21:00', closed: false },
    tuesday: { open: '09:00', close: '21:00', closed: false },
    wednesday: { open: '09:00', close: '21:00', closed: false },
    thursday: { open: '09:00', close: '21:00', closed: false },
    friday: { open: '09:00', close: '21:00', closed: false },
    saturday: { open: '09:00', close: '18:00', closed: false },
    sunday: { open: '10:00', close: '14:00', closed: true },
};

export default function ShopHoursPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [shopId, setShopId] = useState<string | null>(null);
    const [hours, setHours] = useState(DEFAULT_HOURS);
    const [panicMode, setPanicMode] = useState(false);
    const [busyMode, setBusyMode] = useState(false);
    const [backInTime, setBackInTime] = useState('30');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetch = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;
            const { data: shop } = await supabase
                .from('print_shops')
                .select('id, settings, status')
                .eq('owner_id', session.user.id)
                .single();

            if (shop) {
                setShopId(shop.id);
                setPanicMode(shop.status === 'busy' || shop.settings?.emergency_closed);
                setBusyMode(shop.settings?.busy_mode || false);
                setBackInTime(shop.settings?.back_in_minutes || '30');
                if (shop.settings?.hours) {
                    setHours({ ...DEFAULT_HOURS, ...shop.settings.hours });
                }
            }
            setLoading(false);
        };
        fetch();
    }, []);

    const handleSave = async (extraSettings = {}) => {
        if (!shopId) return;
        setSaving(true);
        try {
            const { data: shop } = await supabase.from('print_shops').select('settings').eq('id', shopId).single();
            const updatedSettings = {
                ...shop?.settings,
                hours,
                emergency_closed: panicMode,
                busy_mode: busyMode,
                back_in_minutes: backInTime,
                ...extraSettings
            };

            await supabase.from('print_shops').update({
                settings: updatedSettings,
                status: panicMode ? 'busy' : (busyMode ? 'busy' : 'open')
            }).eq('id', shopId);

            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } finally {
            setSaving(false);
        }
    };

    const update = (day: string, field: 'open' | 'close' | 'closed', value: any) => {
        setHours(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    };

    const togglePanic = async () => {
        const newPanic = !panicMode;
        setPanicMode(newPanic);
        // Immediate save for emergency
        setSaving(true);
        const { data: shop } = await supabase.from('print_shops').select('settings').eq('id', shopId!).single();
        await supabase.from('print_shops').update({
            settings: { ...shop?.settings, emergency_closed: newPanic },
            status: newPanic ? 'busy' : 'open'
        }).eq('id', shopId!);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    // Determine current status based on today's hours
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const todayHours = hours[today];
    const now = new Date();
    const [oh, om] = todayHours?.open?.split(':').map(Number) ?? [9, 0];
    const [ch, cm] = todayHours?.close?.split(':').map(Number) ?? [21, 0];
    const isOpenNow = !todayHours?.closed && !panicMode &&
        now.getHours() * 60 + now.getMinutes() >= oh * 60 + om &&
        now.getHours() * 60 + now.getMinutes() < ch * 60 + cm;

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 font-outfit">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center animate-spin mx-auto">
                    <Clock size={20} className="text-blue-500" />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Synchronizing Schedules...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-4xl space-y-8 font-outfit pb-40">
            {/* ─── Emergency Operations Bar ────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`p-8 rounded-[2.5rem] border flex items-center justify-between shadow-2xl transition-all ${panicMode ? 'bg-red-600 border-red-500' : 'bg-slate-900 border-slate-800'}`}
                >
                    <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${panicMode ? 'bg-white text-red-600' : 'bg-red-600 text-white animate-pulse'}`}>
                            <ShieldAlert size={28} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white leading-none">Emergency Stop</h3>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-2">{panicMode ? 'TERMINAL DISABLED' : 'PANIC BUTTON'}</p>
                        </div>
                    </div>
                    <button
                        onClick={togglePanic}
                        className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${panicMode ? 'bg-white text-red-600 hover:bg-slate-50 shadow-xl' : 'bg-red-600/20 text-red-100 border border-red-600/30 hover:bg-red-600 hover:text-white'}`}
                    >
                        {panicMode ? 'End Emergency' : 'Initiate Stop'}
                    </button>
                </motion.div>

                <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`p-8 rounded-[2.5rem] border flex items-center justify-between shadow-2xl transition-all ${busyMode ? 'bg-amber-500 border-amber-400' : 'bg-white border-slate-100 shadow-sm'}`}
                >
                    <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${busyMode ? 'bg-white text-amber-600' : 'bg-amber-50 text-amber-600'}`}>
                            <Activity size={28} className={busyMode ? 'animate-bounce' : ''} />
                        </div>
                        <div>
                            <h3 className={`text-xl font-black leading-none ${busyMode ? 'text-white' : 'text-slate-900'}`}>Auto-Busy Mode</h3>
                            <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${busyMode ? 'text-white/40' : 'text-slate-400'}`}>Capacity Warning</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { setBusyMode(!busyMode); handleSave({ busy_mode: !busyMode }); }}
                        className={`px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${busyMode ? 'bg-white text-amber-600' : 'bg-slate-900 text-white'}`}
                    >
                        {busyMode ? 'Set Regular' : 'Mark Busy'}
                    </button>
                </motion.div>
            </div>

            <AnimatePresence>
                {panicMode && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="p-8 bg-red-50 border border-red-100 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-sm overflow-hidden"
                    >
                        <div className="flex items-center gap-4 text-red-600">
                            <Timer size={24} className="animate-spin-slow" />
                            <div>
                                <p className="text-sm font-black uppercase italic tracking-tighter">Automated 'Back In' Timer</p>
                                <p className="text-[9px] font-bold text-red-400 uppercase tracking-widest">Customers will see this on the app</p>
                            </div>
                        </div>
                        <div className="flex-1 flex gap-3">
                            {['15', '30', '60', '120'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => { setBackInTime(m); handleSave({ back_in_minutes: m }); }}
                                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${backInTime === m ? 'bg-red-600 text-white shadow-lg' : 'bg-white text-red-400 border border-red-100 hover:bg-red-100'}`}
                                >
                                    {m} Mins
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ─── Header & Primary Controls ────────────────────────────── */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6
        bg-white/60 backdrop-blur-xl p-10 rounded-[3rem] border border-slate-50 shadow-sm sticky top-0 z-40">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Weekly Schedule</h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3 italic">Establish Regular Console Availability</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 px-6 py-4 rounded-[2rem] border text-[10px] font-black uppercase tracking-widest shadow-inner
            ${isOpenNow ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${isOpenNow ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                        {isOpenNow ? 'Online Hub' : 'Offline'}
                    </div>
                    <button
                        onClick={() => handleSave()}
                        disabled={saving}
                        className="px-8 py-4 bg-blue-600 text-white rounded-[2rem] flex items-center gap-3 text-[10px] font-black
              uppercase tracking-widest hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
                    >
                        {saving ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : saved ? (
                            <><CheckCircle2 size={16} /> Matrix Saved</>
                        ) : (
                            <><Save size={16} /> Save Changes</>
                        )}
                    </button>
                </div>
            </div>

            {/* Quick copy all */}
            <div className="flex justify-center gap-4">
                <button
                    onClick={() => {
                        const mon = hours.monday;
                        const updated: any = {};
                        DAYS.forEach(d => { updated[d] = { ...mon, closed: d === 'sunday' }; });
                        setHours(prev => ({ ...prev, ...updated }));
                    }}
                    className="px-6 py-3 bg-slate-100 border border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-500 rounded-full hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                >
                    Standardize Weekdays (Mon-Sat)
                </button>
                <button
                    onClick={() => setHours(DEFAULT_HOURS)}
                    className="px-6 py-3 bg-slate-50 border border-slate-100 text-[9px] font-black uppercase tracking-widest text-slate-400 rounded-full hover:text-slate-900 transition-all italic"
                >
                    Reset to Factory Defaults
                </button>
            </div>

            {/* Days list */}
            <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-xl overflow-hidden divide-y divide-slate-50 p-4">
                {DAYS.map((day) => {
                    const h = hours[day];
                    const isToday = day === today;
                    return (
                        <div key={day} className={`p-8 flex flex-col sm:flex-row items-start sm:items-center gap-8 transition-all rounded-[2.5rem] mb-2
              ${isToday ? 'bg-blue-50/50 ring-2 ring-blue-500/5' : 'hover:bg-slate-50'}`}>
                            <div className="flex items-center gap-4 w-44 flex-shrink-0">
                                {isToday && <div className="w-2 h-2 rounded-full bg-blue-600 shadow-lg shadow-blue-200" />}
                                <span className={`text-lg font-black tracking-tight ${isToday ? 'text-blue-700' : 'text-slate-900 uppercase italic'}`}>
                                    {DAY_LABELS[day]}
                                </span>
                            </div>

                            {h.closed ? (
                                <div className="flex-1">
                                    <div className="px-6 py-3 bg-slate-100 rounded-2xl inline-block">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Deactivated Status</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-4 flex-1">
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input
                                            type="time"
                                            value={h.open}
                                            onChange={e => update(day, 'open', e.target.value)}
                                            className="bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-black text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                                        />
                                    </div>
                                    <div className="w-6 h-0.5 bg-slate-200 rounded-full" />
                                    <div className="relative">
                                        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                        <input
                                            type="time"
                                            value={h.close}
                                            onChange={e => update(day, 'close', e.target.value)}
                                            className="bg-slate-50/50 border border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-black text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition-all"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Status Switch */}
                            <button
                                onClick={() => update(day, 'closed', !h.closed)}
                                className={`flex items-center gap-3 px-6 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all
                  ${h.closed ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-slate-900 text-white shadow-xl shadow-slate-200 hover:scale-105'}`}
                            >
                                {h.closed ? <ShieldAlert size={14} /> : <Zap size={14} className="text-blue-500" />}
                                {h.closed ? 'Mark Operational' : 'Active Duty'}
                            </button>
                        </div>
                    );
                })}
            </div>

            <div className="bg-blue-50/30 p-10 rounded-[3rem] border border-blue-100/50 text-center space-y-4">
                <ChefHat className="w-10 h-10 text-blue-600 mx-auto" strokeWidth={1.5} />
                <h4 className="text-xl font-black text-slate-900 tracking-tight">Console Availability Policy</h4>
                <p className="max-w-md mx-auto text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                    Schedules updated here synchronize with the user portal in less than 500ms.
                    Panic mode override sends push notifications to all users currently creating orders.
                </p>
            </div>
        </div>
    );
}
