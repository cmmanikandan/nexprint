'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Truck,
    MapPin,
    Phone,
    CheckCircle,
    Clock,
    Search,
    Filter,
    Plus,
    Settings2,
    Zap,
    Package,
    Navigation,
    User,
    ArrowRight,
    Loader2,
    ShieldCheck
} from 'lucide-react';
import AddPartnerModal from '@/components/AddPartnerModal';
import ManageStaffModal from '@/components/ManageStaffModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function DeliveryLogisticsPage() {
    const [activeTab, setActiveTab] = useState<'relay' | 'fleet'>('relay');
    const [partners, setPartners] = useState<any[]>([]);
    const [activeMissions, setActiveMissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedPartner, setSelectedPartner] = useState<any | null>(null);
    const [assigningMission, setAssigningMission] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Fetch Partners
            const { data: partnersData } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'delivery_partner')
                .order('created_at', { ascending: false });

            setPartners(partnersData || []);

            // Fetch Active Missions (delivery needed, not arrived yet)
            const { data: missionsData } = await supabase
                .from('orders')
                .select(`
                    *,
                    profiles!user_id(full_name, phone),
                    delivery_partner:profiles!delivery_partner_id(full_name, phone)
                `)
                .eq('delivery_needed', true)
                .neq('delivery_status', 'delivered')
                .order('is_emergency', { ascending: false })
                .order('created_at', { ascending: false });

            setActiveMissions(missionsData || []);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // 10s auto-refresh for logistics
        return () => clearInterval(interval);
    }, [fetchData]);

    const handleAssignPartner = async (orderId: string, partnerId: string) => {
        try {
            setAssigningMission(orderId);
            const { error } = await supabase
                .from('orders')
                .update({
                    delivery_partner_id: partnerId,
                    delivery_status: 'accepted'
                })
                .eq('id', orderId);

            if (error) throw error;
            fetchData();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setAssigningMission(null);
        }
    };

    const filteredPartners = partners.filter(p =>
        !searchQuery ||
        p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const missionStats = {
        pending: activeMissions.filter(m => !m.delivery_partner_id).length,
        inProgress: activeMissions.filter(m => m.delivery_partner_id && m.delivery_status !== 'delivered').length,
        availablePartners: partners.filter(p => !activeMissions.some(m => m.delivery_partner_id === p.id)).length
    };

    return (
        <div className="space-y-10 font-outfit pb-32">
            <AddPartnerModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchData}
            />

            <ManageStaffModal
                isOpen={!!selectedPartner}
                member={selectedPartner}
                onClose={() => setSelectedPartner(null)}
                onSuccess={fetchData}
            />

            {/* Premium Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-black uppercase tracking-widest border border-blue-100">Logistics Engine</div>
                        <div className="px-2 py-0.5 bg-slate-900 text-white rounded text-[8px] font-black uppercase tracking-widest">Active Relay</div>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Delivery Relay</h1>
                    <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-[0.3em] italic">Real-time Dispatch & Fleet Intelligence</p>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('relay')}
                        className={`flex-1 md:flex-none px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'relay' ? 'bg-white text-slate-900 shadow-xl shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Active Relay ({activeMissions.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('fleet')}
                        className={`flex-1 md:flex-none px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'fleet' ? 'bg-white text-slate-900 shadow-xl shadow-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Fleet Manager ({partners.length})
                    </button>
                </div>
            </div>

            {/* Summary Layer */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Unassigned Targets', value: missionStats.pending, icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Active Missions', value: missionStats.inProgress, icon: Truck, color: 'text-blue-500', bg: 'bg-blue-50' },
                    { label: 'Fleet Ready', value: missionStats.availablePartners, icon: ShieldCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Avg Shift Time', value: '18m', icon: Clock, color: 'text-slate-500', bg: 'bg-slate-50' },
                ].map((stat, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={stat.label}
                        className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group"
                    >
                        <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-6`}>
                            <stat.icon size={22} />
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
                    </motion.div>
                ))}
            </div>

            {activeTab === 'relay' ? (
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Mission Control</h2>
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                            Live Telemetry Active
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {activeMissions.map((mission) => (
                            <motion.div
                                layout
                                key={mission.id}
                                className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm hover:border-blue-200 transition-all group"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-black text-slate-900 uppercase">#{mission.order_number?.slice(-8)}</span>
                                            {mission.is_emergency && (
                                                <div className="px-2 py-0.5 bg-red-50 text-red-600 rounded text-[7px] font-black uppercase tracking-tighter border border-red-100">BLITZ</div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            <Clock size={12} />
                                            {new Date(mission.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div className={`px-4 py-2 rounded-full text-[8px] font-black uppercase tracking-widest ${mission.delivery_status === 'picked_up' ? 'bg-blue-50 text-blue-600' :
                                            mission.delivery_status === 'accepted' ? 'bg-amber-50 text-amber-600' :
                                                'bg-slate-50 text-slate-400'
                                        }`}>
                                        {mission.delivery_status?.replace('_', ' ') || 'Awaiting Partner'}
                                    </div>
                                </div>

                                <div className="space-y-6 mb-8">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                            <User size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Recipient</p>
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-tighter">{mission.profiles?.full_name || 'Guest'}</p>
                                            <p className="text-[10px] text-slate-500 mt-1 font-bold">{mission.delivery_address || 'Terminal Pickup'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 shrink-0">
                                            <Truck size={14} />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Assigned Partner</p>
                                            {mission.delivery_partner ? (
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs font-black text-blue-600 uppercase tracking-tighter">{mission.delivery_partner.full_name}</p>
                                                </div>
                                            ) : (
                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">Awaiting Selection...</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {!mission.delivery_partner_id ? (
                                    <div className="pt-6 border-t border-slate-50">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-4">Manual Dispatch</p>
                                        <div className="space-y-2">
                                            {partners.filter(p => p.is_online !== false).slice(0, 3).map(p => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => handleAssignPartner(mission.id, p.id)}
                                                    disabled={!!assigningMission}
                                                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-600 hover:text-white transition-all group/btn"
                                                >
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{p.full_name}</span>
                                                    {assigningMission === mission.id ? (
                                                        <Loader2 size={12} className="animate-spin" />
                                                    ) : (
                                                        <ArrowRight size={12} className="opacity-0 group-hover/btn:opacity-100 translate-x-1" />
                                                    )}
                                                </button>
                                            ))}
                                            <button className="w-full py-3 text-[8px] font-black text-blue-600 uppercase tracking-[0.2em]">View All Online Partners</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pt-6 border-t border-slate-50 flex gap-4">
                                        <button className="flex-1 py-4 bg-slate-50 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">Track GPS</button>
                                        <button className="flex-1 py-4 bg-slate-50 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all">Reassign</button>
                                    </div>
                                )}
                            </motion.div>
                        ))}

                        {activeMissions.length === 0 && (
                            <div className="col-span-full py-40 text-center bg-white rounded-[4rem] border border-dashed border-slate-200">
                                <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                                    <Package size={32} className="text-slate-200" />
                                </div>
                                <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">No Active Missions</h3>
                                <p className="text-[10px] text-slate-300 mt-2 uppercase tracking-[0.4em] italic">Waiting for Dispatch Telemetry...</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-4">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">Fleet Asset Management</h2>
                        <div className="flex gap-3 w-full md:w-auto">
                            <div className="bg-white rounded-2xl border border-slate-100 px-4 h-12 flex items-center gap-3 flex-1 md:w-64">
                                <Search size={18} className="text-slate-300" />
                                <input
                                    placeholder="SEARCH FLEET..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-slate-700 w-full placeholder:text-slate-300"
                                />
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(true)}
                                className="h-12 px-8 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-2xl shadow-blue-500/20 active:scale-95 flex items-center gap-2"
                            >
                                <Plus size={16} />
                                Add Partner
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredPartners.map((partner) => (
                            <motion.div
                                layout
                                key={partner.id}
                                onClick={() => setSelectedPartner(partner)}
                                className="p-8 rounded-[3rem] bg-white border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-2xl hover:shadow-slate-200 transition-all cursor-pointer"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="w-16 h-16 rounded-[1.8rem] bg-slate-900 flex items-center justify-center text-white text-xl font-black shadow-xl shadow-slate-200 overflow-hidden">
                                        {partner.avatar_url ? (
                                            <img src={partner.avatar_url} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            partner.full_name?.charAt(0) || 'D'
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest inline-block ${partner.is_online !== false ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400'}`}>
                                            {partner.is_online !== false ? 'Active' : 'Offline'}
                                        </div>
                                        <p className="text-[9px] font-black text-slate-400 mt-2 uppercase tracking-widest">ID: {partner.reg_no || partner.id.slice(0, 8)}</p>
                                    </div>
                                </div>

                                <div className="mb-8">
                                    <h3 className="text-xl font-black text-slate-900 tracking-tight">{partner.full_name}</h3>
                                    <div className="flex items-center gap-2 mt-2 text-slate-400">
                                        <Phone size={14} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{partner.phone || 'NO CONTACT'}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 pb-8 border-b border-slate-50">
                                    <div className="p-5 bg-slate-50 rounded-[1.5rem] group-hover:bg-blue-50 transition-colors">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-blue-400">Rating</p>
                                        <p className="text-xl font-black text-slate-900 tracking-tighter italic">4.9/5</p>
                                    </div>
                                    <div className="p-5 bg-slate-50 rounded-[1.5rem] group-hover:bg-emerald-50 transition-colors">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-emerald-400">Deliveries</p>
                                        <p className="text-xl font-black text-slate-900 tracking-tighter italic">{partner.total_deliveries || 0}</p>
                                    </div>
                                </div>

                                <div className="pt-8 flex gap-3">
                                    <button className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                                        <Settings2 size={16} />
                                        Configure
                                    </button>
                                </div>
                            </motion.div>
                        ))}

                        {filteredPartners.length === 0 && !loading && (
                            <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                                <Truck size={32} className="mx-auto text-slate-200 mb-4" />
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Partners Found</h3>
                                <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-widest">Register delivery partners to see them here</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
