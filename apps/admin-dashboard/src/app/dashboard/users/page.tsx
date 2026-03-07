'use client';

import { useState, useEffect } from 'react';
import { Search, MoreVertical, Filter, UserPlus, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { createShopAdmin } from './actions';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      setUsers(data || []);
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const result = await createShopAdmin(formData);

    if (result.error) {
      setError(result.error);
      setFormLoading(false);
    } else {
      setIsModalOpen(false);
      setFormLoading(false);
      fetchUsers(); // Refresh list
    }
  };

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 font-outfit pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Global Registry</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Authority Management • {users.length} Total Users</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 active:scale-95 transition-all flex items-center justify-center gap-2">
          <UserPlus size={16} />
          Provision Authority
        </button>
      </div>

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">New Authority</h2>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Access Provisioning Interface</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-8 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-relaxed text-center">
                    System Alert: {error}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Full Identity</label>
                  <input
                    name="fullName"
                    required
                    placeholder="Enter full name..."
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none placeholder:text-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Communication Node (Email)</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="admin@nexus.com"
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none placeholder:text-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">Security Key (Password)</label>
                  <input
                    name="password"
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl px-5 text-[10px] font-black uppercase tracking-widest text-slate-700 focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-200 transition-all outline-none placeholder:text-slate-300"
                  />
                </div>
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button
                  disabled={formLoading}
                  type="submit"
                  className="w-full h-12 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-slate-900/10 active:scale-95 disabled:opacity-50 disabled:active:scale-100 transition-all flex items-center justify-center gap-2">
                  {formLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <>
                      <UserPlus size={16} />
                      Grant Shop Access
                    </>
                  )}
                </button>
                <p className="text-[8px] font-bold text-slate-400 text-center uppercase tracking-[0.2em]">
                  Authority level will be set to: SHOP_OWNER
                </p>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1 bg-white border border-slate-100 rounded-2xl px-4 h-12 flex items-center gap-3 shadow-sm focus-within:ring-4 focus-within:ring-blue-50 transition-all">
          <Search size={18} className="text-slate-300" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by authority name or email..."
            className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-slate-700 w-full placeholder:text-slate-300"
          />
        </div>
      </div>

      {/* Responsive List/Table */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* Mobile View: Card List */}
        <div className="block md:hidden divide-y divide-slate-50">
          {filteredUsers.map((user) => (
            <div key={user.id} className="p-5 flex items-center justify-between active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm shadow-inner">
                  {user.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm truncate max-w-[150px]">{user.full_name || 'System User'}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.role}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md inline-block mb-1 bg-emerald-50 text-emerald-600`}>
                  Active
                </div>
                <p className="text-[9px] font-medium text-slate-300">{new Date(user.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden md:block">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Authority Member</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Contact Node</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clearance Level</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Registry Date</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                        {user.full_name?.charAt(0) || 'U'}
                      </div>
                      <span className="font-black text-slate-900 text-sm">{user.full_name || 'System User'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-slate-500">{user.email || 'hidden@nexus.com'}</td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-[10px] font-black uppercase tracking-widest border border-slate-200 shadow-sm">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      {new Date(user.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <button className="text-slate-300 hover:text-slate-600 p-2 rounded-xl transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
