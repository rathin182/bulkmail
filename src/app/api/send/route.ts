import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const { to, subject, text, from } = await req.json();

        // Create a transporter using environment variables
        // In a real scenario, you would use a specific service like SendGrid, Mailgun, or Gmail
        // For this example, we'll try to use a generic SMTP configuration if provided, 
        // otherwise we might need to mock success if no creds are present to show the UI flow.

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.example.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER || 'user',
                pass: process.env.SMTP_PASS || 'pass',
            },
        });

        // If we are in a dev environment without real credentials, we might want to mock the send
        // to allow the user to see the UI progress.
        if (!process.env.SMTP_HOST) {
            console.log(`[MOCK SEND] From: ${from}, To: ${to}, Subject: ${subject}`);
            // Simulate a delay
            await new Promise(resolve => setTimeout(resolve, 500));
            return NextResponse.json({ message: 'Email sent (mocked)', success: true });
        }

        const info = await transporter.sendMail({
            from, // sender address
            to, // list of receivers
            subject, // Subject line
            text, // plain text body
            // html: "<b>Hello world?</b>", // html body
        });

        console.log("Message sent: %s", info.messageId);
        return NextResponse.json({ message: 'Email sent', id: info.messageId, success: true });

    } catch (error) {
        console.error("Error sending email:", error);
        return NextResponse.json({ message: 'Error sending email', error: String(error), success: false }, { status: 500 });
    }
}
