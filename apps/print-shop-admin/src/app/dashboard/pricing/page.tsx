'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  Zap,
  Save,
  Plus,
  Trash2,
  Settings2,
  ShieldCheck,
  Info,
  DollarSign,
  FileText,
  BadgePercent
} from 'lucide-react';

export default function PricingHubPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shop, setShop] = useState<any>(null);
  const [pricing, setPricing] = useState<any>({
    bw: 2,
    color: 10,
    a4: 0,
    a3: 10,
    photo_paper: 25,
    letter: 2,
    legal: 5,
    spiral_binding: 40,
    hard_binding: 150,
    gst_percent: 18,
    emergency_fee: 20,
    delivery_fee: 20,
    premium_paper: 2,
    custom_items: [] // { id, name, price }
  });

  useEffect(() => {
    const fetchPricing = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: shopData } = await supabase
        .from('print_shops')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (shopData) {
        setShop(shopData);
        if (shopData.settings?.pricing) {
          setPricing({ ...pricing, ...shopData.settings.pricing });
        }
      }
      setLoading(false);
    };
    fetchPricing();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('print_shops')
        .update({
          status: shop.status,
          bw_price_per_page: pricing.bw,
          color_price_per_page: pricing.color,
          emergency_surcharge: pricing.emergency_fee,
          delivery_available: true, // Auto-enable if fee is set/updated
          binding_price: pricing.spiral_binding,
          photo_sheet_price: pricing.photo_paper,
          settings: {
            ...shop?.settings,
            pricing
          }
        })
        .eq('id', shop.id);

      if (error) throw error;
      alert('Pricing Engine Updated!');
    } catch (err: any) {
      alert(`Update Failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const addCustomItem = () => {
    const name = prompt('Enter service name (e.g., Lamination):');
    const price = prompt('Enter price (₹):');
    if (name && price) {
      setPricing({
        ...pricing,
        custom_items: [
          ...(pricing.custom_items || []),
          { id: Date.now().toString(), name, price: Number(price) }
        ]
      });
    }
  };

  const removeCustomItem = (id: string) => {
    setPricing({
      ...pricing,
      custom_items: pricing.custom_items.filter((item: any) => item.id !== id)
    });
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-10 font-outfit pb-20 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white/50 backdrop-blur-xl p-8 rounded-[2.5rem] border border-slate-50 shadow-sm sticky top-0 z-40">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Pricing Hub OS</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-3">Dynamic Revenue & GST Configuration</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 p-1 rounded-2xl mr-4">
            {[
              { id: 'open', label: 'Live', color: 'bg-emerald-500', text: 'text-emerald-600' },
              { id: 'busy', label: 'Busy', color: 'bg-amber-500', text: 'text-amber-600' },
              { id: 'closed', label: 'Off', color: 'bg-red-500', text: 'text-red-600' }
            ].map(s => (
              <button
                key={s.id}
                onClick={() => shop && setShop({ ...shop, status: s.id })}
                className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${shop?.status === s.id ? 'bg-white shadow-sm ' + s.text : 'text-slate-400 opacity-50'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${s.color} ${shop?.status === s.id ? 'animate-pulse' : ''}`} />
                {s.label}
              </button>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-4 bg-blue-600 text-white rounded-2xl flex items-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 disabled:opacity-50"
          >
            {saving ? <Plus className="animate-spin" size={18} /> : <Save size={18} />}
            <span className="text-[10px] font-black uppercase tracking-widest">Deploy Changes</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Print Pricing Card */}
        <div className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><FileText size={20} /></div>
            <div>
              <h3 className="text-xl font-black text-slate-900 leading-none">Print Engine</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Per page unit economics</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Black & White (B/W)</label>
              <div className="flex items-center bg-slate-50 rounded-2xl p-4 border border-slate-100 focus-within:border-blue-200 transition-all">
                <span className="text-lg font-black text-slate-300 mr-4">₹</span>
                <input
                  type="number"
                  value={pricing.bw}
                  onChange={(e) => setPricing({ ...pricing, bw: Number(e.target.value) })}
                  className="bg-transparent border-none outline-none text-xl font-black text-slate-900 w-full"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Color (CMYK)</label>
              <div className="flex items-center bg-slate-50 rounded-2xl p-4 border border-slate-100 focus-within:border-blue-200 transition-all">
                <span className="text-lg font-black text-slate-300 mr-4">₹</span>
                <input
                  type="number"
                  value={pricing.color}
                  onChange={(e) => setPricing({ ...pricing, color: Number(e.target.value) })}
                  className="bg-transparent border-none outline-none text-xl font-black text-slate-900 w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Binding & Services Card */}
        <div className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-sm space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Zap size={20} /></div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-none">Value Add-ons</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Bindings & Custom Services</p>
              </div>
            </div>
            <button
              onClick={addCustomItem}
              className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center hover:bg-slate-800 transition-all shadow-lg active:scale-95"
              title="Add Custom Price"
            >
              <Plus size={18} />
            </button>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Spiral Binding</label>
                <div className="flex items-center bg-slate-50 rounded-2xl p-4 border border-slate-100 focus-within:border-blue-200 transition-all">
                  <span className="text-xs font-black text-slate-300 mr-2">₹</span>
                  <input
                    type="number"
                    value={pricing.spiral_binding}
                    onChange={(e) => setPricing({ ...pricing, spiral_binding: Number(e.target.value) })}
                    className="bg-transparent border-none outline-none text-base font-black text-slate-900 w-full"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hard Binding</label>
                <div className="flex items-center bg-slate-50 rounded-2xl p-4 border border-slate-100 focus-within:border-blue-200 transition-all">
                  <span className="text-xs font-black text-slate-300 mr-2">₹</span>
                  <input
                    type="number"
                    value={pricing.hard_binding}
                    onChange={(e) => setPricing({ ...pricing, hard_binding: Number(e.target.value) })}
                    className="bg-transparent border-none outline-none text-base font-black text-slate-900 w-full"
                  />
                </div>
              </div>
            </div>

            {/* Custom Items */}
            {pricing.custom_items?.map((item: any) => (
              <div key={item.id} className="flex flex-col gap-2 group">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{item.name}</label>
                  <button onClick={() => removeCustomItem(item.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                </div>
                <div className="flex items-center bg-slate-50 rounded-2xl p-4 border border-slate-100 focus-within:border-emerald-200 transition-all">
                  <span className="text-xs font-black text-slate-300 mr-2">₹</span>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) => {
                      const newItems = pricing.custom_items.map((i: any) => i.id === item.id ? { ...i, price: Number(e.target.value) } : i);
                      setPricing({ ...pricing, custom_items: newItems });
                    }}
                    className="bg-transparent border-none outline-none text-base font-black text-slate-900 w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Paper Sizes Card */}
        <div className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-sm space-y-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Settings2 size={20} /></div>
            <div>
              <h3 className="text-xl font-black text-slate-900 leading-none">Paper Architect</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Surcharge per paper size</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">A3 Surcharge</label>
              <div className="flex items-center bg-slate-50 rounded-2xl p-4 border border-slate-100 focus-within:border-amber-200 transition-all">
                <span className="text-xs font-black text-slate-300 mr-2">+₹</span>
                <input
                  type="number"
                  value={pricing.a3}
                  onChange={(e) => setPricing({ ...pricing, a3: Number(e.target.value) })}
                  className="bg-transparent border-none outline-none text-base font-black text-slate-900 w-full"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Photo Sheet</label>
              <div className="flex items-center bg-slate-50 rounded-2xl p-4 border border-slate-100 focus-within:border-amber-200 transition-all">
                <span className="text-xs font-black text-slate-300 mr-2">+₹</span>
                <input
                  type="number"
                  value={pricing.photo_paper}
                  onChange={(e) => setPricing({ ...pricing, photo_paper: Number(e.target.value) })}
                  className="bg-transparent border-none outline-none text-base font-black text-slate-900 w-full"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Letter / Legal</label>
              <div className="flex items-center bg-slate-50 rounded-2xl p-4 border border-slate-100 focus-within:border-amber-200 transition-all">
                <span className="text-xs font-black text-slate-300 mr-2">+₹</span>
                <input
                  type="number"
                  value={pricing.legal}
                  onChange={(e) => setPricing({ ...pricing, legal: Number(e.target.value) })}
                  className="bg-transparent border-none outline-none text-base font-black text-slate-900 w-full"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Premium Paper (100 GSM)</label>
              <div className="flex items-center bg-slate-50 rounded-2xl p-4 border border-slate-100 focus-within:border-amber-200 transition-all">
                <span className="text-xs font-black text-slate-300 mr-2">+₹</span>
                <input
                  type="number"
                  value={pricing.premium_paper}
                  onChange={(e) => setPricing({ ...pricing, premium_paper: Number(e.target.value) })}
                  className="bg-transparent border-none outline-none text-base font-black text-slate-900 w-full"
                />
              </div>
            </div>

            <div className="bg-amber-50 rounded-2xl p-4 flex flex-col justify-center">
              <p className="text-[8px] font-black text-amber-600 uppercase tracking-widest leading-relaxed">
                * Surcharges are added to base print price per page. Premium paper applies to all selected pages.
              </p>
            </div>
          </div>
        </div>

        {/* Taxation & Urgency Card */}
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 opacity-10 rounded-full blur-[100px] -mr-32 -mt-32" />

          <div className="flex items-center gap-4 relative z-10">
            <div className="p-3 bg-white/5 text-blue-400 rounded-2xl border border-white/10"><BadgePercent size={20} /></div>
            <div>
              <h3 className="text-xl font-black text-white leading-none">Taxation & Surcharges</h3>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">GST and Priority Fees</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">GST Rate</label>
              <div className="flex items-center bg-white/5 rounded-2xl p-4 border border-white/10 focus-within:border-blue-500 transition-all">
                <input
                  type="number"
                  value={pricing.gst_percent}
                  onChange={(e) => setPricing({ ...pricing, gst_percent: Number(e.target.value) })}
                  className="bg-transparent border-none outline-none text-xl font-black text-white w-full"
                />
                <span className="text-lg font-black text-slate-600 ml-4">%</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">SOS Fee (Priority)</label>
              <div className="flex items-center bg-white/5 rounded-2xl p-4 border border-white/10 focus-within:border-blue-500 transition-all">
                <span className="text-lg font-black text-slate-600 mr-4">₹</span>
                <input
                  type="number"
                  value={pricing.emergency_fee}
                  onChange={(e) => setPricing({ ...pricing, emergency_fee: Number(e.target.value) })}
                  className="bg-transparent border-none outline-none text-xl font-black text-white w-full"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Delivery Charge</label>
              <div className="flex items-center bg-white/5 rounded-2xl p-4 border border-white/10 focus-within:border-emerald-500 transition-all">
                <span className="text-lg font-black text-slate-600 mr-4">₹</span>
                <input
                  type="number"
                  value={pricing.delivery_fee}
                  onChange={(e) => setPricing({ ...pricing, delivery_fee: Number(e.target.value) })}
                  className="bg-transparent border-none outline-none text-xl font-black text-white w-full"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Global Control Card */}
        <div className="bg-blue-600 rounded-[3rem] p-10 text-white shadow-2xl space-y-8 relative overflow-hidden flex flex-col justify-center">
          <div className="absolute inset-0 bg-blue-700 opacity-50 transform skew-y-12 translate-y-24" />
          <div className="relative z-10 font-black italic text-4xl leading-tight">
            DYNAMIC <br /> PRICING <br /> ENGINE
          </div>
          <p className="relative z-10 text-sm font-medium text-blue-100 mt-4 leading-relaxed opacity-60">
            Authorized hub managers can calibrate unit costs across the entire terminal network. All changes take effect globally for existing and future jobs.
          </p>
          <div className="mt-8 relative z-10 flex items-center gap-3 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10">
            <ShieldCheck size={20} className="text-emerald-300" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Validated for Hub Terminal v2.0.4</span>
          </div>
        </div>
      </div>
    </div>
  );
}
