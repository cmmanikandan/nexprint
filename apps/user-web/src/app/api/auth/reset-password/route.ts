import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'
);

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email || typeof email !== 'string') {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        // 1. Generate the reset link using Supabase Admin
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'recovery',
            email: normalizedEmail,
            options: {
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin}/auth/reset-password`
            }
        });

        if (error) throw error;

        const resetLink = data.properties.action_link;

        if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.SMTP_FROM) {
            return NextResponse.json({ error: 'SMTP is not fully configured' }, { status: 500 });
        }

        // 2. Setup Nodemailer with Gmail SMTP
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT),
            secure: false, // true for 465, false for 587
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        // 3. Send the email
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: normalizedEmail,
            subject: 'Reset Your NexPrint Password',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded-lg: 12px;">
                    <h1 style="color: #1e293b; font-size: 24px; font-weight: 800; margin-bottom: 16px;">Reset Your Password</h1>
                    <p style="color: #64748b; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                        We received a request to reset your password for your NexPrint account. Click the button below to set a new password.
                    </p>
                    <a href="${resetLink}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; font-weight: 700; text-decoration: none; border-radius: 8px;">
                        Reset Password
                    </a>
                    <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">
                        If you didn't request this, you can safely ignore this email. This link will expire in 24 hours.
                    </p>
                </div>
            `,
        });

        return NextResponse.json({ message: 'Reset email sent successfully' });
    } catch (error: unknown) {
        console.error('Reset password error:', error);
        const message = error instanceof Error ? error.message : 'Failed to send reset email';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
