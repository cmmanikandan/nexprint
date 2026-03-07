import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
    return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
    try {
        const { email, full_name, role, phone, shop_id, password } = await req.json();

        if (!email || !full_name || !role) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400, headers: corsHeaders });
        }

        // 1. Create the user in Auth with password if provided
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name, role }
        });

        if (authError) throw authError;

        const userId = authUser.user.id;

        // 2. Upsert the profile (works even if trigger hasn't fired yet)
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: userId,
                email,
                full_name,
                role,
                phone,
                is_onboarded: true
            });

        if (profileError) throw profileError;

        // 3. If it's a staff member, add them to shop_staff
        if (role === 'staff' && shop_id) {
            const { error: staffError } = await supabaseAdmin
                .from('shop_staff')
                .insert({
                    user_id: userId,
                    shop_id,
                    full_name,
                    role: 'Assistant',
                    phone,
                    status: 'offline'
                });
            if (staffError) throw staffError;
        }

        // 4. Send Welcome Email (non-blocking — app works even if SMTP not configured)
        try {
            if (process.env.SMTP_HOST && process.env.SMTP_USER) {
                const nodemailer = await import('nodemailer');
                const transporter = nodemailer.default.createTransport({
                    host: process.env.SMTP_HOST,
                    port: Number(process.env.SMTP_PORT || 587),
                    secure: false,
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS,
                    },
                });

                const dashboardUrl = role === 'delivery_partner'
                    ? 'http://localhost:3003/delivery-hub'
                    : 'http://localhost:3001';

                await transporter.sendMail({
                    from: process.env.SMTP_FROM || process.env.SMTP_USER,
                    to: email,
                    subject: `Welcome to NexPrint — Your Account`,
                    html: `
                        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px;">
                            <h1 style="color:#1e293b;font-size:22px;font-weight:800;">Welcome to NexPrint!</h1>
                            <p style="color:#64748b;font-size:15px;line-height:1.6;">
                                Hi <strong>${full_name}</strong>, your <strong>${role.replace('_', ' ')}</strong> account is ready.
                                ${password ? `<br><br>🔑 Password: <strong style="color:#1e293b;">${password}</strong>` : ''}
                            </p>
                            <a href="${dashboardUrl}" style="display:inline-block;background:#2563eb;color:white;padding:12px 28px;font-weight:700;text-decoration:none;border-radius:10px;margin-top:16px;">
                                Open Dashboard →
                            </a>
                        </div>
                    `,
                });
            }
        } catch (emailErr) {
            console.warn('Email send failed (non-critical):', emailErr);
        }

        return NextResponse.json({ success: true, userId }, { headers: corsHeaders });
    } catch (error: any) {
        console.error('Create user error:', error);
        return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500, headers: corsHeaders });
    }
}
