'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Search,
  CheckCircle2,
  Printer,
  Loader2,
  PackageCheck,
  FileText,
  Zap,
  Eye,
  Download,
  Bell,
  Clock,
  CheckCircle,
  ExternalLink,
  Banknote,
  Camera,
  XCircle,
  Calendar,
  Filter,
  Truck
} from 'lucide-react';
import QRScannerModal from '@/components/QRScannerModal';
import GSTInvoice from '@/components/GSTInvoice';

export default function StaffOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [racks, setRacks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLabel, setShowLabel] = useState<any>(null);

  const [verifyingOrder, setVerifyingOrder] = useState<string | null>(null);
  const [verificationInput, setVerificationInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [currentScanningOrder, setCurrentScanningOrder] = useState<string | null>(null);
  const [showInvoice, setShowInvoice] = useState<any>(null);
  const [shopData, setShopData] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [customDate, setCustomDate] = useState('');
  const [deliveryPartners, setDeliveryPartners] = useState<any[]>([]);

  const fetchOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: shop } = await supabase
        .from('print_shops')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (!shop) return;

      const { data: shopInfo, error: shopError } = await supabase
        .from('print_shops')
        .select('*')
        .eq('id', shop.id)
        .single();

      if (shopError || !shopInfo) throw shopError || new Error('Shop not found');

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id, user_id, shop_id, copies, priority, status, rack_id,
          payment_status, total_amount, payment_method, order_number,
          is_emergency, notes, delivery_fee, delivery_address,
          delivery_notes, delivery_status, created_at, updated_at,
          profiles!user_id(full_name, phone, avatar_url)
        `)
        .eq('shop_id', shopInfo.id)
        .order('created_at', { ascending: false });

      const { data: rackData } = await supabase
        .from('racks')
        .select('*')
        .eq('shop_id', shopInfo.id);

      if (error) throw error;
      setOrders(data || []);
      setRacks(rackData || []);
      setShopData(shopInfo);

      // Fetch delivery partners for dispatch
      const { data: dpData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'delivery_partner');
      setDeliveryPartners(dpData || []);

    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId: string, newStatus: string, extraData: any = {}) => {
    setUpdating(orderId);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, ...extraData })
        .eq('id', orderId);

      if (error) throw error;

      // Automated WhatsApp Notification
      const order = orders.find(o => o.id === orderId);
      if (newStatus === 'ready_for_pickup' && order?.profiles?.phone) {
        let msg = '';
        if (order.delivery_needed) {
          msg = `Hi ${order.profiles.full_name}! 🚚 Your NexPrint order #${order.order_number?.slice(-8)} is ready and being assigned to a delivery partner. It will reach ${order.delivery_address} soon! - NexPrint`;
        } else {
          const rName = extraData.rack_id ? racks.find(r => r.id === extraData.rack_id)?.name : 'Staging';
          msg = `Hi ${order.profiles.full_name}! 🎉 Your NexPrint order #${order.order_number?.slice(-8)} is READY for pickup at ${shopData?.name || 'our shop'}. Please collect it from Rack ${rName}. Total: ₹${order.total_amount}. Thank you!`;
        }
        window.open(`https://wa.me/${order.profiles.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
      }

      await fetchOrders();
    } catch (error: any) {
      console.error('Update error:', error);
      alert(`Terminal Error: ${error.message || 'Operation failed. Check DB enums.'}`);
    } finally {
      setUpdating(null);
    }
  };

  const collectCash = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ payment_status: 'paid' })
        .eq('id', orderId);
      if (error) throw error;
      fetchOrders();
    } catch (err: any) {
      alert(`Payment Update Failed: ${err.message}`);
    }
  };

  const autoAssignRack = async (order: any) => {
    setUpdating(order.id);
    try {
      const dept = order.profiles?.department || 'GENERAL';
      const year = order.profiles?.year || 'V';
      const rackCategory = `${dept} ${year}`.trim();
      const rackName = `${dept.slice(0, 3).toUpperCase()}-${year}`;

      // 1. Check if rack already exists
      let targetRack = racks.find(r => r.category === rackCategory);

      if (!targetRack) {
        // 2. Create it if missing
        const { data: newRack, error: createError } = await supabase
          .from('racks')
          .insert({
            shop_id: order.shop_id,
            name: rackName,
            category: rackCategory
          })
          .select()
          .single();

        if (createError) throw createError;
        targetRack = newRack;
        // Refresh racks locally
        setRacks([...racks, newRack]);
      }

      // 3. Update order with this rack
      await updateStatus(order.id, 'ready_for_pickup', { rack_id: targetRack.id });

    } catch (err: any) {
      alert(`Auto-Rack Failed: ${err.message}`);
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'orders'
      }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const handleGlobalScan = (data: string) => {
    setSearchQuery(data);
    setIsScanning(false);
  };

  const handleVerificationScan = (data: string, order: any) => {
    if (data === order.order_number) {
      updateStatus(order.id, 'completed');
      setVerifyingOrder(null);
      setVerificationInput('');
    } else {
      alert(`Verification Failed: Found code ${data} instead of expected identity.`);
    }
    setIsScanning(false);
    setCurrentScanningOrder(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-outfit pb-20">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 px-8 py-6 sticky top-0 z-50 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 leading-none">Job Queue</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
            Terminal ID: {orders[0]?.shop_id?.slice(0, 8) || 'NEX-MAIN'}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsScanning(true)}
            className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 group"
            title="Scan Job QR"
          >
            <Camera size={18} className="group-hover:rotate-12 transition-transform" />
          </button>
          <div className="bg-slate-50/50 rounded-2xl border border-slate-100 px-4 h-12 hidden md:flex items-center gap-3">
            <Search size={18} className="text-slate-300" />
            <input
              placeholder="GLOBAL SEARCH..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[10px] font-black uppercase tracking-widest text-slate-700 w-48 placeholder:text-slate-300"
            />
          </div>
        </div>
      </header>
      <div className="bg-white border-b border-slate-100 px-8 py-3 flex items-center gap-4 overflow-x-auto no-scrollbar">
        <div className="flex items-center gap-2 pr-4 border-r border-slate-100">
          <Calendar size={14} className="text-slate-400" />
          {['today', 'yesterday', 'all'].map(d => (
            <button
              key={d}
              onClick={() => { setDateFilter(d); setCustomDate(''); }}
              className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${dateFilter === d ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              {d}
            </button>
          ))}
          <input
            type="date"
            value={customDate}
            onChange={(e) => {
              setCustomDate(e.target.value);
              setDateFilter('custom');
            }}
            className="bg-slate-50 border border-slate-100 rounded-xl px-3 py-1 text-[9px] font-black uppercase text-slate-600 outline-none focus:border-blue-200 transition-all ml-2 cursor-pointer"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          {['all', 'pending', 'shop_accepted', 'printing', 'ready_for_pickup', 'completed'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${statusFilter === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
            >
              {s === 'shop_accepted' ? 'confirmed' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {showLabel && (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-[2rem] p-10 max-w-sm w-full shadow-2xl space-y-8 border-4 border-slate-900">
            <div className="text-center space-y-2">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest italic">NexPrint Terminal Identity</h2>
              <p className="text-2xl font-black text-slate-900 tracking-tighter italic whitespace-nowrap overflow-hidden">#{showLabel.order_number}</p>
            </div>

            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
              <div className="flex justify-between items-baseline">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Customer</p>
                <p className="font-black text-slate-900 text-lg uppercase tracking-tight">{showLabel.profiles?.full_name}</p>
              </div>
              <div className="flex justify-between items-baseline">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Collection Price</p>
                <p className="font-black text-emerald-600 text-lg uppercase tracking-tight italic">₹{showLabel.total_amount}</p>
              </div>
              <div className="flex justify-between items-baseline">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Contact</p>
                <p className="font-black text-slate-900 text-xs italic">{showLabel.profiles?.phone || 'N/A'}</p>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Identity Tag / Rack ID</p>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center text-xl font-black shadow-lg shadow-blue-200 shrink-0">
                    {racks.find(r => r.id === showLabel.rack_id)?.name.slice(-2) || 'ST'}
                  </div>
                  <p className="font-black text-blue-600 text-3xl italic tracking-tighter uppercase shrink-0">{racks.find(r => r.id === showLabel.rack_id)?.name || 'STAGING'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  window.print();
                }}
                className="w-full py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <Printer size={16} />
                Print Physical Tag
              </button>
              <button
                onClick={() => setShowLabel(null)}
                className="w-full py-5 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:text-slate-900 transition-all italic"
              >
                Dismiss Identity
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-8 pt-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders
            .filter(o => {
              // 1. Search Query
              const matchesSearch = !searchQuery ||
                o.order_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (o.profiles?.full_name && o.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()));

              if (!matchesSearch) return false;

              // 2. Status Filter
              const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
              if (!matchesStatus) return false;

              // 3. Date Filter
              if (dateFilter !== 'all') {
                const orderDateObj = new Date(o.created_at);
                const orderDateString = orderDateObj.toISOString().split('T')[0];

                let targetDateString = '';
                if (dateFilter === 'today') {
                  targetDateString = new Date().toISOString().split('T')[0];
                } else if (dateFilter === 'yesterday') {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  targetDateString = yesterday.toISOString().split('T')[0];
                } else if (dateFilter === 'custom' && customDate) {
                  targetDateString = customDate;
                }

                if (targetDateString && orderDateString !== targetDateString) return false;
              }

              return true;
            })
            .map((order) => (
              <div key={order.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-500/5 transition-all group relative overflow-hidden">
                {order.is_emergency && (
                  <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
                )}

                {order.is_emergency && (
                  <div className="absolute top-6 right-6 px-3 py-1 bg-amber-500/10 text-amber-600 rounded-lg text-[8px] font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-1.5">
                    <Zap size={10} className="fill-amber-500" />
                    Priority
                  </div>
                )}

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-lg shadow-inner ring-4 ring-blue-50">
                    {order.profiles?.full_name?.charAt(0) || 'U'}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 text-base leading-none mb-1 truncate">{order.profiles?.full_name || 'Guest'}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">#{order.order_number?.slice(-8)}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Job Contents</span>
                    <span className="text-[9px] font-black text-blue-500 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 italic">
                      {order.order_items?.length || 0} Files
                    </span>
                  </div>

                  <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-2.5">
                    {(order.order_items || []).map((item: any) => (
                      <div key={item.id} className="p-3 bg-white border border-slate-100 rounded-xl space-y-2">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-slate-900 truncate">{item.file_name}</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${item.print_type === 'color' ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-500'}`}>
                                {item.print_type}
                              </span>
                              <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md text-[8px] font-black uppercase tracking-widest">
                                {item.copies} Copies
                              </span>
                              <span className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md text-[8px] font-black uppercase tracking-widest">
                                {item.total_pages} Pgs
                              </span>
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[8px] font-black uppercase tracking-widest">
                                ₹{item.price || 0}
                              </span>
                            </div>
                            {(item.binding && item.binding !== 'none' || (item.custom_services && item.custom_services.length > 0)) && (
                              <div className="flex flex-wrap gap-1 mt-1.5 pt-1.5 border-t border-slate-50">
                                {item.binding && item.binding !== 'none' && (
                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-md text-[7px] font-black uppercase tracking-widest border border-amber-500/10">
                                    {item.binding} Bind
                                  </span>
                                )}
                                {item.custom_services?.map((sId: string) => {
                                  const sName = shopData?.settings?.pricing?.custom_items?.find((i: any) => i.id === sId)?.name || 'Add-on';
                                  return (
                                    <span key={sId} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[7px] font-black uppercase tracking-widest border border-indigo-500/10">
                                      {sName}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1">
                            {item.file_url && (
                              <>
                                <a
                                  href={item.file_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors rounded-lg"
                                  title="Preview"
                                >
                                  <Eye size={12} />
                                </a>
                                <a
                                  href={item.file_url}
                                  download
                                  className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors rounded-lg"
                                  title="Download"
                                >
                                  <Download size={12} />
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Current Phase</span>
                    <span className={`px-2 py-1 rounded-lg ${order.status === 'completed' ? 'bg-emerald-50 text-emerald-600' :
                      ['printing', 'shop_accepted', 'ready_for_pickup'].includes(order.status) ? 'bg-blue-50 text-blue-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                      {order.status?.replace(/_/g, ' ') || 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Payment Status</span>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${order.payment_status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      <span className={order.payment_status === 'paid' ? 'text-emerald-500' : 'text-amber-500'}>
                        {order.payment_status?.toUpperCase() || 'UNPAID'}
                      </span>
                      {order.payment_status !== 'paid' && (
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => alert(`In-App Reminder sent to ${order.profiles?.full_name}`)}
                            className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-all"
                            title="App Reminder"
                          >
                            <Bell size={10} />
                          </button>
                          {order.profiles?.phone && (
                            <a
                              href={`https://wa.me/${order.profiles.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hello ${order.profiles.full_name}, this is a reminder regarding your NexPrint order #${order.order_number?.slice(-8)}. Total amount: ₹${order.total_amount}. Status: ${order.status}. Please complete payment to avoid delays.`)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all"
                              title="WhatsApp Reminder"
                            >
                              <svg className="w-[10px] h-[10px]" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                              </svg>
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">Identity Details</span>
                    <span className="text-slate-900 italic">{order.profiles?.department || 'Visitor'} / '{order.profiles?.year || 'N/A'}</span>
                  </div>
                  {order.rack_id && (
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                      <span className="text-slate-400 italic">Rack Staging</span>
                      <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100 font-bold italic">
                        {racks.find(r => r.id === order.rack_id)?.name || 'Staging Area'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {order.payment_status !== 'paid' && ['cash_pickup', 'cash_delivery'].includes(order.payment_method) && (
                    <button
                      onClick={() => collectCash(order.id)}
                      className="col-span-2 py-4 bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/10 hover:bg-emerald-600"
                    >
                      <Banknote size={16} />
                      Collect Cash - ₹{order.total_amount}
                    </button>
                  )}

                  {['pending', 'placed'].includes(order.status?.toLowerCase()) && (
                    <div className="col-span-2 grid grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          if (confirm('Decline this job? Use will be notified.')) {
                            updateStatus(order.id, 'cancelled');
                          }
                        }}
                        disabled={updating === order.id}
                        className="py-4 bg-red-50 text-red-500 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 border border-red-100 disabled:opacity-50"
                      >
                        <XCircle size={14} />
                        Decline
                      </button>
                      <button
                        onClick={() => updateStatus(order.id, 'shop_accepted')}
                        disabled={updating === order.id}
                        className="py-4 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10 hover:bg-slate-800 disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} className="text-emerald-400 shadow-sm" />
                        Confirm Hub Job
                      </button>
                    </div>
                  )}
                  {order.status === 'shop_accepted' && (
                    <button
                      onClick={() => updateStatus(order.id, 'printing')}
                      disabled={updating === order.id}
                      className="col-span-2 py-4 bg-blue-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Printer size={16} />
                      Deploy to Console
                    </button>
                  )}
                  {order.status === 'printing' && (
                    <div className="col-span-2">
                      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-[2rem] text-center space-y-2">
                        <div className="flex justify-center">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <Printer size={14} className="text-blue-600 animate-pulse" />
                          </div>
                        </div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest italic">Production in Progress...</p>
                        <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                          Files are being processed in the console.<br />
                          Mark as finished in production queue to generate tag.
                        </p>
                      </div>
                    </div>
                  )}

                  {order.status === 'ready_for_pickup' && (
                    <>
                      {verifyingOrder === order.id ? (
                        <div className="col-span-2 space-y-3 pt-2">
                          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 space-y-2">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center">Identity Code Verification</p>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="4-DIGIT PIN..."
                                value={verificationInput}
                                onChange={(e) => setVerificationInput(e.target.value.toUpperCase())}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black text-white text-center outline-none focus:border-blue-500 placeholder:text-slate-700"
                              />
                              <button
                                onClick={() => {
                                  setIsScanning(true);
                                  setCurrentScanningOrder(order.id);
                                }}
                                className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all"
                              >
                                <Camera size={14} />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <button
                                onClick={() => setVerifyingOrder(null)}
                                className="py-2 text-[8px] font-black text-slate-500 uppercase"
                              >Cancel</button>
                              <button
                                onClick={() => {
                                  if (verificationInput === order.order_number.slice(-4)) {
                                    updateStatus(order.id, 'completed');
                                    setVerifyingOrder(null);
                                    setVerificationInput('');
                                  } else {
                                    alert('Mismatched Identity Code! Ask user to refresh app.');
                                  }
                                }}
                                className="py-2 bg-blue-600 text-white rounded-lg text-[8px] font-black uppercase"
                              >Manual Verify</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="col-span-2 space-y-3">
                          {!order.rack_id ? (
                            <>
                              <button
                                onClick={() => setShowLabel(order)}
                                className="w-full py-4 bg-slate-900 text-white rounded-[2rem] text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 hover:bg-slate-800"
                              >
                                <Printer size={16} />
                                Generate Physical Tag
                              </button>

                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => autoAssignRack(order)}
                                  disabled={updating === order.id}
                                  className="py-4 bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-emerald-600 shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                                >
                                  <Zap size={14} />
                                  Auto Rack
                                </button>
                                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center shadow-inner">
                                  <select
                                    onChange={(e) => updateStatus(order.id, 'ready_for_pickup', { rack_id: e.target.value })}
                                    className="w-full bg-transparent text-[8px] font-black uppercase tracking-widest outline-none border-none text-slate-600"
                                  >
                                    <option value="">MANUAL RACK...</option>
                                    {racks.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                  </select>
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                onClick={() => setShowLabel(order)}
                                className="py-4 border border-blue-100 text-blue-600 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 hover:bg-blue-50"
                              >
                                <Printer size={16} />
                                Reprint Tag
                              </button>
                              <button
                                onClick={() => setVerifyingOrder(order.id)}
                                disabled={updating === order.id || order.payment_status !== 'paid'}
                                className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-xl hover:bg-blue-600 disabled:opacity-50 ${order.payment_status === 'paid' ? 'bg-blue-500 text-white shadow-blue-500/20' : 'bg-slate-100 text-slate-400 border border-slate-200 shadow-none'}`}
                              >
                                <PackageCheck size={16} />
                                Handover Job
                              </button>

                              {/* WhatsApp ready notification */}
                              {order.profiles?.phone && (
                                <a
                                  href={`https://wa.me/${order.profiles.phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi ${order.profiles.full_name}! 🎉 Your NexPrint order #${order.order_number?.slice(-8)} is READY for pickup at ${shopData?.name || 'our shop'}. Please collect it from Rack ${racks.find(r => r.id === order.rack_id)?.name || 'Staging'}. Amount due: ₹${order.total_amount}. Thank you!`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="py-4 bg-emerald-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                  WhatsApp Ready
                                </a>
                              )}

                              {/* GST Invoice */}
                              <button
                                onClick={() => setShowInvoice(order)}
                                className="py-4 bg-slate-50 border border-slate-100 text-slate-600 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white hover:border-blue-200 hover:text-blue-600 transition-all active:scale-95"
                              >
                                <FileText size={14} />
                                GST Invoice
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {order.delivery_needed && order.status === 'ready_for_pickup' && (
                        <div className="col-span-2 p-4 bg-amber-50 rounded-3xl border border-amber-100 space-y-3 mt-4">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-2 italic">
                              <Truck size={14} className="animate-bounce" />
                              Logistics Dispatch Queue
                            </p>
                            <span className="text-[8px] font-bold bg-amber-200/50 text-amber-700 px-2 py-0.5 rounded-md uppercase tracking-widest">Awaiting Partner</span>
                          </div>

                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                if (confirm(`Handover job to ${deliveryPartners.find(p => p.id === e.target.value)?.full_name}?`)) {
                                  updateStatus(order.id, 'out_for_delivery', {
                                    delivery_partner_id: e.target.value,
                                    delivery_status: 'assigned',
                                    updated_at: new Date().toISOString()
                                  });
                                }
                              }
                            }}
                            className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-[9px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-amber-500/20 text-slate-700 h-10"
                          >
                            <option value="">SELECT DISPATCH PARTNER...</option>
                            {deliveryPartners.map(p => (
                              <option key={p.id} value={p.id}>{p.full_name} ({p.phone || 'No Phone'})</option>
                            ))}
                          </select>
                        </div>
                      )}

                      {order.status === 'out_for_delivery' && (
                        <div className="col-span-2 p-4 bg-blue-50 rounded-3xl border border-blue-100 space-y-3 mt-4">
                          <div className="flex items-center justify-between font-black uppercase text-[10px]">
                            <span className="text-blue-600 flex items-center gap-2 italic">
                              <Truck size={14} />
                              Fleet Dispatch Active
                            </span>
                            <span className="text-slate-400">#{order.delivery_status || 'Assigned'}</span>
                          </div>
                          <div className="p-3 bg-white rounded-xl border border-blue-50 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-100">
                              {deliveryPartners.find(p => p.id === order.delivery_partner_id)?.full_name?.charAt(0) || 'D'}
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-900 tracking-tight">{deliveryPartners.find(p => p.id === order.delivery_partner_id)?.full_name || 'Fleet Partner'}</p>
                              <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest">{deliveryPartners.find(p => p.id === order.delivery_partner_id)?.phone || 'No Contact'}</p>
                            </div>
                            <button
                              onClick={() => updateStatus(order.id, 'completed', { delivery_status: 'delivered' })}
                              className="ml-auto p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all"
                              title="Force Mark Delivered"
                            >
                              <CheckCircle size={14} />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                </div>
              </div>
            ))}

          {orders.length === 0 && (
            <div className="col-span-full py-32 text-center bg-white rounded-[3rem] border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                <Printer size={32} />
              </div>
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Active Jobs</h3>
              <p className="text-[10px] text-slate-300 mt-1 uppercase tracking-widest">Orders from the user app will appear here instantly</p>
            </div>
          )}
        </div>
      </main>

      <QRScannerModal
        isOpen={isScanning}
        onClose={() => {
          setIsScanning(false);
          setCurrentScanningOrder(null);
        }}
        onScan={(data) => {
          if (currentScanningOrder) {
            const target = orders.find(o => o.id === currentScanningOrder);
            handleVerificationScan(data, target);
          } else {
            handleGlobalScan(data);
          }
        }}
        title={currentScanningOrder ? "Verify Identity Scan" : "Job Quick Finder"}
      />

      {showInvoice && (
        <GSTInvoice
          order={showInvoice}
          shop={shopData}
          racks={racks}
          onClose={() => setShowInvoice(null)}
        />
      )}
    </div>
  );
}
