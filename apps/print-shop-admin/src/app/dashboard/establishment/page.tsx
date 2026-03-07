'use client';

import { useEffect, useState } from 'react';
import { MapPin, Phone, Mail, Globe, Instagram, Facebook, Linkedin, Save, RefreshCw, ChevronLeft, Search, Navigation, Map as MapIcon, X, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ShopProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shop, setShop] = useState<any>({
    name: '',
    owner_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    area: '',
    city: '',
    district: '',
    state: '',
    country: 'India',
    pincode: '',
    instagram: '',
    facebook: '',
    linkedin: '',
    website: '',
    latitude: null,
    longitude: null
  });
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [addressSearch, setAddressSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [noShop, setNoShop] = useState(false);

  useEffect(() => {
    const fetchShop = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: shopData, error } = await supabase
        .from('print_shops')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (error && error.code === 'PGRST116') {
        setNoShop(true);
        setShop((prev: any) => ({
          ...prev,
          owner_name: user.user_metadata?.full_name || '',
          email: user.email || ''
        }));
      } else if (shopData) {
        setShop(shopData);
        setNoShop(false);
      } else if (error) {
        console.error("Error fetching shop profile:", error);
        setMessage({ type: 'error', text: error.message });
      }
      setLoading(false);
    };

    fetchShop();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (typeof window === 'undefined' || loading) return;

    // Load Leaflet CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);

    // Load Leaflet JS
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => {
      const L = (window as any).L;
      if (!L) return;

      const initialLat = shop.latitude || 20.5937;
      const initialLng = shop.longitude || 78.9629;

      const mapContainer = document.getElementById('map-selector');
      if (!mapContainer || (mapContainer as any)._leaflet_id) return;

      const mapInstance = L.map('map-selector').setView([initialLat, initialLng], shop.latitude ? 15 : 5);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(mapInstance);

      const markerInstance = L.marker([initialLat, initialLng], { draggable: true }).addTo(mapInstance);

      markerInstance.on('dragend', (e: any) => {
        const pos = e.target.getLatLng();
        setShop((prev: any) => ({ ...prev, latitude: pos.lat, longitude: pos.lng }));
      });

      mapInstance.on('click', (e: any) => {
        const pos = e.latlng;
        markerInstance.setLatLng(pos);
        setShop((prev: any) => ({ ...prev, latitude: pos.lat, longitude: pos.lng }));
      });

      setMap(mapInstance);
      setMarker(markerInstance);
    };
    document.head.appendChild(script);

    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [loading]);

  // Sync Map view when coordinates change from other sources (Search or GPS)
  useEffect(() => {
    if (map && marker && shop.latitude && shop.longitude) {
      marker.setLatLng([shop.latitude, shop.longitude]);
      map.setView([shop.latitude, shop.longitude], 15);
    }
  }, [shop.latitude, shop.longitude, map, marker]);

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const isNew = noShop;
      const shopPayload: any = {
        name: shop.name || '',
        owner_name: shop.owner_name || '',
        email: shop.email || '',
        phone: shop.phone || '',
        whatsapp: shop.whatsapp || '',
        address: shop.address || '',
        area: shop.area || '',
        city: shop.city || '',
        district: shop.district || '',
        state: shop.state || '',
        country: shop.country || 'India',
        pincode: shop.pincode || '',
        instagram: shop.instagram || '',
        facebook: shop.facebook || '',
        linkedin: shop.linkedin || '',
        website: shop.website || '',
        image_url: shop.image_url || '',
        latitude: shop.latitude || null,
        longitude: shop.longitude || null,
        owner_id: user.id
      };

      let res;
      if (isNew) {
        res = await supabase
          .from('print_shops')
          .insert(shopPayload)
          .select()
          .single();
      } else {
        res = await supabase
          .from('print_shops')
          .update(shopPayload)
          .eq('owner_id', user.id)
          .select()
          .single();
      }

      if (res.error) throw res.error;

      setShop(res.data);
      setNoShop(false);
      setMessage({ type: 'success', text: isNew ? 'Shop created successfully!' : 'Shop profile updated!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      console.error("Save Error:", err);
      setMessage({ type: 'error', text: err.name === 'AbortError' ? 'Request timed out. Please try again.' : err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSearchAddress = async () => {
    if (!addressSearch.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressSearch)}&addressdetails=1&limit=5`);
      const data = await res.json();
      setSearchResults(data);
      if (data.length === 0) {
        setMessage({ type: 'error', text: 'No places found. Try a different search.' });
      }
    } catch (err) {
      console.error("Search Error:", err);
    } finally {
      setSearching(false);
    }
  };

  const selectPlace = (place: any) => {
    const addr = place.address;
    setShop((prev: any) => ({
      ...prev,
      latitude: parseFloat(place.lat),
      longitude: parseFloat(place.lon),
      address: place.display_name,
      city: addr.city || addr.town || addr.village || '',
      state: addr.state || '',
      pincode: addr.postcode || '',
      area: addr.suburb || addr.neighbourhood || ''
    }));
    setSearchResults([]);
    setAddressSearch('');
    setMessage({ type: 'success', text: 'Place selected and coordinates set!' });
  };

  if (loading) return <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Initializing Portal...</div>;

  return (
    <div className="font-outfit max-w-5xl pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Establishment Profile</h1>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Manage your shop visibility and mapping data</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => window.location.reload()}
            className="p-3 bg-white border border-slate-100 rounded-2xl text-slate-400 hover:text-blue-600 transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => {
              if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition((pos) => {
                  setShop((prev: any) => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude }));
                  setMessage({ type: 'success', text: 'GPS Pin Captured!' });
                }, (err) => {
                  setMessage({ type: 'error', text: 'GPS Access Denied.' });
                }, { enableHighAccuracy: true });
              }
            }}
            className="px-5 py-3 bg-amber-50 border border-amber-200 rounded-2xl text-amber-600 hover:bg-amber-100 transition-all shadow-sm flex items-center gap-2"
          >
            <Navigation size={14} className="animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest">Live GPS</span>
          </button>
          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="px-8 py-3 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 active:scale-95 disabled:opacity-50 uppercase tracking-widest text-[11px]"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
            Sync Profile
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-8 p-5 rounded-3xl border animate-in slide-in-from-top duration-300 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-red-50 border-red-100 text-red-600'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-base">{message.type === 'success' ? '✅' : '🚨'}</span>
              <p className="text-[10px] font-black uppercase tracking-wider">{message.text}</p>
            </div>
            <button onClick={() => setMessage(null)} className="opacity-40 hover:opacity-100"><X size={14} /></button>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          {/* IDENTITY CARD */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-700" />

            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-3 relative">
              <span className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shadow-sm">🏪</span>
              Shop Identity
            </h2>

            <div className="space-y-5 relative">
              <div className="flex items-center gap-6 p-5 bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                <div className="w-20 h-20 bg-white rounded-2xl border border-slate-100 flex items-center justify-center text-3xl shadow-sm overflow-hidden">
                  {shop.image_url ? <img src={shop.image_url} className="w-full h-full object-cover" /> : '🏢'}
                </div>
                <div className="flex-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Change Branding</p>
                  <input type="file" accept="image/*" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setSaving(true);
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('upload_preset', 'cm_xerox');
                    try {
                      const res = await fetch(`https://api.cloudinary.com/v1_1/dznjnvmb7/image/upload`, { method: 'POST', body: formData });
                      const data = await res.json();
                      setShop({ ...shop, image_url: data.secure_url });
                    } catch (err) { console.error(err); } finally { setSaving(false); }
                  }} className="text-[9px] text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-[9px] file:font-black file:bg-slate-900 file:text-white cursor-pointer" />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Public Shop Name</label>
                <input
                  value={shop.name || ''}
                  onChange={(e) => setShop({ ...shop, name: e.target.value })}
                  placeholder="e.g. NexPrint Hub"
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-slate-800 focus:border-blue-500 outline-none transition-all placeholder:text-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Phone Line</label>
                  <input
                    value={shop.phone || ''}
                    onChange={(e) => setShop({ ...shop, phone: e.target.value })}
                    placeholder="+91..."
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">WhatsApp No</label>
                  <input
                    value={shop.whatsapp || ''}
                    onChange={(e) => setShop({ ...shop, whatsapp: e.target.value })}
                    placeholder="WhatsApp"
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* MAPPING CARD */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <span className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shadow-sm">📍</span>
              Precise Location Engine
            </h2>

            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    value={addressSearch}
                    onChange={(e) => setAddressSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchAddress())}
                    placeholder="Search place to auto-fill..."
                    className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-slate-800 focus:border-amber-500 outline-none transition-all placeholder:text-slate-300"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                </div>
                <button
                  type="button"
                  onClick={handleSearchAddress}
                  className="px-6 py-3.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 active:scale-95 transition-all shadow-lg"
                >
                  {searching ? <RefreshCw className="animate-spin" size={12} /> : 'Search'}
                </button>
              </div>

              {searchResults.length > 0 && (
                <div className="bg-slate-50 p-2 rounded-[1.5rem] border border-slate-100 space-y-1 max-h-48 overflow-auto animate-in fade-in zoom-in-95">
                  {searchResults.map((res: any, idx: number) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => selectPlace(res)}
                      className="w-full text-left p-4 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 group/item"
                    >
                      <p className="text-[10px] font-black text-slate-800 line-clamp-1 group-hover/item:text-blue-600">{res.display_name}</p>
                      <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Select this location</p>
                    </button>
                  ))}
                </div>
              )}

              <div className="relative group rounded-[2rem] overflow-hidden border border-slate-100 shadow-inner">
                <div id="map-selector" className="h-72 w-full bg-slate-50 z-10" />
                {!shop.latitude && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center pointer-events-none">
                    <MapIcon size={32} className="text-slate-300 mb-3 animate-pulse" />
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">Select or search location</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Latitude</label>
                  <input
                    type="number" step="any"
                    value={shop.latitude || ''}
                    onChange={(e) => setShop({ ...shop, latitude: parseFloat(e.target.value) })}
                    placeholder="0.0000"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-800"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Longitude</label>
                  <input
                    type="number" step="any"
                    value={shop.longitude || ''}
                    onChange={(e) => setShop({ ...shop, longitude: parseFloat(e.target.value) })}
                    placeholder="0.0000"
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* ADDRESS DETAILS */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <span className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shadow-sm">🏠</span>
              Postal Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Building / Door / Street</label>
                <textarea
                  value={shop.address || ''}
                  onChange={(e) => setShop({ ...shop, address: e.target.value })}
                  placeholder="Enter full street address..."
                  rows={3}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-slate-800 focus:border-emerald-500 outline-none transition-all resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">City / Town</label>
                  <input value={shop.city || ''} onChange={(e) => setShop({ ...shop, city: e.target.value })} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Pincode</label>
                  <input value={shop.pincode || ''} onChange={(e) => setShop({ ...shop, pincode: e.target.value })} placeholder="6XXXXX" className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black" />
                </div>
              </div>
            </div>
          </div>

          {/* SOCIALS */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 space-y-6">
            <h2 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
              <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shadow-sm">🌐</span>
              Online Visibility
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 focus-within:border-indigo-500 transition-all">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-indigo-600"><Globe size={18} /></div>
                <input value={shop.website || ''} onChange={(e) => setShop({ ...shop, website: e.target.value })} placeholder="Official Website" className="bg-transparent border-none outline-none text-xs font-black flex-1 py-1 placeholder:text-slate-300" />
              </div>
              <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 focus-within:border-pink-500 transition-all">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm text-pink-500"><Instagram size={18} /></div>
                <input value={shop.instagram || ''} onChange={(e) => setShop({ ...shop, instagram: e.target.value })} placeholder="Instagram Handle" className="bg-transparent border-none outline-none text-xs font-black flex-1 py-1 placeholder:text-slate-300" />
              </div>
            </div>
          </div>

          {/* SAVE CARD */}
          <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-600/10 rounded-full -mr-20 -mt-20 blur-2xl" />
            <div className="relative">
              <h3 className="text-2xl font-black italic tracking-tight">Enterprise Sync</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 leading-loose">Publish your latest establishment details to all users in your area.</p>
            </div>

            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="w-full py-6 bg-blue-600 rounded-[2rem] text-sm font-black uppercase tracking-[0.25em] hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-blue-500/40 relative z-10"
            >
              {saving ? <RefreshCw className="animate-spin" size={20} /> : <CheckCircle2 size={20} className="text-white" />}
              Update Network
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
