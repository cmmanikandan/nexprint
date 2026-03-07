'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AdminLogin() {
  useEffect(() => {
    // Force use of unified login on port 3003
    window.location.replace('http://localhost:3003/login');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-outfit">
      <div className="text-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400 mx-auto" />
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Redirecting to Unified Global Login…
        </p>
      </div>
    </div>
  );
}
