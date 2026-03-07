'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * useOrderNotifications
 * Subscribes to new orders in real-time and triggers browser push notifications + audio chime.
 * Must be called in a client component that wraps the dashboard (layout).
 */
export function useOrderNotifications(shopId: string | null) {
    const previousOrderIds = useRef<Set<string>>(new Set());
    const audioCtxRef = useRef<AudioContext | null>(null);

    // Request permission on mount
    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }
    }, []);

    // Sound chime using Web Audio API (no external file needed)
    const playChime = () => {
        try {
            const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
            if (!AudioCtx) return;
            if (!audioCtxRef.current) {
                audioCtxRef.current = new AudioCtx();
            }
            const ctx = audioCtxRef.current;
            const freqs = [523, 659, 784]; // C5, E5, G5 — major chord
            freqs.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = freq;
                osc.type = 'sine';
                gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
                gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.12 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.5);
                osc.start(ctx.currentTime + i * 0.12);
                osc.stop(ctx.currentTime + i * 0.12 + 0.5);
            });
        } catch (e) {
            // Silently fail if audio not available
        }
    };

    const sendNotification = (order: any) => {
        const title = order.is_emergency ? '⚡ EMERGENCY JOB INCOMING!' : '🖨️ New Print Job';
        const body = `Order #${order.order_number?.slice(-8)} — ₹${order.total_amount}`;

        // Browser push notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: order.id, // Prevents duplicates
                requireInteraction: order.is_emergency, // Emergency stays until dismissed
            });
        }

        // Audio chime
        playChime();
    };

    useEffect(() => {
        if (!shopId) return;

        // Bootstrap: load existing order IDs so we don't notify on mount
        const bootstrap = async () => {
            const { data } = await supabase
                .from('orders')
                .select('id')
                .eq('shop_id', shopId)
                .in('status', ['pending', 'placed']);

            if (data) {
                data.forEach(o => previousOrderIds.current.add(o.id));
            }
        };
        bootstrap();

        // Subscribe to new orders
        const channel = supabase
            .channel(`notifications-${shopId}`)
            .on(
                'postgres_changes' as any,
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: `shop_id=eq.${shopId}`,
                },
                (payload: any) => {
                    const order = payload.new;
                    if (!previousOrderIds.current.has(order.id)) {
                        previousOrderIds.current.add(order.id);
                        sendNotification(order);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [shopId]);
}
