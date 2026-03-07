'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CloudIcon,
    FileText,
    ChevronRight,
    Loader2,
    CheckCircle2,
    Printer,
    Plus,
    MapPin,
    ChevronDown,
    Image,
    File,
    Trash2,
    Zap,
    CreditCard,
    Banknote,
    Eye,
    Download,
    X
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface FileItem {
    id: string;
    file: File;
    pages: number;
    totalFilePages: number;
    detecting: boolean;
    printType: 'black_white' | 'color';
    printSide: 'single' | 'double';
    copies: number;
    paperSize: string;
    pageRange: string;
    orientation: 'portrait' | 'landscape';
    binding: 'none' | 'spiral' | 'hard';
    customServices: string[];
    paperWeight: '75gsm' | '100gsm';
}

const PAPER_SIZES = [
    { id: 'A4', label: 'A4', desc: 'Standard' },
    { id: 'A3', label: 'A3', desc: 'Large' },
    { id: 'A4_photo', label: 'A4 Photo', desc: 'Glossy' },
    { id: '4x6', label: '4×6', desc: 'Photo' },
    { id: '5x7', label: '5×7', desc: 'Photo' },
    { id: 'Letter', label: 'Letter', desc: '8.5×11' },
    { id: 'Legal', label: 'Legal', desc: '8.5×14' },
];

async function getPdfPageCount(file: File): Promise<number> {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const text = new TextDecoder('latin1').decode(data);
                const matches = text.match(/\/Type\s*\/Page[^s]/g);
                resolve(matches && matches.length > 0 ? matches.length : 1);
            } catch { resolve(1); }
        };
        reader.onerror = () => resolve(1);
        reader.readAsArrayBuffer(file);
    });
}

function countPagesInRange(range: string, maxPages: number): { count: number; error: string | null } {
    if (!range || range.trim() === '' || range.toLowerCase() === 'all') {
        return { count: maxPages, error: null };
    }

    const pagesSet = new Set<number>();
    const parts = range.split(',').map(p => p.trim());

    for (const part of parts) {
        if (part.includes('-')) {
            const rangeParts = part.split('-');
            if (rangeParts.length !== 2) return { count: 0, error: 'Invalid range' };
            const start = parseInt(rangeParts[0].trim());
            const end = parseInt(rangeParts[1].trim());

            if (isNaN(start) || isNaN(end)) return { count: 0, error: 'Enter numbers' };
            if (start < 1) return { count: 0, error: 'Start at page 1' };
            if (end > maxPages) return { count: 0, error: `Max is ${maxPages}` };
            if (start > end) return { count: 0, error: 'Start > End' };

            for (let i = start; i <= end; i++) pagesSet.add(i);
        } else {
            const page = parseInt(part);
            if (isNaN(page)) return { count: 0, error: 'Invalid number' };
            if (page < 1 || page > maxPages) return { count: 0, error: 'Out of bounds' };
            pagesSet.add(page);
        }
    }

    return { count: pagesSet.size, error: null };
}

function getFileIcon(name: string) {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['pdf'].includes(ext)) return <FileText size={20} className="text-red-500" />;
    if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) return <Image size={20} className="text-green-500" />;
    if (['doc', 'docx'].includes(ext)) return <FileText size={20} className="text-blue-500" />;
    if (['ppt', 'pptx'].includes(ext)) return <FileText size={20} className="text-orange-500" />;
    return <File size={20} className="text-slate-400" />;
}

// Load Razorpay script
function loadRazorpayScript(): Promise<boolean> {
    return new Promise((resolve) => {
        if (typeof window !== 'undefined' && (window as any).Razorpay) {
            resolve(true);
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });
}

export default function DocumentUploadPage() {
    const router = useRouter();
    const [files, setFiles] = useState<FileItem[]>([]);
    const [uploading, setUploading] = useState(false);
    // Steps: 1=Select Files, 2=Configure, 3=Payment, 4=Processing, 5=Success
    const [step, setStep] = useState(1);
    const [orderNumber, setOrderNumber] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const addMoreRef = useRef<HTMLInputElement>(null);

    const [isEmergency, setIsEmergency] = useState(false);
    const EMERGENCY_SURCHARGE = 20; // ₹20 flat - always fixed

    // Payment method
    const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash_pickup'>('online');

    // Promo code
    const [promoCode, setPromoCode] = useState('');
    const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number; label: string } | null>(null);
    const [promoError, setPromoError] = useState('');
    const [promoLoading, setPromoLoading] = useState(false);

    const PROMO_CODES: Record<string, { discount: number; type: 'percent' | 'flat'; label: string }> = {
        NEXFIRST: { discount: 20, type: 'percent', label: '20% OFF — Welcome Offer' },
        NEXPRO: { discount: 15, type: 'percent', label: '15% OFF — NexPrint Pro' },
        STUDENT10: { discount: 10, type: 'flat', label: '₹10 OFF — Student Deal' },
        SUMMER25: { discount: 25, type: 'flat', label: '₹25 OFF — Summer Special' },
    };

    const applyPromo = () => {
        setPromoError('');
        setPromoLoading(true);
        setTimeout(() => {
            const code = promoCode.trim().toUpperCase();
            const found = PROMO_CODES[code];
            if (!found) {
                setPromoError('Invalid code. Try NEXFIRST or STUDENT10');
                setPromoApplied(null);
            } else {
                const rawSub = files.reduce((sum, f) => sum + getFilePrice(f), 0);
                const disc = found.type === 'percent'
                    ? Math.round((rawSub * found.discount) / 100)
                    : found.discount;
                setPromoApplied({ code, discount: disc, label: found.label });
            }
            setPromoLoading(false);
        }, 600);
    };

    const [shops, setShops] = useState<any[]>([]);
    const [deliveryNeeded, setDeliveryNeeded] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [deliveryNotes, setDeliveryNotes] = useState('');
    const DELIVERY_FEE = 30; // ₹30 flat delivery fee
    const [selectedShop, setSelectedShop] = useState<any>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [showShopPicker, setShowShopPicker] = useState(false);
    const [expandedFile, setExpandedFile] = useState<string | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        const init = async () => {
            const { data } = await supabase
                .from('print_shops')
                .select('id, name, address, bw_price_per_page, color_price_per_page, emergency_surcharge, settings, status')
                .order('status', { ascending: false }); // Sort to show open/busy shops first
            setShops(data || []);
            if (data && data.length > 0) setSelectedShop(data[0]);

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                setUserProfile({ ...profile, email: profile?.email || user.email });
            }
        };
        init();
    }, []);

    const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = e.target.files;
        if (!selectedFiles || selectedFiles.length === 0) return;

        const newFiles: FileItem[] = [];
        for (let i = 0; i < selectedFiles.length; i++) {
            const file = selectedFiles[i];
            newFiles.push({
                id: `${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}`,
                file, pages: 1, totalFilePages: 1, detecting: true,
                printType: 'black_white', printSide: 'single', copies: 1, paperSize: 'A4',
                pageRange: 'All', orientation: 'portrait', paperWeight: '75gsm',
                binding: 'none', customServices: []
            });
        }
        setFiles(prev => [...prev, ...newFiles]);
        setStep(2);

        for (const item of newFiles) {
            let pages = 1;
            const ext = item.file.name.split('.').pop()?.toLowerCase() || '';
            if (ext === 'pdf') pages = await getPdfPageCount(item.file);
            else if (['doc', 'docx'].includes(ext)) pages = Math.max(1, Math.round(item.file.size / 3000));
            else if (['ppt', 'pptx'].includes(ext)) pages = Math.max(1, Math.round(item.file.size / 20000));
            setFiles(prev => prev.map(f => f.id === item.id ? { ...f, pages, totalFilePages: pages, detecting: false } : f));
        }
        e.target.value = '';
    };

    const removeFile = (id: string) => {
        setFiles(prev => {
            const updated = prev.filter(f => f.id !== id);
            if (updated.length === 0) setStep(1);
            return updated;
        });
    };

    const updateFile = (id: string, updates: Partial<FileItem>) => {
        setFiles(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    };

    const getFilePrice = (item: FileItem) => {
        const pricing = selectedShop?.settings?.pricing;
        const basePrice = selectedShop
            ? (item.printType === 'color' ? parseFloat(selectedShop.color_price_per_page) : parseFloat(selectedShop.bw_price_per_page))
            : (item.printType === 'color' ? 2.0 : 0.5);

        let surcharge = 0;
        if (pricing) {
            if (item.paperSize === 'A3') surcharge = pricing.a3 || 0;
            else if (['A4_photo', '4x6', '5x7'].includes(item.paperSize)) surcharge = pricing.photo_paper || 0;
            else if (['Letter', 'Legal'].includes(item.paperSize)) surcharge = pricing.legal || 0;
        } else {
            // Legacy fallbacks if settings don't exist
            if (['A4_photo', '4x6', '5x7'].includes(item.paperSize)) surcharge = basePrice * 2;
        }

        // Paper Weight Surcharge
        if (pricing && item.paperWeight === '100gsm') {
            surcharge += pricing.premium_paper || 0;
        } else if (item.paperWeight === '100gsm') {
            // Legacy fallback for premium paper
            surcharge += 2.0;
        }

        // Single and double sided cost the same per page (paper saved, but ink same)
        // Price is identical - round to nearest rupee for clean numbers
        let rawTotal = (basePrice + surcharge) * item.pages * item.copies;
        let fileTotal = Math.round(rawTotal); // Clean round number

        // Add Binding
        if (pricing && item.binding && item.binding !== 'none') {
            const bindingPrice = item.binding === 'spiral' ? (pricing.spiral_binding || 0) : (pricing.hard_binding || 0);
            fileTotal += bindingPrice * item.copies;
        }

        // Add Custom Services
        if (pricing?.custom_items && item.customServices?.length > 0) {
            item.customServices.forEach(serviceId => {
                const service = pricing.custom_items.find((s: any) => s.id === serviceId);
                if (service) fileTotal += (service.price || 0) * item.copies;
            });
        }

        return fileTotal;
    };

    const totalPages = files.reduce((sum, f) => sum + f.pages * f.copies, 0);
    const subtotal = files.reduce((sum, f) => sum + getFilePrice(f), 0);
    // Always use the fixed EMERGENCY_SURCHARGE (₹20), NOT from shop DB to avoid wrong values
    const promoDiscount = promoApplied?.discount || 0;
    const totalCost = Math.max(0, subtotal + (isEmergency ? EMERGENCY_SURCHARGE : 0) + (deliveryNeeded ? DELIVERY_FEE : 0) - promoDiscount);

    // Razorpay Payment
    const initiateRazorpayPayment = async (): Promise<boolean> => {
        try {
            const loaded = await loadRazorpayScript();
            if (!loaded) throw new Error('Failed to load payment gateway');

            // Create Razorpay order
            const res = await fetch('/api/razorpay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: totalCost,
                    receipt: `nex_${Date.now()}`
                })
            });

            if (!res.ok) throw new Error('Failed to create payment order');
            const orderData = await res.json();

            return new Promise((resolve) => {
                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: 'NexPrint',
                    description: `Print Order - ${files.length} file${files.length > 1 ? 's' : ''}`,
                    order_id: orderData.id,
                    prefill: {
                        name: userProfile?.full_name || userProfile?.name || '',
                        email: userProfile?.email || '',
                        contact: userProfile?.phone || ''
                    },
                    theme: {
                        color: '#2563EB',
                        backdrop_color: 'rgba(0,0,0,0.7)'
                    },
                    handler: function () {
                        resolve(true);
                    },
                    modal: {
                        ondismiss: function () {
                            resolve(false);
                        }
                    }
                };

                const rzp = new (window as any).Razorpay(options);
                rzp.on('payment.failed', function () {
                    resolve(false);
                });
                rzp.open();
            });
        } catch (error: any) {
            console.error('Payment error:', error);
            alert(error.message || 'Payment failed');
            return false;
        }
    };

    const handleProceedToPayment = () => {
        if (files.length === 0) return;
        setStep(3);
    };

    const handleConfirmOrder = async () => {
        if (paymentMethod === 'online') {
            const paid = await initiateRazorpayPayment();
            if (!paid) return; // User cancelled or payment failed
        }

        // Payment successful (or cash selected), now create order
        setStep(4); // Processing step
        setUploading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/login'); return; }

            const genOrderNum = `NEX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

            // Core payload (works on all versions)
            const corePayload: any = {
                user_id: user.id,
                shop_id: selectedShop?.id || null,
                total_amount: totalCost,
                payment_method: paymentMethod,
                payment_status: paymentMethod === 'online' ? 'paid' : 'pending',
            };

            // Attempt 1: Try Modern Schema + Legacy Fallbacks
            let result = await supabase.from('orders').insert({
                ...corePayload,
                order_number: genOrderNum,
                is_emergency: isEmergency,
                priority: isEmergency ? 1 : 0,
                price: totalCost,
                file_url: 'multi-file-order',
                pages: totalPages,
                delivery_needed: deliveryNeeded,
                delivery_address: deliveryAddress,
                delivery_notes: deliveryNotes,
                delivery_fee: deliveryNeeded ? DELIVERY_FEE : 0,
                delivery_status: deliveryNeeded ? 'pending' : 'none'
            }).select().single();

            // Attempt 2: If Attempt 1 failed (e.g. column missing), try Minimal Safe Payload
            if (result.error) {
                console.warn('Modern insert failed, retrying with minimal safe payload...', result.error.message);
                result = await supabase.from('orders').insert(corePayload).select().single();
            }

            if (result.error) throw result.error;
            const orderData = result.data;

            // Upload files and create order items
            for (const item of files) {
                let fileUrl = '';
                let serverPages = item.pages;

                try {
                    const formData = new FormData();
                    formData.append('file', item.file);
                    const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
                    if (uploadRes.ok) {
                        const uploadData = await uploadRes.json();
                        fileUrl = uploadData.url;
                        if (uploadData.pages > 0) serverPages = uploadData.pages;
                    } else {
                        fileUrl = `nexprint://upload/${item.file.name}`;
                    }
                } catch {
                    fileUrl = `nexprint://upload/${item.file.name}`;
                }

                const sideMultiplier = item.printSide === 'double' ? 0.85 : 1.0;
                const standardSizes = ['A4', 'A3', 'Letter', 'Legal'];

                const itemPayload: any = {
                    order_id: orderData.id,
                    file_url: fileUrl,
                    file_name: item.file.name,
                    file_pages: serverPages,
                    print_type: item.printType,
                    print_side: item.printSide,
                    paper_size: standardSizes.includes(item.paperSize) ? item.paperSize : 'A4',
                    copies: item.copies,
                    total_pages: item.pages * item.copies,
                    price: getFilePrice(item),
                    binding: item.binding,
                    custom_services: item.customServices || []
                };

                const { error: itemError } = await supabase.from('order_items').insert({
                    ...itemPayload,
                    orientation: item.orientation,
                    paper_weight: item.paperWeight,
                    page_range: item.pageRange
                });
                if (itemError) {
                    console.warn('Order item warning:', itemError.message);
                    if (itemError.message?.includes('paper_size')) {
                        delete itemPayload.paper_size;
                        await supabase.from('order_items').insert(itemPayload);
                    }
                }
            }

            setOrderNumber(orderData.order_number || genOrderNum);
            setStep(5); // Success
        } catch (error: any) {
            console.error('Order fail details:', error);
            const errMsg = error.message || error.details || (typeof error === 'object' ? JSON.stringify(error) : String(error));
            alert(`Order Failed: ${errMsg}`);
            setStep(3);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen font-sans text-[var(--foreground)] bg-[var(--background)]">
            <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-6 py-4 sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            if (step === 3) setStep(2);
                            else if (step > 1) { setStep(1); setFiles([]); }
                            else router.push('/dashboard');
                        }}
                        className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400"
                    >
                        <ChevronRight className="rotate-180" size={20} />
                    </button>
                    <h1 className="text-xl font-black text-slate-900 dark:text-white">
                        {step === 3 ? 'Payment' : step === 4 ? 'Processing' : step === 5 ? 'Done' : 'New Print Order'}
                    </h1>
                    {files.length > 0 && step <= 3 && (
                        <span className="ml-auto bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full">
                            {files.length} file{files.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </header>

            <main className="max-w-md mx-auto px-5 pt-8 pb-8">
                <AnimatePresence mode="wait">
                    {/* STEP 1: File Selection */}
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8 text-center">
                            <div onClick={() => fileInputRef.current?.click()} className="aspect-square bg-white dark:bg-slate-900 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] flex flex-col items-center justify-center gap-6 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/10 transition-all p-12 group">
                                <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-[2rem] flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                                    <CloudIcon size={48} />
                                </div>
                                <div className="space-y-2">
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none italic">Select Documents</h2>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">PDF, IMAGES, DOCS (MULTIPLE FILES)</p>
                                </div>
                                <button className="px-8 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                                    Upload Local Files
                                </button>
                                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFilesChange} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.ppt,.pptx,.xls,.xlsx" multiple />
                            </div>
                            <p className="text-[9px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-[0.2em] leading-relaxed max-w-[250px] mx-auto">
                                Files are encrypted. Pages auto-detected from PDFs.
                            </p>
                        </motion.div>
                    )}

                    {/* STEP 2: Configure */}
                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                            {/* Files List */}
                            <div className="space-y-3">
                                {files.map((item, index) => (
                                    <motion.div key={item.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[1.5rem] p-4 shadow-sm space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0">{getFileIcon(item.file.name)}</div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-none mb-1 truncate">{item.file.name}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{(item.file.size / 1024 / 1024).toFixed(2)} MB</span>
                                                    <span className="text-slate-200 dark:text-slate-800">•</span>
                                                    {item.detecting
                                                        ? <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1"><Loader2 size={8} className="animate-spin" /> Detecting...</span>
                                                        : <span className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{item.pages} page{item.pages !== 1 ? 's' : ''}</span>
                                                    }
                                                </div>
                                            </div>
                                            <div className="flex gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => setPreviewFile(item.file)}
                                                    className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 flex items-center justify-center transition-colors hover:bg-blue-100"
                                                    title="Preview File"
                                                >
                                                    <Eye size={12} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const url = URL.createObjectURL(item.file);
                                                        const a = document.createElement('a');
                                                        a.href = url;
                                                        a.download = item.file.name;
                                                        a.click();
                                                        URL.revokeObjectURL(url);
                                                    }}
                                                    className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center transition-colors hover:bg-slate-100"
                                                    title="Download File"
                                                >
                                                    <Download size={12} />
                                                </button>
                                                <button onClick={() => removeFile(item.id)} className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-400 dark:text-red-300 flex items-center justify-center shrink-0 hover:bg-red-100 transition-colors"><Trash2 size={12} /></button>
                                            </div>
                                        </div>

                                        <div className="flex gap-1.5">
                                            <button onClick={() => updateFile(item.id, { printType: 'black_white' })} className={`flex-1 py-2 text-[7px] font-bold uppercase tracking-widest rounded-lg transition-all ${item.printType === 'black_white' ? 'bg-slate-900 dark:bg-slate-700 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700'}`}>B&W</button>
                                            <button onClick={() => updateFile(item.id, { printType: 'color' })} className={`flex-1 py-2 text-[7px] font-bold uppercase tracking-widest rounded-lg transition-all ${item.printType === 'color' ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700'}`}>Color</button>
                                            <button
                                                onClick={() => {
                                                    // Can only use double-side if file has more than 1 page
                                                    if (item.pages <= 1 && item.printSide === 'single') return;
                                                    updateFile(item.id, { printSide: item.printSide === 'single' ? 'double' : 'single' });
                                                }}
                                                title={item.pages <= 1 ? '2-Sided requires 2+ pages' : ''}
                                                className={`flex-1 py-2 text-[7px] font-bold uppercase tracking-widest rounded-lg transition-all ${item.pages <= 1
                                                    ? 'bg-slate-50 dark:bg-slate-800 text-slate-200 dark:text-slate-700 border border-slate-100 dark:border-slate-700 cursor-not-allowed opacity-50'
                                                    : item.printSide === 'double'
                                                        ? 'bg-indigo-600 text-white'
                                                        : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700'
                                                    }`}
                                            >{item.printSide === 'double' ? '2-Side' : '1-Side'}</button>
                                            <button onClick={() => setExpandedFile(expandedFile === item.id ? null : item.id)} className={`px-2 py-2 text-[7px] font-bold rounded-lg transition-all ${expandedFile === item.id ? 'bg-amber-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700'}`}>
                                                <ChevronDown size={10} className={`transition-transform ${expandedFile === item.id ? 'rotate-180' : ''}`} />
                                            </button>
                                        </div>

                                        <AnimatePresence>
                                            {expandedFile === item.id && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                    <div className="space-y-2 pt-1">
                                                        <label className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Paper Size</label>
                                                        <div className="grid grid-cols-4 gap-1.5">
                                                            {PAPER_SIZES.map(size => (
                                                                <button key={size.id} onClick={() => updateFile(item.id, { paperSize: size.id })} className={`py-2 px-1 text-center rounded-lg transition-all ${item.paperSize === size.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-slate-700'}`}>
                                                                    <div className="text-[8px] font-bold">{size.label}</div>
                                                                    <div className={`text-[6px] font-bold mt-0.5 ${item.paperSize === size.id ? 'text-blue-100' : 'text-slate-300 dark:text-slate-600'}`}>{size.desc}</div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3 pt-1">
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Page Range</label>
                                                                <input
                                                                    type="text"
                                                                    placeholder="e.g. 1-5, 8"
                                                                    value={item.pageRange}
                                                                    onChange={(e) => {
                                                                        const range = e.target.value;
                                                                        const { count, error } = countPagesInRange(range, item.totalFilePages);
                                                                        updateFile(item.id, {
                                                                            pageRange: range,
                                                                            pages: count || item.totalFilePages // Fallback to all if range empty/invalid
                                                                        });
                                                                    }}
                                                                    className={`w-full px-3 py-2 text-[10px] font-bold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 border ${countPagesInRange(item.pageRange, item.totalFilePages).error ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'} rounded-lg outline-none focus:border-blue-500 transition-all`}
                                                                />
                                                                {countPagesInRange(item.pageRange, item.totalFilePages).error && (
                                                                    <p className="text-[6px] font-bold text-red-500 uppercase tracking-widest">{countPagesInRange(item.pageRange, item.totalFilePages).error}</p>
                                                                )}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right block">Pages</label>
                                                                <div className="w-full px-3 py-2 text-center text-[10px] font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                                                    {item.pages} / {item.totalFilePages}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Orientation */}
                                                        <div className="space-y-2 pt-2">
                                                            <label className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Orientation</label>
                                                            <div className="flex gap-1.5">
                                                                <button onClick={() => updateFile(item.id, { orientation: 'portrait' })} className={`flex-1 py-1.5 text-[7px] font-bold uppercase tracking-widest rounded-lg transition-all ${item.orientation === 'portrait' ? 'bg-slate-900 dark:bg-slate-700 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700'}`}>Portrait</button>
                                                                <button onClick={() => updateFile(item.id, { orientation: 'landscape' })} className={`flex-1 py-1.5 text-[7px] font-bold uppercase tracking-widest rounded-lg transition-all ${item.orientation === 'landscape' ? 'bg-slate-900 dark:bg-slate-700 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700'}`}>Landscape</button>
                                                            </div>
                                                        </div>

                                                        {/* Paper Weight */}
                                                        <div className="space-y-2 pt-2">
                                                            <label className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Paper Weight</label>
                                                            <div className="flex gap-1.5">
                                                                <button onClick={() => updateFile(item.id, { paperWeight: '75gsm' })} className={`flex-1 py-1.5 text-[7px] font-bold uppercase tracking-widest rounded-lg transition-all ${item.paperWeight === '75gsm' ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700'}`}>75 GSM (Standard)</button>
                                                                <button onClick={() => updateFile(item.id, { paperWeight: '100gsm' })} className={`flex-1 py-1.5 text-[7px] font-bold uppercase tracking-widest rounded-lg transition-all ${item.paperWeight === '100gsm' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700'}`}>100 GSM (Premium)</button>
                                                            </div>
                                                        </div>

                                                        {/* Binding Selection */}
                                                        <div className="space-y-2 pt-2">
                                                            <label className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Binding</label>
                                                            <div className="flex gap-1.5">
                                                                <button onClick={() => updateFile(item.id, { binding: 'none' })} className={`flex-1 py-1.5 text-[7px] font-bold uppercase tracking-widest rounded-lg transition-all ${item.binding === 'none' ? 'bg-slate-900 dark:bg-slate-700 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700'}`}>None</button>
                                                                <button onClick={() => updateFile(item.id, { binding: 'spiral' })} className={`flex-1 py-1.5 text-[7px] font-bold uppercase tracking-widest rounded-lg transition-all ${item.binding === 'spiral' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700'}`}>Spiral (₹{selectedShop?.settings?.pricing?.spiral_binding || 40})</button>
                                                                <button onClick={() => updateFile(item.id, { binding: 'hard' })} className={`flex-1 py-1.5 text-[7px] font-bold uppercase tracking-widest rounded-lg transition-all ${item.binding === 'hard' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700'}`}>Hard (₹{selectedShop?.settings?.pricing?.hard_binding || 150})</button>
                                                            </div>
                                                        </div>

                                                        {/* Custom Services Section */}
                                                        {selectedShop?.settings?.pricing?.custom_items?.length > 0 && (
                                                            <div className="space-y-2 pt-2">
                                                                <label className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Special Services</label>
                                                                <div className="grid grid-cols-2 gap-1.5">
                                                                    {selectedShop.settings.pricing.custom_items.map((service: any) => {
                                                                        const isSelected = item.customServices?.includes(service.id);
                                                                        return (
                                                                            <button
                                                                                key={service.id}
                                                                                onClick={() => {
                                                                                    const current = item.customServices || [];
                                                                                    const updated = isSelected
                                                                                        ? current.filter(id => id !== service.id)
                                                                                        : [...current, service.id];
                                                                                    updateFile(item.id, { customServices: updated });
                                                                                }}
                                                                                className={`py-2 px-2 text-left rounded-lg transition-all border flex items-center justify-between ${isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}
                                                                            >
                                                                                <span className="text-[7px] font-bold uppercase truncate">{service.name}</span>
                                                                                <span className="text-[8px] font-bold shrink-0 ml-1">₹{service.price}</span>
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => updateFile(item.id, { copies: Math.max(1, item.copies - 1) })} className="w-7 h-7 rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 dark:text-slate-500">−</button>
                                                <span className="text-base font-bold text-slate-900 dark:text-white w-6 text-center">{item.copies}</span>
                                                <button onClick={() => updateFile(item.id, { copies: item.copies + 1 })} className="w-7 h-7 rounded-md border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400 dark:text-slate-500">+</button>
                                                <span className="text-[7px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest ml-0.5">copies</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 italic">₹{getFilePrice(item).toFixed(2)}</span>
                                                {['A4_photo', '4x6', '5x7'].includes(item.paperSize) && (
                                                    <div className="text-[6px] font-bold text-amber-500 dark:text-amber-400 uppercase tracking-widest">Photo Paper</div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            <button onClick={() => addMoreRef.current?.click()} className="w-full py-3.5 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hover:border-blue-300 dark:hover:border-blue-700 hover:text-blue-500 transition-all">
                                <Plus size={14} /> Add More Files
                            </button>
                            <input type="file" className="hidden" ref={addMoreRef} onChange={handleFilesChange} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.ppt,.pptx,.xls,.xlsx" multiple />

                            {/* Emergency */}
                            <button onClick={() => setIsEmergency(!isEmergency)} className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${isEmergency ? 'border-red-400 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 shadow-lg shadow-red-500/10' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-amber-200 dark:hover:border-amber-800'}`}>
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isEmergency ? 'bg-red-500 text-white' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-500'}`}><Zap size={20} /></div>
                                <div className="text-left flex-1">
                                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        Urgent Order
                                        {isEmergency && <span className="text-[7px] font-bold text-red-500 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full uppercase tracking-widest">Active</span>}
                                    </div>
                                    <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">Priority queue • Flat +₹{EMERGENCY_SURCHARGE}</p>
                                </div>
                                <div className={`w-11 h-6 rounded-full transition-all relative ${isEmergency ? 'bg-red-500' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                    <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all ${isEmergency ? 'left-[22px]' : 'left-0.5'}`} />
                                </div>
                            </button>

                            {/* Delivery Selection - Moved to Step 2 */}
                            <div className={`w-full flex flex-col p-5 rounded-[2rem] border-2 transition-all ${deliveryNeeded ? 'border-blue-500 dark:border-blue-700 bg-blue-50/10 dark:bg-blue-900/5 shadow-lg shadow-blue-500/5' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-200 dark:hover:border-blue-800'}`}>
                                <div className="flex items-center gap-4 cursor-pointer" onClick={() => setDeliveryNeeded(!deliveryNeeded)}>
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${deliveryNeeded ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                                        <MapPin size={20} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            Handover Delivery
                                            {deliveryNeeded && <span className="text-[7px] font-bold text-blue-500 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-2 py-0.5 rounded-full uppercase tracking-widest">Selected</span>}
                                        </div>
                                        <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">Flat ₹{DELIVERY_FEE} • Campus Wide</p>
                                    </div>
                                    <div className={`w-11 h-6 rounded-full transition-all relative ${deliveryNeeded ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all ${deliveryNeeded ? 'left-[22px]' : 'left-0.5'}`} />
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {deliveryNeeded && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                                            <div className="pt-4 space-y-3">
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Drop-off Address</label>
                                                    <input
                                                        value={deliveryAddress}
                                                        onChange={(e) => setDeliveryAddress(e.target.value)}
                                                        placeholder="Room No, Block (e.g. 4B, Main Hall)"
                                                        className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-inner"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Special Notes</label>
                                                    <textarea
                                                        value={deliveryNotes}
                                                        onChange={(e) => setDeliveryNotes(e.target.value)}
                                                        placeholder="Any instructions for delivery partner..."
                                                        rows={2}
                                                        className="w-full px-5 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-800 dark:text-white focus:border-blue-500 outline-none transition-all resize-none placeholder:text-slate-300 dark:placeholder:text-slate-600 shadow-inner"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Shop */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
                                <label className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Print Center</label>
                                <button onClick={() => setShowShopPicker(!showShopPicker)} className="w-full flex items-center justify-between px-4 py-3 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <MapPin size={14} className="text-blue-500 shrink-0" />
                                        <div className="flex flex-col items-start min-w-0">
                                            <span className="text-xs font-bold text-slate-900 dark:text-white truncate w-full">{selectedShop?.name || 'Select a shop'}</span>
                                            {selectedShop && (
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${selectedShop.status === 'open' ? 'bg-emerald-500 animate-pulse' : selectedShop.status === 'busy' ? 'bg-amber-500' : 'bg-red-500'}`} />
                                                    <span className={`text-[8px] font-bold uppercase tracking-widest ${selectedShop.status === 'open' ? 'text-emerald-600 dark:text-emerald-400' : selectedShop.status === 'busy' ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                                        {selectedShop.status === 'busy' ? 'High Load' : selectedShop.status}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${showShopPicker ? 'rotate-180' : ''} shrink-0 ml-2`} />
                                </button>
                                <AnimatePresence>
                                    {showShopPicker && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                            <div className="border border-slate-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 max-h-48 overflow-y-auto">
                                                {shops.map(shop => {
                                                    const isOpen = shop.status === 'open';
                                                    const isBusy = shop.status === 'busy';
                                                    const isClosed = shop.status === 'closed';

                                                    return (
                                                        <button
                                                            key={shop.id}
                                                            onClick={() => {
                                                                if (!isClosed) {
                                                                    setSelectedShop(shop);
                                                                    setShowShopPicker(false);
                                                                }
                                                            }}
                                                            disabled={isClosed}
                                                            className={`w-full text-left px-4 py-4 flex items-center gap-3 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedShop?.id === shop.id ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''} ${isClosed ? 'opacity-60 cursor-not-allowed grayscale' : ''}`}
                                                        >
                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${isOpen ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : isBusy ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                                                                {shop.name.charAt(0)}
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{shop.name}</p>
                                                                    <span className={`text-[7px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md ${isOpen ? 'bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : isBusy ? 'bg-amber-100/50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-red-100/50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                                                                        {isBusy ? 'High Load' : shop.status}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate opacity-70 mb-1">{shop.address}</p>
                                                                <div className="flex gap-3">
                                                                    <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">₹{shop.bw_price_per_page}/bw</span>
                                                                    <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">₹{shop.color_price_per_page}/color</span>
                                                                </div>
                                                            </div>
                                                            {selectedShop?.id === shop.id && <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400 ml-auto shrink-0" />}
                                                        </button>
                                                    );
                                                })}
                                                {shops.length === 0 && <p className="px-4 py-6 text-center text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest">No shops available</p>}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Summary */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Files × Pages</span>
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{files.length} × {totalPages}</span>
                                </div>
                                {isEmergency && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest flex items-center gap-1"><Zap size={10} /> Urgent Fee</span>
                                        <span className="text-xs font-bold text-red-500">+₹{EMERGENCY_SURCHARGE}</span>
                                    </div>
                                )}
                                {deliveryNeeded && (
                                    <div className="flex justify-between items-center">
                                        <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1"><MapPin size={10} /> Delivery</span>
                                        <span className="text-xs font-bold text-blue-500">+₹{DELIVERY_FEE}</span>
                                    </div>
                                )}
                                <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex justify-between items-center">
                                    <span className="text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-widest">Total</span>
                                    <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 italic">₹{totalCost.toFixed(2)}</span>
                                </div>
                            </div>

                            <button onClick={handleProceedToPayment} disabled={files.some(f => f.detecting)} className="w-full py-5 bg-slate-900 dark:bg-slate-700 text-white rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50">
                                <CreditCard size={16} className="text-blue-400" />
                                Proceed to Payment — ₹{totalCost.toFixed(2)}
                            </button>
                            <button onClick={() => { setStep(1); setFiles([]); setIsEmergency(false); }} className="w-full py-2 text-[9px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors">Cancel All</button>
                        </motion.div>
                    )}

                    {/* STEP 3: Payment */}
                    {step === 3 && (
                        <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                            {/* Order Summary Card */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-6 shadow-sm space-y-4">
                                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Printer size={18} className="text-blue-500" /> Order Summary
                                </h2>
                                {files.map(item => (
                                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            {getFileIcon(item.file.name)}
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-bold text-slate-900 dark:text-white truncate">{item.file.name}</p>
                                                <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                                                    {item.pages}pg • {item.copies}× • {item.printType} • {item.paperSize} • {item.orientation} • {item.paperWeight}
                                                    {item.binding !== 'none' && ` • ${item.binding} binding`}
                                                    {item.customServices?.length > 0 && ` • +${item.customServices.length} extras`}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0 ml-2">₹{getFilePrice(item).toFixed(2)}</span>
                                    </div>
                                ))}
                                {isEmergency && (
                                    <div className="flex items-center justify-between py-2 border-b border-slate-50 dark:border-slate-800/50">
                                        <div className="flex items-center gap-2">
                                            <Zap size={16} className="text-red-500" />
                                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Urgent Fee</span>
                                        </div>
                                        <span className="text-xs font-bold text-red-500">+₹{EMERGENCY_SURCHARGE}</span>
                                    </div>
                                )}
                                {promoApplied && (
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">🎉 Promo ({promoApplied.code})</span>
                                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">−₹{promoApplied.discount}</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest">Total</span>
                                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 italic">₹{totalCost.toFixed(2)}</span>
                                </div>
                            </div>

                            {/* Promo Code */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2rem] p-5 shadow-sm space-y-3">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Promo / Coupon Code</p>
                                {promoApplied ? (
                                    <div className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                                        <div className="w-8 h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                                            <CheckCircle2 size={14} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-black text-emerald-700 dark:text-emerald-400">{promoApplied.code}</p>
                                            <p className="text-[8px] font-bold text-emerald-600 dark:text-emerald-500">{promoApplied.label} — Saving ₹{promoApplied.discount}</p>
                                        </div>
                                        <button onClick={() => { setPromoApplied(null); setPromoCode(''); }}
                                            className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center active:scale-90 transition-all">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex gap-2">
                                        <input value={promoCode} onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromoError(''); }}
                                            placeholder="Enter promo code (e.g. NEXFIRST)"
                                            className={`flex-1 px-4 py-3 rounded-xl border text-xs font-bold outline-none transition-all bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal placeholder:font-normal ${promoError ? 'border-red-300 dark:border-red-700' : 'border-slate-200 dark:border-slate-700 focus:border-blue-500'}`}
                                            onKeyDown={e => e.key === 'Enter' && promoCode && applyPromo()}
                                        />
                                        <button onClick={applyPromo} disabled={!promoCode.trim() || promoLoading}
                                            className="px-5 py-3 bg-slate-900 dark:bg-slate-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest disabled:opacity-40 active:scale-95 transition-all flex items-center gap-1.5">
                                            {promoLoading ? <Loader2 size={13} className="animate-spin" /> : 'Apply'}
                                        </button>
                                    </div>
                                )}
                                {promoError && <p className="text-[9px] font-bold text-red-500">❌ {promoError}</p>}
                            </div>

                            {/* Payment Method Selection */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Payment Method</label>

                                <button
                                    onClick={() => setPaymentMethod('online')}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'online' ? 'border-blue-500 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === 'online' ? 'bg-blue-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                                        <CreditCard size={22} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Pay Online</p>
                                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500">UPI, Cards, Wallets, Net Banking</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-blue-600' : 'border-slate-200 dark:border-slate-700'}`}>
                                        {paymentMethod === 'online' && <div className="w-3 h-3 rounded-full bg-blue-600" />}
                                    </div>
                                </button>

                                <button
                                    onClick={() => setPaymentMethod('cash_pickup')}
                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'cash_pickup' ? 'border-emerald-500 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10 shadow-sm' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900'}`}
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${paymentMethod === 'cash_pickup' ? 'bg-emerald-600 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}>
                                        <Banknote size={22} />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">Cash on Pickup</p>
                                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500">Pay when you collect your prints</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cash_pickup' ? 'border-emerald-600' : 'border-slate-200 dark:border-slate-700'}`}>
                                        {paymentMethod === 'cash_pickup' && <div className="w-3 h-3 rounded-full bg-emerald-600" />}
                                    </div>
                                </button>
                            </div>

                            {/* Delivery Section - Removed from Step 3 (Now in Step 2) */}

                            {/* Confirm Button */}
                            <button
                                onClick={handleConfirmOrder}
                                className={`w-full py-5 text-white rounded-[1.5rem] text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl ${isEmergency
                                    ? 'bg-gradient-to-r from-red-600 to-amber-500 shadow-red-500/20'
                                    : paymentMethod === 'online'
                                        ? 'bg-blue-600 shadow-blue-500/20'
                                        : 'bg-emerald-600 shadow-emerald-500/20'
                                    }`}
                            >
                                {paymentMethod === 'online' ? (
                                    <><CreditCard size={16} /> Pay ₹{totalCost.toFixed(2)} & Place Order</>
                                ) : (
                                    <><Printer size={16} /> Place Order — ₹{totalCost.toFixed(2)}</>
                                )}
                            </button>

                            <button onClick={() => setStep(2)} className="w-full py-2 text-[9px] font-bold uppercase tracking-widest text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors">
                                ← Back to Configuration
                            </button>
                        </motion.div>
                    )}

                    {/* STEP 4: Processing */}
                    {step === 4 && (
                        <motion.div key="step4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-8 py-20">
                            <div className="w-20 h-20 mx-auto bg-blue-50 dark:bg-blue-900/20 rounded-[1.5rem] flex items-center justify-center shadow-sm">
                                <Loader2 size={40} className="animate-spin text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white italic">Processing Order...</h2>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Uploading files & creating your print job</p>
                            </div>
                        </motion.div>
                    )}

                    {/* STEP 5: Success */}
                    {step === 5 && (
                        <motion.div key="step5" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-10 shadow-sm text-center space-y-6">
                            <div className={`w-20 h-20 ${isEmergency ? 'bg-red-50 dark:bg-red-900/20 text-red-500' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500'} rounded-[1.5rem] flex items-center justify-center mx-auto shadow-sm`}>
                                {isEmergency ? <Zap size={44} /> : <CheckCircle2 size={44} />}
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-none italic">
                                    {isEmergency ? 'Urgent Order Placed!' : 'Order Placed!'}
                                </h2>
                                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-relaxed">
                                    {files.length} file{files.length > 1 ? 's' : ''} queued for printing.
                                    {selectedShop ? ` Pick up at ${selectedShop.name}.` : ''}
                                </p>
                                {isEmergency && (
                                    <p className="text-[9px] font-bold text-red-500 uppercase tracking-widest flex items-center justify-center gap-1">
                                        <Zap size={10} /> Priority Processing Active
                                    </p>
                                )}
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Order ID</p>
                                <p className="text-xl font-black tracking-wider text-slate-900 dark:text-white italic">{orderNumber}</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Amount</p>
                                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400 italic">₹{totalCost.toFixed(2)}</p>
                                </div>
                                <div className="flex-1 bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <p className="text-[7px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">Payment</p>
                                    <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{paymentMethod === 'online' ? '✅ Paid Online' : '💵 Cash'}</p>
                                </div>
                            </div>
                            <Link href="/dashboard/prints" className="block w-full py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-all shadow-xl shadow-blue-500/20">
                                Track My Status
                            </Link>
                            <Link href="/dashboard" className="block w-full py-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                                Back to Dashboard
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* File Preview Modal */}
            <AnimatePresence>
                {previewFile && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[80vh] rounded-[2rem] overflow-hidden flex flex-col relative border border-white/10"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        {getFileIcon(previewFile.name)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[200px] md:max-w-md italic">{previewFile.name}</h3>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest italic">{(previewFile.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setPreviewFile(null)}
                                    className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-all active:scale-90"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 bg-slate-50 dark:bg-slate-950 overflow-auto p-4 flex items-center justify-center">
                                {previewFile.type.startsWith('image/') ? (
                                    <img
                                        src={URL.createObjectURL(previewFile)}
                                        alt="Preview"
                                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg border border-white/5"
                                    />
                                ) : previewFile.type === 'application/pdf' ? (
                                    <iframe
                                        src={URL.createObjectURL(previewFile) + '#toolbar=0'}
                                        className="w-full h-full rounded-lg shadow-inner bg-white dark:bg-white/90"
                                        title="PDF Preview"
                                    />
                                ) : (
                                    <div className="text-center space-y-4">
                                        <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-3xl flex items-center justify-center mx-auto shadow-sm border border-slate-100 dark:border-slate-800">
                                            {getFileIcon(previewFile.name)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white italic">No Preview Available</p>
                                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Please download the file to view</p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const url = URL.createObjectURL(previewFile);
                                                const a = document.createElement('a');
                                                a.href = url;
                                                a.download = previewFile.name;
                                                a.click();
                                            }}
                                            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                                        >
                                            Download Now
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
