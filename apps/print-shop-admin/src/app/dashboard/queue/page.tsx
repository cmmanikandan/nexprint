'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Eye, Download, Printer, CheckCircle2, Loader2, XCircle } from 'lucide-react';

export default function QueuePage() {
  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<any[]>([]);

  const fetchQueue = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: shop } = await supabase
      .from('print_shops')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (shop) {
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*), profiles!user_id(full_name)')
        .eq('shop_id', shop.id)
        .in('status', ['shop_accepted', 'printing'])
        .order('priority', { ascending: false }) // 1 first (Emergency)
        .order('created_at', { ascending: true }); // Then FIFO

      if (!error) setQueue(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQueue();

    const channel = supabase.channel('queue-sync')
      .on('postgres_changes' as any, { event: '*', table: 'orders', schema: 'public' }, () => {
        fetchQueue();
      }).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    fetchQueue();
  };

  return (
    <div className="space-y-8 font-outfit">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Active Production Line</h1>
          <p className="text-slate-500 mt-1 font-medium italic">Priority: Emergency First ⚡ → FIFO Execution ⏱️</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-blue-50 border border-blue-100 px-6 py-2 rounded-2xl flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{queue.length} Jobs in Line</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading && queue.length === 0 ? (
          <div className="p-20 text-center animate-pulse text-slate-400 font-bold">Syncing production queue...</div>
        ) : queue.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border-2 border-dashed border-slate-100">
            <span className="text-4xl block mb-4">🖨️</span>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Production Line Clear</p>
          </div>
        ) : (
          queue.map((job, index) => (
            <div key={job.id} className={`group bg-white p-6 rounded-[2.5rem] border ${job.status === 'printing' ? 'border-blue-200 shadow-lg shadow-blue-50 ring-4 ring-blue-50' : 'border-slate-50 hover:border-slate-200'} transition-all flex items-center gap-8 relative overflow-hidden`}>
              {job.priority > 0 && (
                <div className="absolute top-0 left-0 h-full w-1.5 bg-amber-500" />
              )}

              <div className="w-16 h-16 rounded-3xl bg-slate-50 flex flex-col items-center justify-center border border-slate-100 flex-shrink-0">
                <span className="text-[10px] font-black text-slate-300 uppercase">Pos</span>
                <span className="text-2xl font-black text-slate-900 leading-none">#{index + 1}</span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-sm font-black text-slate-900 truncate">{job.order_number}</h3>
                  {job.priority > 0 && (
                    <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest flex items-center gap-1 animate-pulse">
                      ⚡ EMERGENCY
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-xs font-bold text-slate-400 truncate max-w-[200px]">
                    {job.order_items?.[0]?.file_name || 'Processing Doc...'}
                  </p>
                  <span className="text-[10px] text-slate-300">•</span>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
                    {job.order_items?.[0]?.file_pages} PAGES • {job.order_items?.[0]?.copies} COPIES
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex gap-2 border-r border-slate-100 pr-6">
                  {job.order_items?.[0]?.file_url && (
                    <>
                      <a
                        href={job.order_items[0].file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100/50"
                        title="View Document"
                      >
                        <Eye size={16} />
                      </a>
                      <a
                        href={job.order_items[0].file_url}
                        download
                        className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 transition-all border border-slate-100/50"
                        title="Download File"
                      >
                        <Download size={16} />
                      </a>
                    </>
                  )}
                </div>

                <div className="text-right min-w-[100px]">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                  <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${job.status === 'printing' ? 'bg-blue-600 text-white' : 'bg-amber-100 text-amber-600'
                    }`}>
                    {job.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex gap-2">
                  {job.status === 'shop_accepted' && (
                    <button
                      onClick={() => updateStatus(job.id, 'printing')}
                      className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all uppercase tracking-widest flex items-center gap-2"
                    >
                      <Printer size={14} />
                      Print File
                    </button>
                  )}
                  {job.status === 'printing' && (
                    <button
                      onClick={() => updateStatus(job.id, 'ready_for_pickup')}
                      className="px-6 py-3 bg-emerald-600 text-white text-[10px] font-black rounded-2xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all uppercase tracking-widest flex items-center gap-2"
                    >
                      <CheckCircle2 size={14} />
                      Finished Printing
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('Cancel this job?')) updateStatus(job.id, 'cancelled');
                    }}
                    className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-all border border-slate-100/50 shadow-sm"
                  >
                    <XCircle size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
