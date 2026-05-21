import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    // Priority 1: Use Resend if API key is available (production)
    if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to,
            subject,
            html
        });
        console.log(`📧 Email sent via Resend to ${to}`);
        return;
    }

    // Priority 2: Fallback to SMTP (development)
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
            user: process.env.EMAIL_USER!,
            pass: process.env.EMAIL_PASS!
        }
    });

    await transporter.sendMail({
        from: '"Auth API" <noreply@authapi.com>',
        to,
        subject,
        html
    });
    console.log(`📧 Email sent via SMTP to ${to}`);
}