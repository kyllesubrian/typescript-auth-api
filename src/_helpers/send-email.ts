import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    // Production on Render - use Resend
    if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: [to],
            subject: subject,
            html: html
        });
        return;
    }
    
    // Local development - Ethereal for email testing 
    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: 'kian94@ethereal.email',
            pass: '2D35cKVATRR7pw1R27'
        }
    });
    
    await transporter.sendMail({
        from: "Auth API <noreply@authapi.com>",
        to: to,
        subject: subject,
        html: html
    });
}