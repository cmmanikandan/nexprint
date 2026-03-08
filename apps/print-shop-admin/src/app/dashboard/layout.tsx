'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import PinModal from '@/components/PinModal';
import { useOrderNotifications } from '@/hooks/useOrderNotifications';

const navItems = [
  { href: '/dashboard', label: 'Terminal Home', icon: 'home', roles: ['admin', 'shop_owner', 'staff'] },
  { href: '/dashboard/orders', label: 'Active Jobs', icon: 'document', roles: ['admin', 'shop_owner', 'staff'] },
  { href: '/dashboard/pickup', label: 'Express Pickup', icon: 'collection', roles: ['admin', 'shop_owner', 'staff'] },
  { href: '/dashboard/queue', label: 'Print Queue', icon: 'printer', roles: ['admin', 'shop_owner', 'staff'] },
  { href: '/dashboard/racks', label: 'Racks & Piles', icon: 'admin', roles: ['admin', 'shop_owner', 'staff'] },
  { label: 'Structural HUB', type: 'header', roles: ['admin', 'shop_owner', 'staff'] },
  { href: '/dashboard/establishment', label: 'Shop Profile', icon: 'shop', roles: ['admin', 'shop_owner'] },
  { href: '/dashboard/hours', label: 'Operating Hours', icon: 'admin', roles: ['admin', 'shop_owner'] },
  { href: '/dashboard/delivery', label: 'Logistics HUB', icon: 'delivery', roles: ['admin', 'shop_owner'] },
  { href: '/dashboard/staff', label: 'Personnel HUB', icon: 'staff', roles: ['admin', 'shop_owner'] },
  { href: '/dashboard/payments', label: 'Payments', icon: 'currency', roles: ['admin', 'shop_owner'] },
  { href: '/dashboard/analytics', label: 'Intelligence HUB', icon: 'analytics', roles: ['admin', 'shop_owner'] },
  { href: '/dashboard/feedback', label: 'Feedback HUB', icon: 'customer', roles: ['admin', 'shop_owner', 'staff'] },
  { href: '/dashboard/users', label: 'Customers', icon: 'customer', roles: ['admin', 'shop_owner'] },
  { label: 'System Engine', type: 'header', roles: ['admin', 'shop_owner'] },
  { href: '/dashboard/profile', label: 'Admin Profile', icon: 'user', roles: ['admin', 'shop_owner'] },
  { href: '/dashboard/pricing', label: 'Pricing Hub', icon: 'engine', roles: ['admin', 'shop_owner'] },
  { href: '/dashboard/settings', label: 'Config', icon: 'settings', roles: ['admin', 'shop_owner'] },
];

function Icon({ name }: { name: string }) {
  switch (name) {
    case 'home':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0 7-7 7 7m-9 12V9m0 8h6a2 2 0 002-2v-5" />
        </svg>
      );
    case 'delivery':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h12l4 4v10a2 2 0 01-2 2h-1M5 19H4a2 2 0 01-2-2V5a2 2 0 012-2h1m11 16h-4m-1 0H7m0 0a2 2 0 11-4 0a2 2 0 014 0zm11 0a2 2 0 11-4 0a2 2 0 014 0z" />
        </svg>
      );
    case 'staff':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case 'document':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6M9 16h3M7 4h6l4 4v12H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
        </svg>
      );
    case 'collection':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      );
    case 'printer':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 9V4h12v5M6 18h12v2H6v-2zm-2-3v-4a2 2 0 012-2h12a2 2 0 012 2v4H4z" />
        </svg>
      );
    case 'shop':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case 'currency':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V4m0 16v-4" />
        </svg>
      );
    case 'customer':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      );
    case 'users':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-1a4 4 0 00-4-4h-1M7 20H2v-1a4 4 0 014-4h1m4-5a3 3 0 11-6 0 3 3 0 016 0zm8 0a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'engine':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'settings':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317L9.6 2.25m4.8 2.067l.725-2.067M6.5 7.5L4.433 6.775m2.067 4.8L4.433 12.3M17.5 7.5l2.067-.725m-2.067 4.8L19.567 12.3M12 15a3 3 0 100-6 3 3 0 000 6z" />
        </svg>
      );
    case 'user':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      );
    case 'admin':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4v-4m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'analytics':
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [dark, setDark] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [shopOpen, setShopOpen] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [shop, setShop] = useState<any>(null);

  // PIN Protection State
  const [showPinModal, setShowPinModal] = useState(false);
  const [targetHref, setTargetHref] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  // Real-time order push notifications + audio chime
  useOrderNotifications(shop?.id ?? null);

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [dark]);

  useEffect(() => {
    const fetchUserData = async () => {
      // getSession reads from local storage instantly — avoids false "no user" on load
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/';
        return;
      }

      const user = session.user;

      const fetchProfile = async (retryCount = 0): Promise<any> => {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            if (retryCount < 2 && (error.message?.includes('fetch') || !error.code)) {
              await new Promise(r => setTimeout(r, 1000 * (retryCount + 1)));
              return fetchProfile(retryCount + 1);
            }
            throw error;
          }
          return data;
        } catch (e) {
          console.error('Profile fetch error:', e);
          return null;
        }
      };

      const profile = await fetchProfile();

      // Redirect admin to super admin section (same port)
      if (profile?.role === 'admin') {
        window.location.href = '/admin/dashboard';
        return;
      }

      // Kick out non-admin, non-shop, and non-staff users
      if (profile?.role === 'user' || profile?.role === 'delivery_partner') {
        await supabase.auth.signOut();
        window.location.href = '/';
        return;
      }

      const googlePic = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
      const googleName = user.user_metadata?.full_name || user.user_metadata?.name || '';

      // Auto-sync: If DB profile has no avatar but Google session does, update DB
      if (profile && !profile.avatar_url && googlePic) {
        supabase.from('profiles').update({ avatar_url: googlePic }).eq('id', user.id).then();
      }

      setUserProfile({
        ...profile,
        full_name: profile?.full_name || googleName,
        avatar_url: profile?.avatar_url || googlePic
      });

      // Fetch Shop Data correctly for both owners and staff
      let shopData = null;
      if (profile?.role === 'shop_owner' || profile?.role === 'admin') {
        const { data } = await supabase
          .from('print_shops')
          .select('*')
          .eq('owner_id', user.id)
          .single();
        shopData = data;
      } else if (profile?.role === 'staff') {
        // Find which shop this staff belongs to
        const { data: staffRec } = await supabase
          .from('shop_staff')
          .select('shop_id')
          .eq('user_id', user.id)
          .single();

        if (staffRec) {
          const { data } = await supabase
            .from('print_shops')
            .select('*')
            .eq('id', staffRec.shop_id)
            .single();
          shopData = data;
        }
      }

      setShop(shopData);
    };

    fetchUserData();
  }, []);

  const handleNavClick = (href: string, restricted: boolean) => {
    const isOwnerRole = ['admin', 'shop_owner'].includes(userProfile?.role);
    const pinEnabled = shop?.settings?.pin_required !== false;

    if (restricted && !isOwnerRole && pinEnabled && !verified) {
      setTargetHref(href);
      setShowPinModal(true);
      return false;
    }
    return true;
  };

  const navFiltered = navItems.filter(item =>
    !userProfile || item.roles.includes(userProfile.role || 'shop_owner')
  );

  return (
    <div className="h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex overflow-hidden font-outfit">

      <PinModal
        isOpen={showPinModal}
        onSuccess={() => {
          setVerified(true);
          setShowPinModal(false);
          if (targetHref) router.push(targetHref);
        }}
        onCancel={() => {
          setShowPinModal(false);
          setTargetHref(null);
        }}
        title="Administrative PIN Required"
      />

      {/* Sidebar */}
      <aside className={`hidden md:flex flex-col transition-all duration-300 ease-in-out bg-slate-900 text-white z-50 ${sidebarCollapsed ? 'w-24' : 'w-64'} flex-shrink-0`}>
        <div className={`px-8 py-8 flex items-center gap-3 border-b border-white/5 ${sidebarCollapsed ? 'justify-center px-0' : ''}`}>
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:rotate-6 transition-all flex-shrink-0">
              <span className="text-xs font-black text-white tracking-widest italic">NP</span>
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col flex-1 overflow-hidden whitespace-nowrap">
                <span className="text-sm font-black tracking-tight">NexPrint Shop</span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">
                  Terminal Hub
                </span>
              </div>
            )}
          </Link>
          {!sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-1.5 rounded-lg bg-white/5 text-slate-500 hover:text-white transition-colors"
              title="Collapse Sidebar"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>
        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
          {navFiltered.map((item, idx) => {
            if ('type' in item && item.type === 'header') {
              if (sidebarCollapsed) return <div key={`header-${idx}`} className="h-px bg-white/5 my-6 mx-4" />;
              return (
                <div key={`header-${idx}`} className="mt-8 mb-4 px-4">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">{item.label}</span>
                </div>
              );
            }

            const active = pathname === item.href || (item.href && pathname.startsWith(item.href + '/'));
            const restricted = (item.roles.includes('admin') || item.roles.includes('shop_owner')) && !item.roles.includes('staff');

            return (
              <Link
                key={item.href || `header-${idx}`}
                href={item.href || '#'}
                onClick={(e) => {
                  if (item.href && !handleNavClick(item.href, restricted)) {
                    e.preventDefault();
                  }
                }}
                title={sidebarCollapsed ? item.label : undefined}
                className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all
                  ${active
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  } ${sidebarCollapsed ? 'justify-center px-0 w-12 mx-auto' : ''}`}
              >
                <div className={`${active ? 'text-white' : 'text-slate-500'} transition-colors flex-shrink-0`}>
                  <Icon name={item.icon || 'home'} />
                </div>
                {!sidebarCollapsed && <span>{item.label}</span>}
                {!sidebarCollapsed && restricted && !['admin', 'shop_owner'].includes(userProfile?.role) && !verified && (
                  <span className="ml-auto text-[10px] opacity-40">🔒</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={`px-8 py-8 border-t border-white/5 space-y-6 ${sidebarCollapsed ? 'px-4' : ''}`}>
          <div className="space-y-3">
            <div className={`flex items-center justify-between ${sidebarCollapsed ? 'flex-col gap-3' : ''}`}>
              {!sidebarCollapsed && <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Node Status</span>}
              <button
                onClick={() => setShopOpen((v) => !v)}
                className={`relative inline-flex h-5 w-10 items-center rounded-full transition-all flex-shrink-0 ${shopOpen ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-white/10'}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform ${shopOpen ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {!sidebarCollapsed && (
              <p className={`text-[10px] font-black uppercase tracking-widest ${shopOpen ? 'text-emerald-400' : 'text-slate-600'}`}>
                {shopOpen ? '• Syncing Jobs' : '• Offline'}
              </p>
            )}
          </div>

          <button
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.href = '/';
            }}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
            className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-400/10 transition-all border border-transparent ${sidebarCollapsed ? 'justify-center px-0 w-12 mx-auto' : ''}`}
          >
            <div className="flex-shrink-0"><Icon name="document" /></div>
            {!sidebarCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main content with top header */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        <header className="h-20 flex-shrink-0 border-b border-slate-100 bg-white/50 backdrop-blur-xl px-10 flex items-center justify-between gap-3 sticky top-0 z-30">
          <div className="flex-1 flex items-center gap-6 max-w-xl">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="md:flex flex-shrink-0 w-10 h-10 items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-blue-600 shadow-sm transition-all active:scale-95"
            >
              <svg className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="h-10 px-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3 flex-1 group focus-within:border-blue-200 focus-within:ring-4 focus-within:ring-blue-50/50 transition-all">
              <span className="text-slate-300"><Icon name="document" /></span>
              <input
                placeholder="Search global records..."
                className="bg-transparent border-none outline-none text-[11px] font-black uppercase tracking-widest text-slate-700 w-full placeholder:text-slate-300"
              />
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => setDark((v) => !v)}
              className="h-10 w-10 flex items-center justify-center rounded-2xl bg-white border border-slate-100 text-slate-400 hover:text-blue-600 shadow-sm transition-all active:scale-95"
            >
              {dark ? '☀️' : '🌙'}
            </button>
            <div className="flex items-center gap-4 pl-6 border-l border-slate-100">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-black text-slate-900 tracking-tight">
                  {userProfile?.full_name || 'Loading Profile...'}
                </p>
                <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-0.5">
                  {userProfile?.role?.replace('_', ' ') || 'Staff'} Member @ {shop?.name || 'NexPrint'}
                </p>
              </div>
              <Link href="/dashboard/profile">
                <div className="h-12 w-12 rounded-2xl bg-white border border-slate-100 p-1 group cursor-pointer transition-all hover:border-blue-600 shadow-sm">
                  <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center text-white font-black group-hover:bg-blue-600 transition-colors overflow-hidden">
                    {userProfile?.avatar_url ? (
                      <img
                        src={userProfile.avatar_url}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      userProfile?.full_name?.charAt(0) || 'U'
                    )}
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </header>

        <main className="flex-1 px-5 py-6 md:px-10 md:py-10 overflow-y-auto pb-32 md:pb-10 bg-[#F8FAFC]">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[400px] px-6 h-20 z-50">
        <div className="bg-slate-900 border border-white/10 backdrop-blur-2xl rounded-[2.5rem] h-full flex items-center justify-around px-2 shadow-2xl">
          {navItems.filter(item => 'href' in item && item.roles.includes('shop_owner')).slice(0, 4).map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href || '#'}
                className="flex flex-col items-center justify-center gap-1 flex-1 relative"
              >
                <div className={`p-2.5 rounded-2xl transition-all duration-300 ${active ? 'bg-blue-600 text-white -translate-y-5 shadow-xl shadow-blue-500/40 scale-110' : 'text-slate-500 hover:text-slate-300'}`}>
                  <Icon name={item.icon || 'home'} />
                </div>
                <span className={`text-[8px] font-black uppercase tracking-widest transition-all duration-300 absolute bottom-3 ${active ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                  {item.label.split(' ')[0]}
                </span>
                {active && (
                  <div className="absolute -top-1 w-8 h-1 bg-blue-500 rounded-full blur-[2px]" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
