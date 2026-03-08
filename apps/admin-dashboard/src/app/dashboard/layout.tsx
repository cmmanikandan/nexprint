'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart3,
  Users,
  Store,
  ClipboardList,
  FilePieChart,
  Bell,
  Search,
  LogOut,
  User,
  LayoutGrid
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      // Use getSession first — it's synchronous from local storage and won't
      // cause a false "no user" flash while the JWT is being verified
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No session at all — send to this app's own login page
        window.location.href = '/';
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'admin') {
        await supabase.auth.signOut();
        window.location.href = '/?error=unauthorized';
        return;
      }
    };
    checkUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on mount — router in deps causes spurious re-runs

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };
  const navItems = [
    { href: '/dashboard', label: 'Home', icon: LayoutGrid },
    { href: '/dashboard/users', label: 'Users', icon: Users },
    { href: '/dashboard/shops', label: 'Shops', icon: Store },
    { href: '/dashboard/orders', label: 'Orders', icon: ClipboardList },
    { href: '/dashboard/reports', label: 'Stats', icon: FilePieChart },
    { href: '/dashboard/profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-outfit text-slate-900 select-none">
      {/* Sidebar - Desktop Only */}
      <aside className="fixed left-0 top-0 w-64 h-full bg-slate-900 text-white z-50 hidden lg:flex flex-col">
        <div className="p-8 border-b border-white/5">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-all">
              <span className="font-black italic text-xs">NP</span>
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tight">NexPrint Admin</span>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Global Control</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
              >
                <item.icon size={18} className={active ? 'text-white' : 'text-slate-500'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-8 border-t border-white/5 space-y-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-400/10 transition-all">
            <LogOut size={16} />
            End Session
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-40">
          <div className="flex items-center gap-3 lg:hidden">
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <span className="font-bold text-[10px]">NP</span>
            </div>
            <h1 className="font-black text-xs uppercase tracking-widest">Admin Panel</h1>
          </div>

          <div className="hidden md:flex flex-1 max-w-lg bg-slate-50 rounded-2xl px-5 h-11 items-center gap-3 border border-slate-100 group focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-50 transition-all">
            <Search size={16} className="text-slate-300" />
            <input
              placeholder="Search global registries..."
              className="bg-transparent border-none outline-none text-[11px] font-black uppercase tracking-widest text-slate-700 w-full placeholder:text-slate-300"
            />
          </div>

          <div className="flex items-center gap-4 lg:gap-8">
            <button className="relative w-11 h-11 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 transition-all active:scale-95 shadow-sm">
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-100">
              <div className="hidden sm:block text-right">
                <p className="text-[11px] font-black text-slate-900 leading-none">System Root</p>
                <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mt-0.5">NexPrint Inc.</p>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-slate-200">
                AD
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-10 pb-32 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-[400px] h-20 bg-slate-900/90 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-around px-2 shadow-2xl z-[100]">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1.5 flex-1 relative outline-none"
            >
              <div className={`p-2.5 rounded-2xl transition-all duration-300 ${active ? 'bg-blue-600 text-white -translate-y-5 shadow-xl shadow-blue-500/40 scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
                <item.icon size={22} />
              </div>
              <span className={`text-[8px] font-black uppercase tracking-widest transition-all duration-300 absolute bottom-3 ${active ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-50'}`}>
                {item.label}
              </span>
              {active && (
                <div className="absolute -top-1 w-8 h-1 bg-blue-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&display=swap');
        * { font-family: 'Outfit', sans-serif; }
      `}</style>
    </div>
  );
}
