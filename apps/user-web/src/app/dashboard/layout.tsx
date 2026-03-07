'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutGrid, MapPin, FileText, User, Package } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

const navItems = [
    { id: 'home', icon: LayoutGrid, label: 'Home', href: '/dashboard' },
    { id: 'shops', icon: MapPin, label: 'Shops', href: '/dashboard/shops' },
    { id: 'orders', icon: Package, label: 'Orders', href: '/dashboard/orders' },
    { id: 'prints', icon: FileText, label: 'Prints', href: '/dashboard/prints' },
    { id: 'profile', icon: User, label: 'Me', href: '/dashboard/profile' },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Determine which tab is active based on pathname
    const getActiveTab = () => {
        if (pathname === '/dashboard') return 'home';
        if (pathname.startsWith('/dashboard/shops')) return 'shops';
        if (pathname.startsWith('/dashboard/orders')) return 'orders';
        if (pathname.startsWith('/dashboard/prints') || pathname.startsWith('/dashboard/print-files')) return 'prints';
        if (pathname.startsWith('/dashboard/profile')) return 'profile';
        return 'home';
    };

    const activeTab = getActiveTab();

    // Don't show bottom nav on sub-pages like order detail, shop detail, print-files
    const showBottomNav = [
        '/dashboard',
        '/dashboard/shops',
        '/dashboard/orders',
        '/dashboard/prints',
        '/dashboard/profile'
    ].includes(pathname);

    return (
        <div className="min-h-screen bg-[var(--background)] font-sans text-[var(--foreground)] transition-colors duration-300">
            {/* Floating Toggle */}
            <div className="fixed top-4 right-6 z-[100] hidden md:block">
                <ThemeToggle />
            </div>

            {/* Content Area */}
            <div className={showBottomNav ? 'pb-24' : ''}>
                {children}
            </div>

            {/* Persistent Bottom Nav */}
            {showBottomNav && (
                <nav className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 h-22 px-6 flex items-center justify-between z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.4)] safe-bottom">
                    <div className="max-w-md mx-auto w-full flex justify-between items-end pb-2">
                        {navItems.map((item) => {
                            const isActive = activeTab === item.id;
                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    prefetch={true}
                                    className="flex flex-col items-center gap-2 flex-1 relative transition-all active:scale-90"
                                >
                                    <div
                                        className={`p-3 rounded-2xl transition-all duration-500 ${isActive
                                            ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-2xl shadow-blue-500/50 scale-110 -translate-y-1'
                                            : 'text-slate-500 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400'
                                            }`}
                                    >
                                        <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'animate-pulse' : ''} />
                                    </div>
                                    <span
                                        className={`text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-500 ${isActive
                                            ? 'text-blue-700 dark:text-blue-400 opacity-100'
                                            : 'text-slate-600 dark:text-slate-400 opacity-80'
                                            }`}
                                    >
                                        {item.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            )}
        </div>
    );
}
