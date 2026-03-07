'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const [isDark, setIsDark] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Read the actual current state from the HTML element
        const dark = document.documentElement.classList.contains('dark');
        setIsDark(dark);

        // Watch for external changes (other toggles, etc.)
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

        return () => observer.disconnect();
    }, []);

    const toggle = () => {
        const html = document.documentElement;
        const nextDark = !html.classList.contains('dark');

        if (nextDark) {
            html.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            html.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
        setIsDark(nextDark);
    };

    // Avoid hydration mismatch by rendering a placeholder until mounted
    if (!mounted) {
        return (
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800" />
        );
    }

    return (
        <button
            onClick={toggle}
            className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:scale-105 transition-all active:scale-90 shadow-sm"
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            <div className="relative w-5 h-5 overflow-hidden">
                {/* Sun - shown in dark mode */}
                <div
                    className="absolute inset-0 transition-all duration-300 flex items-center justify-center"
                    style={{
                        opacity: isDark ? 1 : 0,
                        transform: isDark ? 'translateY(0)' : 'translateY(-20px)',
                    }}
                >
                    <Sun size={18} className="text-amber-400" />
                </div>

                {/* Moon - shown in light mode */}
                <div
                    className="absolute inset-0 transition-all duration-300 flex items-center justify-center"
                    style={{
                        opacity: isDark ? 0 : 1,
                        transform: isDark ? 'translateY(20px)' : 'translateY(0)',
                    }}
                >
                    <Moon size={18} className="text-slate-600" />
                </div>
            </div>
        </button>
    );
}
