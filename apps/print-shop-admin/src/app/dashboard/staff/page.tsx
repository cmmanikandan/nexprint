'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Users, Shield, UserPlus, Phone, CheckCircle, XCircle, Search, Mail, Plus, Settings2 } from 'lucide-react';
import AddStaffModal from '@/components/AddStaffModal';
import ManageStaffModal from '@/components/ManageStaffModal';

export default function PersonnelHubPage() {
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<any | null>(null);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: shop } = await supabase
                .from('print_shops')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (!shop) return;

            const { data, error } = await supabase
                .from('shop_staff')
                .select(`
                    *,
                    profile:profiles!shop_staff_user_id_fkey (
                        email,
                        avatar_url
                    )
                `)
                .eq('shop_id', shop.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setStaff(data || []);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const filteredStaff = staff.filter(s =>
        !searchQuery ||
        s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.role?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 font-outfit">
            <AddStaffModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchStaff}
            />

            <ManageStaffModal
                isOpen={!!selectedMember}
                member={selectedMember}
                onClose={() => setSelectedMember(null)}
                onSuccess={fetchStaff}
            />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Personnel HUB</h1>
                    <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-[0.2em] italic">Manage Shop Staff & Permissions</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="bg-white rounded-2xl border border-slate-100 px-4 h-12 flex items-center gap-3 flex-1 md:w-64">
                        <Search size={18} className="text-slate-300" />
                        <input
                            placeholder="SEARCH STAFF..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-slate-700 w-full placeholder:text-slate-300"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-12 px-6 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-2"
                    >
                        <UserPlus size={16} />
                        Hire Staff
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredStaff.map((member) => (
                    <div
                        key={member.id}
                        onClick={() => setSelectedMember(member)}
                        className="p-8 rounded-[2.5rem] bg-white border border-slate-50 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-slate-100 transition-all cursor-pointer"
                    >
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg shadow-inner ring-4 ring-blue-50 overflow-hidden">
                                {member.profile?.avatar_url ? (
                                    <img src={member.profile.avatar_url} className="w-full h-full object-cover" alt="" />
                                ) : (
                                    member.full_name?.charAt(0) || 'S'
                                )}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-black text-slate-900 text-base leading-none mb-1 truncate">{member.full_name}</h3>
                                <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 italic uppercase">
                                    {member.role || 'Assistant'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-3 text-slate-400">
                                <Phone size={14} className="shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-widest truncate">{member.phone || 'NO PHONE'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-400">
                                <Mail size={14} className="shrink-0" />
                                <span className="text-[10px] font-black lowercase tracking-widest truncate">{member.profile?.email || 'No Linked Account'}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full ${member.status === 'online' && member.user_id ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                    {!member.user_id ? 'INCOMPLETE SETUP' : (member.status || 'OFFLINE')}
                                </span>
                            </div>
                        </div>

                        <div className="pt-6 flex gap-2 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="flex-1 py-3 bg-slate-50 text-slate-400 rounded-xl text-[8px] font-black uppercase tracking-widest hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2">
                                <Settings2 size={12} />
                                Manage Member
                            </button>
                        </div>
                    </div>
                ))}

                {filteredStaff.length === 0 && !loading && (
                    <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
                        <Users size={32} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Staff Registered</h3>
                        <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-widest">Add staff members to help manage your shop</p>
                    </div>
                )}
            </div>
        </div>
    );
}
