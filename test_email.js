/**
 * Test Gmail SMTP connection for NexPrint
 * Run: node test_email.js
 */

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'manikandanprabhu37@gmail.com',
        pass: 'gvxcptogpvnuoiqe',
    },
});

async function main() {
    console.log('\n===========================================');
    console.log('  NexPrint — Gmail SMTP Test');
    console.log('===========================================\n');

    console.log('📡 Verifying SMTP connection...');
    try {
        await transporter.verify();
        console.log('  ✅ SMTP Connected! Gmail App Password is working.\n');
    } catch (err) {
        console.error('  ❌ SMTP Connection Failed:', err.message);
        process.exit(1);
    }

    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
        from: '"NexPrint" <manikandanprabhu37@gmail.com>',
        to: 'manikandanprabhu37@gmail.com',
        subject: '✅ NexPrint SMTP Test — Working!',
        html: `
      <div style="font-family:Inter,sans-serif;background:#07070f;color:#fff;padding:40px;border-radius:16px;max-width:500px;margin:0 auto">
        <div style="text-align:center;margin-bottom:24px">
          <div style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#6366f1);border-radius:14px;padding:12px 18px;font-size:20px;font-weight:900">NexPrint</div>
        </div>
        <h2 style="font-size:22px;font-weight:900;color:#34d399">✅ Email System Working!</h2>
        <p style="color:rgba(255,255,255,0.6);font-size:14px;">
          Your Gmail SMTP is configured correctly. NexPrint can now send:
        </p>
        <ul style="color:rgba(255,255,255,0.5);font-size:13px;line-height:2">
          <li>📦 Order confirmation emails</li>
          <li>🔔 Order status notifications</li>
          <li>🔐 Password reset links</li>
          <li>📊 Admin reports</li>
        </ul>
        <p style="color:rgba(255,255,255,0.2);font-size:10px;margin-top:32px;text-align:center">
          © 2026 NexPrint Technology · Built in India 🇮🇳
        </p>
      </div>
    `,
    });

    console.log('  ✅ Email sent!');
    console.log('  Message ID:', info.messageId);
    console.log('\n===========================================');
    console.log('  SMTP is configured! Check your inbox.');
    console.log('===========================================\n');
    console.log('SMTP Settings saved to:');
    console.log('  • apps/user-web/.env.local');
    console.log('  • apps/print-shop-admin/.env.local\n');
    console.log('Next step: Also configure in Supabase Dashboard:');
    console.log('  https://supabase.com/dashboard/project/kivyrwxshajdpfgxxtwf/settings/auth');
    console.log('  → Auth > SMTP Settings');
    console.log('  → Host:  smtp.gmail.com');
    console.log('  → Port:  587');
    console.log('  → User:  manikandanprabhu37@gmail.com');
    console.log('  → Pass:  gvxcptogpvnuoiqe\n');
}

main().catch(console.error);
