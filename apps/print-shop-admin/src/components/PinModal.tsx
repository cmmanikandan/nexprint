'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface PinModalProps {
    isOpen: boolean;
    onSuccess: () => void;
    onCancel: () => void;
    title?: string;
}

export default function PinModal({ isOpen, onSuccess, onCancel, title = "Security Verification" }: PinModalProps) {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setPin('');
            setError(false);
        }
    }, [isOpen]);

    const handlePinSubmit = async (val: string) => {
        if (val.length === 4) {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: shop } = await supabase
                    .from('print_shops')
                    .select('settings')
                    .eq('owner_id', user.id)
                    .single();

                const correctPin = shop?.settings?.admin_pin || '1234';

                if (val === correctPin) {
                    onSuccess();
                } else {
                    setError(true);
                    setPin('');
                    // Shake effect or feedback
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl border border-white/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />

                <div className="text-center space-y-4 mb-8">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                        🔐
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest leading-loose">
                        Enter restricted access PIN <br /> to continue
                    </p>
                </div>

                <div className="flex justify-center gap-4 mb-8">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`w-12 h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black transition-all duration-200
                                ${error ? 'border-red-200 bg-red-50 text-red-500 animate-bounce' :
                                    pin.length > i ? 'border-blue-600 bg-blue-50 text-blue-600 scale-110 shadow-lg shadow-blue-100' : 'border-slate-100 bg-slate-50 text-slate-300'}
                            `}
                        >
                            {pin.length > i ? '•' : ''}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'Cancel', 0, 'DEL'].map((num) => (
                        <button
                            key={num}
                            onClick={() => {
                                if (num === 'Cancel') onCancel();
                                else if (num === 'DEL') setPin(p => p.slice(0, -1));
                                else if (typeof num === 'number' && pin.length < 4) {
                                    const newVal = pin + num;
                                    setPin(newVal);
                                    handlePinSubmit(newVal);
                                }
                            }}
                            className={`h-16 rounded-2xl flex items-center justify-center font-black transition-all active:scale-90
                                ${typeof num === 'number' ? 'bg-slate-50 text-slate-900 text-xl hover:bg-slate-100' :
                                    num === 'Cancel' ? 'text-xs text-slate-400 uppercase tracking-widest' :
                                        'text-xs text-red-500 uppercase tracking-widest bg-red-50 hover:bg-red-100'}
                            `}
                        >
                            {num}
                        </button>
                    ))}
                </div>

                {error && (
                    <p className="text-center text-[10px] font-black text-red-500 uppercase tracking-[0.2em] animate-pulse">
                        Access Denied. Incorrect PIN.
                    </p>
                )}
            </div>
        </div>
    );
}
