import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
    try {
        const { to, subject, text, from } = await req.json();

        if (!from || !to) {
            return NextResponse.json({ message: 'Missing required fields: to, from', success: false }, { status: 400 });
        }

        let user = '';
        let pass = '';

        // Select credentials based on the sender email
        // We compare the 'from' address with the configured env variables.
        // It's safer to trim and lowercase for comparison to avoid mismatches.
        const senderEmail = from.trim();
        const emailOne = process.env.NEXT_PUBLIC_EMAIL_ONE?.trim();
        const emailTwo = process.env.NEXT_PUBLIC_EMAIL_TWO?.trim();

        if (emailOne && senderEmail.toLowerCase() === emailOne.toLowerCase()) {
            user = emailOne;
            pass = process.env.EMAIL_ONE_PASS || '';
        } else if (emailTwo && senderEmail.toLowerCase() === emailTwo.toLowerCase()) {
            user = emailTwo;
            pass = process.env.EMAIL_TWO_PASS || '';
        } else {
            // Fallback or error if the sender is not recognized/authorized
            // For now, we can check if generic SMTP_USER is set, otherwise fail.
            if (process.env.SMTP_USER && process.env.SMTP_PASS) {
                user = process.env.SMTP_USER;
                pass = process.env.SMTP_PASS;
            } else {
                return NextResponse.json({
                    message: 'Unauthorized sender or missing credentials for this email address',
                    success: false
                }, { status: 401 });
            }
        }

        if (!user || !pass) {
            console.log("missing", user, pass);
            
            return NextResponse.json({
                message: 'Missing credentials for the selected sender',
                success: false
            }, { status: 500 });
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com', // Default to gmail if not set, but user should set it
            port: parseInt(process.env.SMTP_PORT || '465'),
            secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT || '465') === 465,
            auth: {
                user: user,
                pass: pass,
            },
        });

        // Verify connection configuration
        try {
            await transporter.verify();
            console.log("Transporter verification successful for user:", user);
        } catch (verifyError) {
            console.error("Transporter verification failed:", verifyError);
            return NextResponse.json({
                message: 'Failed to authenticate with mail server',
                error: String(verifyError),
                success: false
            }, { status: 500 });
        }

        const info = await transporter.sendMail({
            from: `"${user}" <${user}>`, // Ensure the from header matches the authenticated user to avoid spam issues
            to,
            subject,
            text,
            // html: "<b>Hello world?</b>", // html body
        });

        console.log("Message sent: %s", info.messageId);
        return NextResponse.json({ message: 'Email sent', id: info.messageId, success: true });

    } catch (error) {
        console.error("Error sending email:", error);
        return NextResponse.json({ message: 'Error sending email', error: String(error), success: false }, { status: 500 });
    }
}
