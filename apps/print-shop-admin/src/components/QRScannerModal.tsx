'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface QRScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (data: string) => void;
    title?: string;
}

export default function QRScannerModal({ isOpen, onClose, onScan, title = "Scan Order QR" }: QRScannerModalProps) {
    const [error, setError] = useState<string | null>(null);
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                try {
                    const scanner = new Html5QrcodeScanner(
                        "qr-reader",
                        {
                            fps: 10,
                            qrbox: { width: 250, height: 250 },
                            aspectRatio: 1.0
                        },
            /* verbose= */ false
                    );

                    scanner.render((decodedText) => {
                        onScan(decodedText);
                        scanner.clear();
                        onClose();
                    }, (err) => {
                        // Silently ignore scan errors (they happen every frame if no QR found)
                    });

                    scannerRef.current = scanner;
                } catch (err: any) {
                    setError("Camera access blocked or not supported.");
                    console.error(err);
                }
            }, 100);
        }

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(e => console.error(e));
            }
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
            <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl relative border-4 border-slate-900">
                <div className="p-8 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                            <Camera size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">{title}</h3>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Terminal Scanner Online</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
                        <X size={20} className="text-slate-400" />
                    </button>
                </div>

                <div className="p-6">
                    {error ? (
                        <div className="bg-red-50 p-8 text-center rounded-3xl border border-red-100 italic font-bold text-red-500 text-xs">
                            {error}
                        </div>
                    ) : (
                        <div id="qr-reader" className="w-full !border-none rounded-2xl overflow-hidden [&_video]:rounded-2xl [&_#qr-reader__dashboard]:!p-4 [&_#qr-reader__status_span]:!font-black [&_button]:bg-blue-600 [&_button]:text-white [&_button]:px-4 [&_button]:py-2 [&_button]:rounded-xl [&_button]:text-[10px] [&_button]:uppercase [&_button]:font-black [&_button]:tracking-widest [&_#qr-reader__scan_region_img]:!mx-auto" />
                    )}
                </div>

                <div className="px-8 pb-8 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">
                        Position the user's phone QR within the window <br /> for instant terminal verification.
                    </p>
                </div>
            </div>
        </div>
    );
}
