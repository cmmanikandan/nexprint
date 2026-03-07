import nodemailer from 'nodemailer';

/**
 * Shared NexPrint Email Utility
 * Uses Gmail SMTP with App Password
 * Credentials stored in .env.local
 */

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false, // TLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export interface EmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail(opts: EmailOptions) {
    const from = process.env.SMTP_FROM || `NexPrint <${process.env.SMTP_USER}>`;
    const info = await transporter.sendMail({
        from,
        to: Array.isArray(opts.to) ? opts.to.join(', ') : opts.to,
        subject: opts.subject,
        html: opts.html,
        text: opts.text,
    });
    return info;
}

/* ─── Preset Email Templates ──────────────────────────── */

export function orderConfirmationEmail(opts: {
    customerName: string;
    orderNumber: string;
    shopName: string;
    totalAmount: number;
    items: { fileName: string; pages: number; copies: number; price: number }[];
}) {
    return `
  <div style="font-family:Inter,sans-serif;background:#07070f;color:#fff;padding:40px;border-radius:16px;max-width:520px;margin:0 auto">
    <div style="text-align:center;margin-bottom:32px">
      <div style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:14px;padding:12px 18px;font-size:20px;font-weight:900;letter-spacing:-0.5px">NexPrint</div>
    </div>
    <h2 style="font-size:22px;font-weight:900;margin:0 0 6px">Order Confirmed ✅</h2>
    <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 28px">Hi ${opts.customerName}, your print job is queued!</p>
    
    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:20px">
      <p style="color:rgba(255,255,255,0.4);font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px">Order Number</p>
      <p style="font-size:22px;font-weight:900;color:#60a5fa;margin:0">${opts.orderNumber}</p>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      ${opts.items.map(i => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;color:rgba(255,255,255,0.7)">${i.fileName}</td>
        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:11px;color:rgba(255,255,255,0.4);text-align:center">${i.pages}pg × ${i.copies}</td>
        <td style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.05);font-size:12px;font-weight:700;text-align:right">₹${i.price.toFixed(2)}</td>
      </tr>`).join('')}
      <tr>
        <td colspan="2" style="padding:14px 0 0;font-size:13px;font-weight:900">Total</td>
        <td style="padding:14px 0 0;font-size:16px;font-weight:900;color:#34d399;text-align:right">₹${opts.totalAmount.toFixed(2)}</td>
      </tr>
    </table>

    <div style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:16px;font-size:12px;color:rgba(255,255,255,0.6)">
      📍 <strong style="color:#fff">${opts.shopName}</strong> will process your order shortly.
    </div>

    <p style="margin-top:32px;font-size:10px;color:rgba(255,255,255,0.2);text-align:center">© 2026 NexPrint Technology · Built in India 🇮🇳</p>
  </div>`;
}

export function orderStatusEmail(opts: {
    customerName: string;
    orderNumber: string;
    status: string;
    message: string;
}) {
    const statusColors: Record<string, string> = {
        shop_accepted: '#3b82f6',
        printing: '#f59e0b',
        ready_for_pickup: '#10b981',
        out_for_delivery: '#8b5cf6',
        completed: '#34d399',
        cancelled: '#ef4444',
    };
    const color = statusColors[opts.status] || '#6366f1';

    return `
  <div style="font-family:Inter,sans-serif;background:#07070f;color:#fff;padding:40px;border-radius:16px;max-width:520px;margin:0 auto">
    <div style="text-align:center;margin-bottom:32px">
      <div style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:14px;padding:12px 18px;font-size:20px;font-weight:900">NexPrint</div>
    </div>
    <h2 style="font-size:22px;font-weight:900;margin:0 0 6px">Order Update</h2>
    <p style="color:rgba(255,255,255,0.5);font-size:13px;margin:0 0 28px">Hi ${opts.customerName}, here's the latest on your order.</p>

    <div style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:16px">
      <p style="color:rgba(255,255,255,0.4);font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px;margin:0 0 4px">Order</p>
      <p style="font-size:18px;font-weight:900;color:#60a5fa;margin:0">${opts.orderNumber}</p>
    </div>

    <div style="border-left:3px solid ${color};padding:16px 20px;background:rgba(255,255,255,0.04);border-radius:0 12px 12px 0;margin-bottom:24px">
      <p style="font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:${color};margin:0 0 6px">${opts.status.replace(/_/g, ' ')}</p>
      <p style="font-size:13px;color:rgba(255,255,255,0.7);margin:0">${opts.message}</p>
    </div>

    <p style="margin-top:32px;font-size:10px;color:rgba(255,255,255,0.2);text-align:center">© 2026 NexPrint Technology · Built in India 🇮🇳</p>
  </div>`;
}
