'use client';

import { useRef } from 'react';

interface InvoiceProps {
    order: any;
    shop: any;
    racks?: any[];
    onClose: () => void;
}

export default function GSTInvoice({ order, shop, racks = [], onClose }: InvoiceProps) {
    const printRef = useRef<HTMLDivElement>(null);

    const gstRate = shop?.settings?.pricing?.gst_percent ?? 18;
    const subtotal = Number(order?.total_amount ?? 0);
    const gstAmount = parseFloat(((subtotal * gstRate) / (100 + gstRate)).toFixed(2));
    const baseAmount = parseFloat((subtotal - gstAmount).toFixed(2));
    const rack = racks.find(r => r.id === order?.rack_id);

    const invoiceDate = new Date(order?.created_at || Date.now()).toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
    });

    const handlePrint = () => {
        const content = printRef.current;
        if (!content) return;

        // Use a better print window approach
        const win = window.open('', '_blank');
        if (!win) return;

        win.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice – ${order?.order_number}</title>
          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;700;900&display=swap" rel="stylesheet">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Outfit', sans-serif; }
            body { 
              background: white; 
              padding: 40px; 
              color: #0f172a;
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important;
            }
            
            .invoice-shell { 
              max-width: 800px; 
              margin: auto; 
              background: white;
            }
            
            /* Typography & Colors (Bulletproof for Print) */
            .text-3xl { font-size: 32px !important; line-height: 1 !important; font-weight: 900 !important; }
            .text-2xl { font-size: 24px !important; line-height: 1 !important; font-weight: 900 !important; }
            .text-base { font-size: 15px !important; font-weight: 700 !important; }
            .text-sm { font-size: 13px !important; font-weight: 700 !important; }
            .text-xs { font-size: 11px !important; font-weight: 700 !important; }
            .text-\\[11px\\] { font-size: 11px !important; }
            .text-\\[10px\\] { font-size: 10px !important; font-weight: 800 !important; }
            .text-\\[9px\\] { font-size: 9px !important; font-weight: 900 !important; }
            
            .uppercase { text-transform: uppercase !important; }
            .tracking-widest { letter-spacing: 0.1em !important; }
            .tracking-tight { letter-spacing: -0.02em !important; }
            .font-black { font-weight: 900 !important; }
            
            /* Force Colors */
            .text-slate-900 { color: #01040a !important; }
            .text-slate-500 { color: #64748b !important; }
            .text-slate-400 { color: #94a3b8 !important; }
            .text-blue-600 { color: #2563eb !important; display: inline-block !important; }
            .text-emerald-600 { color: #059669 !important; }
            
            .bg-slate-50 { background-color: #f8fafc !important; }
            
            /* Border Systems */
            .border-b-2 { border-bottom: 2px solid #0f172a !important; }
            .border-slate-50 { border-color: #f8fafc !important; }
            .border-slate-100 { border-color: #f1f5f9 !important; }
            .border { border: 1px solid #e2e8f0 !important; }
            
            /* Layout */
            .flex { display: flex !important; }
            .justify-between { justify-content: space-between !important; }
            .items-start { align-items: flex-start !important; }
            .grid { display: grid !important; }
            .grid-cols-2 { grid-template-columns: 1fr 1fr !important; }
            .gap-8 { gap: 32px !important; }
            .mb-10 { margin-bottom: 40px !important; }
            .mb-6 { margin-bottom: 24px !important; }
            .mt-1 { margin-top: 4px !important; }
            .mt-10 { margin-top: 40px !important; }
            .pb-8 { padding-bottom: 32px !important; }
            .p-5 { padding: 20px !important; }
            .py-4 { padding-top: 16px !important; padding-bottom: 16px !important; }
            .px-5 { padding-left: 20px !important; padding-right: 20px !important; }
            .rounded-2xl { border-radius: 16px !important; }
            .text-right { text-align: right !important; }
            .w-full { width: 100% !important; }
            .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            
            table { width: 100% !important; border-collapse: collapse !important; }
            th { text-align: left !important; background-color: #f8fafc !important; border-bottom: 2px solid #f1f5f9 !important; }
            td { border-bottom: 1px solid #f8fafc !important; }
            
            @media print {
              body { padding: 0 !important; width: 100% !important; }
              .invoice-shell { width: 100% !important; max-width: 100% !important; border: none !important; }
              .mt-10 { margin-top: 60px !important; } /* More room for footer */
            }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); }, 500);">
          <div class="invoice-shell">
            ${content.innerHTML}
          </div>
        </body>
      </html>
    `);
        win.document.close();
    };

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 font-outfit">
            <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-lg font-black text-slate-900">GST Tax Invoice</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Preview before printing</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const msg = `*NexPrint Tax Invoice - #${order.order_number?.slice(-8)}*\n\n` +
                                    `Shop: ${shop?.name}\n` +
                                    `Total Amount: ₹${order.total_amount}\n` +
                                    `Payment: ${order.payment_status?.toUpperCase()}\n\n` +
                                    `*Items:*\n` +
                                    (order.order_items || []).map((item: any) => `- ${item.file_name} (${item.total_pages}pgs): ₹${item.price}`).join('\n') +
                                    `\n\nDownload Digital Copy: ${window.location.origin}/dashboard/orders`;
                                window.open(`https://wa.me/${order.profiles?.phone?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                            }}
                            className="px-6 py-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                            WhatsApp Invoice
                        </button>
                        <button
                            onClick={handlePrint}
                            className="px-6 py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            🖨️ Print
                        </button>
                        <button
                            onClick={onClose}
                            className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:text-slate-900 transition-all"
                        >✕</button>
                    </div>
                </div>

                {/* Invoice Preview */}
                <div ref={printRef} className="p-10 bg-white">
                    <div className="invoice">
                        {/* Header */}
                        <div className="flex justify-between items-start mb-10 pb-8 border-b-2 border-slate-900">
                            <div>
                                <div className="text-3xl font-black tracking-tight text-slate-900">
                                    Nex<span className="text-blue-600">Print</span>
                                </div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                    {shop?.name || 'Print Shop'} • {shop?.city || ''}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold mt-1">{shop?.address || ''}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{shop?.phone || ''} | {shop?.email || ''}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tax Invoice</p>
                                <p className="text-2xl font-black text-blue-600 tracking-tight">#{order?.order_number?.slice(-8)}</p>
                                <p className="text-[10px] font-black text-slate-400 mt-1">{invoiceDate}</p>
                            </div>
                        </div>

                        {/* Billed To + Order Info */}
                        <div className="grid grid-cols-2 gap-8 mb-10">
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Billed To</p>
                                <p className="font-black text-slate-900 text-base">{order?.profiles?.full_name || 'Customer'}</p>
                                <p className="text-[11px] font-bold text-slate-500">{order?.profiles?.phone || ''}</p>
                                <p className="text-[11px] font-bold text-slate-500">{order?.profiles?.department || ''} {order?.profiles?.year ? `• Year ${order?.profiles?.year}` : ''}</p>
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Order Details</p>
                                <p className="text-[11px] font-bold text-slate-700">Payment: <span className="text-slate-900 font-black">{order?.payment_method?.replace(/_/g, ' ').toUpperCase() || 'N/A'}</span></p>
                                <p className="text-[11px] font-bold text-slate-700">Status: <span className="text-emerald-600 font-black">{order?.payment_status?.toUpperCase() || 'PENDING'}</span></p>
                                {rack && <p className="text-[11px] font-bold text-slate-700">Rack: <span className="text-blue-600 font-black">{rack.name}</span></p>}
                            </div>
                        </div>

                        {/* Items Table */}
                        <table className="w-full text-left mb-6">
                            <thead>
                                <tr className="bg-slate-50">
                                    <th className="py-4 px-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                    <th className="py-4 px-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Pages</th>
                                    <th className="py-4 px-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Copies</th>
                                    <th className="py-4 px-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(order?.order_items || []).map((item: any, i: number) => (
                                    <tr key={i} className="border-b border-slate-50">
                                        <td className="py-4 px-5">
                                            <p className="text-xs font-black text-slate-900 truncate max-w-[180px]">{item.file_name}</p>
                                            <p className="text-[9px] font-black text-slate-400 uppercase">{item.print_type} • {item.paper_size || 'A4'}</p>
                                        </td>
                                        <td className="py-4 px-5 text-xs font-black text-slate-700">{item.total_pages}</td>
                                        <td className="py-4 px-5 text-xs font-black text-slate-700">{item.copies}</td>
                                        <td className="py-4 px-5 text-sm font-black text-slate-900 text-right">₹{item.price || item.item_total || item.total_price || '0'}</td>
                                    </tr>
                                ))}
                                {order?.is_emergency && (
                                    <tr className="border-b border-amber-100 bg-amber-50/50">
                                        <td colSpan={3} className="py-4 px-5 text-[10px] font-black text-amber-700 uppercase tracking-widest">⚡ Priority/Emergency Surcharge</td>
                                        <td className="py-4 px-5 text-sm font-black text-amber-700 text-right">₹{shop?.settings?.pricing?.emergency_fee ?? 20}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* GST Breakdown */}
                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6">
                            <div className="flex justify-between text-[11px] font-bold text-slate-500 py-1">
                                <span>Base Amount (excl. GST)</span>
                                <span>₹{baseAmount}</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-bold text-slate-500 py-1">
                                <span>CGST @ {gstRate / 2}%</span>
                                <span>₹{(gstAmount / 2).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-[11px] font-bold text-slate-500 py-1 border-b border-slate-200 pb-3 mb-3">
                                <span>SGST @ {gstRate / 2}%</span>
                                <span>₹{(gstAmount / 2).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm font-black text-slate-900">
                                <span>Total (incl. GST)</span>
                                <span className="text-blue-600">₹{subtotal}</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest mt-10 pt-6 border-t border-slate-50">
                            Thank you for using NexPrint • This is a computer-generated invoice
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
