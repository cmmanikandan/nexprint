'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
    const [settings, setSettings] = useState<any>({
        pin_required: true,
        sound_alerts: true,
        email_updates: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: shop } = await supabase
                .from('print_shops')
                .select('settings')
                .eq('owner_id', user.id)
                .single();

            if (shop?.settings) {
                setSettings(shop.settings);
            }
            setLoading(false);
        };
        fetchSettings();
    }, []);

    const updateSetting = async (key: string, value: any) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            await supabase
                .from('print_shops')
                .update({ settings: newSettings })
                .eq('owner_id', user.id);
        } finally {
            setSaving(false);
        }
    };

    const purgeData = async () => {
        if (!confirm('CRITICAL: This will delete ALL order history for your shop. This cannot be undone. Proceed?')) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: shop } = await supabase
                .from('print_shops')
                .select('id')
                .eq('owner_id', user.id)
                .single();

            if (!shop) return;

            const { error } = await supabase
                .from('orders')
                .delete()
                .eq('shop_id', shop.id);

            if (error) throw error;
            alert('Order history successfully purged.');
            window.location.reload();
        } catch (err) {
            alert('Purge failed. Ensure you have permissions.');
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Syncing Preferences...</div>;

    return (
        <div className="max-w-4xl space-y-8 font-outfit">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Shop Settings</h1>
                <p className="text-slate-500 mt-1 font-medium">Configure your terminal and security preferences</p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-50 shadow-sm divide-y divide-slate-50 overflow-hidden">
                <div className="p-8 hover:bg-slate-50/30 transition-colors">
                    <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <span className="text-lg">🛡️</span> Security & Access
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-slate-700">Require PIN for Sensitive Actions</p>
                                <p className="text-xs text-slate-400 font-medium">Asks for a 4-digit PIN for order deletion and refunds</p>
                            </div>
                            <button
                                onClick={() => updateSetting('pin_required', !settings.pin_required)}
                                disabled={saving}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${settings.pin_required ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'bg-slate-200'
                                    }`}
                            >
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${settings.pin_required ? 'translate-x-6' : 'translate-x-1.5'
                                    }`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-8 hover:bg-slate-50/30 transition-colors">
                    <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <span className="text-lg">🔔</span> Notifications
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-slate-700">Sound Alerts for New Orders</p>
                                <p className="text-xs text-slate-400 font-medium">Plays a high-priority chime when a job enters the queue</p>
                            </div>
                            <button
                                onClick={() => updateSetting('sound_alerts', !settings.sound_alerts)}
                                disabled={saving}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${settings.sound_alerts ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'bg-slate-200'
                                    }`}
                            >
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${settings.sound_alerts ? 'translate-x-6' : 'translate-x-1.5'
                                    }`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-slate-700">Weekly Performance Report</p>
                                <p className="text-xs text-slate-400 font-medium">Receive automated revenue summary via email</p>
                            </div>
                            <button
                                onClick={() => updateSetting('email_updates', !settings.email_updates)}
                                disabled={saving}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${settings.email_updates ? 'bg-blue-600 shadow-lg shadow-blue-100' : 'bg-slate-200'
                                    }`}
                            >
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${settings.email_updates ? 'translate-x-6' : 'translate-x-1.5'
                                    }`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-red-50/30">
                    <h2 className="text-sm font-black text-red-600 mb-4 uppercase tracking-[0.2em]">Danger Zone</h2>
                    <div className="p-6 bg-white rounded-3xl border border-red-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <p className="font-bold text-slate-900">Purge Order Records</p>
                            <p className="text-xs text-slate-500 mt-1">Permanently delete all order logs and print history. This action is irreversible.</p>
                        </div>
                        <button
                            onClick={purgeData}
                            className="px-6 py-3 bg-red-600 text-white text-xs font-black rounded-xl hover:bg-red-700 transition shadow-lg shadow-red-100 uppercase tracking-widest active:scale-95"
                        >
                            Execute Purge
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
