'use client';

import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// All logins are now handled by the unified landing page on the user portal.
export default function PrintShopRedirect() {
  useEffect(() => {
    // Redirect to the unified login page on the user-web portal
    window.location.replace('http://localhost:3003');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] font-outfit">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Redirecting to NexPrint…
        </p>
      </div>
    </div>
  );
}
