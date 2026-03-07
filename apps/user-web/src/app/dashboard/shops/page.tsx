'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, Star, Clock, ChevronRight, Loader2, LayoutGrid, FileText, User, LocateFixed, Navigation } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import ThemeToggle from '@/components/ThemeToggle';

export default function ShopsPage() {
    const [shops, setShops] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    // Haversine distance formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        if (!lat1 || !lon1 || !lat2 || !lon2) return null;
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    };

    const requestLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((position) => {
                setUserLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
            });
        }
    };

    useEffect(() => {
        const fetchShops = async () => {
            try {
                const { data } = await supabase
                    .from('print_shops')
                    .select('*');
                setShops(data || []);
            } catch (error) {
                console.error('Shops fetch error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchShops();
        requestLocation();
    }, []);

    const filteredShops = shops.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.address?.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Finding local shops...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans text-[var(--foreground)] bg-[var(--background)] pb-32">
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 sticky top-0 z-50">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                            <ChevronRight className="rotate-180" size={20} />
                        </Link>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white">Nearby Shops</h1>
                    </div>
                    <ThemeToggle />
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl px-4 h-12 flex items-center gap-3 border border-slate-100 dark:border-slate-800 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
                    <Search size={18} className="text-slate-300 dark:text-slate-600" />
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search shops or locations..."
                        className="bg-transparent border-none outline-none text-[11px] font-bold uppercase tracking-widest text-slate-700 dark:text-slate-300 w-full placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    />
                    <button
                        onClick={requestLocation}
                        className={`p-2 rounded-xl transition-all ${userLocation ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700'}`}
                    >
                        <LocateFixed size={16} />
                    </button>
                </div>
            </header>

            <main className="max-w-md mx-auto px-5 pt-6 space-y-4">
                {filteredShops.length > 0 ? filteredShops.map((shop) => (
                    <Link href={`/dashboard/shops/${shop.id}`} key={shop.id} className="block group">
                        <motion.div
                            whileTap={{ scale: 0.98 }}
                            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all space-y-4"
                        >
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                                    {shop.name.charAt(0)}
                                </div>
                                <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                                    <Star size={12} fill="currentColor" />
                                    <span>4.8</span>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors leading-none mb-1">{shop.name}</h3>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest truncate">{shop.address || 'Campus Hub, Sector 45'}</p>
                            </div>

                            <div className="flex items-center gap-4 pt-2 border-t border-slate-50 dark:border-slate-800">
                                <div className="flex items-center gap-1.5 min-w-[80px]">
                                    <div className={`w-1.5 h-1.5 rounded-full ${shop.status === 'open' || shop.status === 'active' ? 'bg-emerald-500 animate-pulse' : shop.status === 'busy' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${shop.status === 'open' || shop.status === 'active' ? 'text-emerald-600 dark:text-emerald-400' : shop.status === 'busy' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600'}`}>
                                        {shop.status === 'open' || shop.status === 'active' ? 'Live Now' : shop.status === 'busy' ? 'Busy' : 'Closed'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                                    <MapPin size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-widest">
                                        {userLocation && shop.latitude && shop.longitude
                                            ? `${calculateDistance(userLocation.lat, userLocation.lng, shop.latitude, shop.longitude)?.toFixed(1)} KM AWAY`
                                            : 'CALCULATING...'}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    </Link>
                )) : (
                    <div className="py-20 text-center">
                        <p className="text-xs font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">No matching shops found</p>
                    </div>
                )}
            </main>

        </div>
    );
}
