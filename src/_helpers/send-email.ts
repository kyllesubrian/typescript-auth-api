import nodemailer from 'nodemailer';
import config from '../../config.json';

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    const transporter = nodemailer.createTransport(config.email);

    await transporter.sendMail({
        from: '"Auth API" <noreply@authapi.com>',
        to,
        subject,
        html
    });
}