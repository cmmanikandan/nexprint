'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

export default function LogoutPage() {
    useEffect(() => {
        const performLogout = async () => {
            // Sign out from the current portal (3003)
            await supabase.auth.signOut();
            // Redirect to home
            window.location.replace('/');
        };
        performLogout();
    }, []);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#07070f] font-outfit">
            <div className="text-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                    Signing out from NexPrint…
                </p>
            </div>
        </div>
    );
}
