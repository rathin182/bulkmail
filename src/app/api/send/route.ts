import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { to, subject, from, clientName } = await req.json();

    if (!from || !to) {
      return NextResponse.json({ message: 'Missing required fields: to, from', success: false }, { status: 400 });
    }

    const orderUrl = process.env.ORDER_URL || '#';
    const companyName = process.env.COMPANY_NAME || 'Our Team';

    const safeClientName =
      !clientName ||
        clientName.trim().toLowerCase() === "unknown"
        ? "there"
        : clientName.trim();

    const htmlContent = `
<div style="font-family: Arial, sans-serif; background:#f6f6f6; padding:20px;">
  <table width="100%" cellspacing="0" cellpadding="0" style="max-width:650px;margin:auto;background:#ffffff;border-radius:8px;overflow:hidden;">

    <!-- HEADER -->
    <tr>
      <td style="background:#111;color:#fff;padding:25px;text-align:center;">
        <h1 style="margin:0;font-size:28px;">Backlink Bundle 🚀</h1>
        <p style="margin:10px 0 0;font-size:15px;">
          Long-Term SEO Growth • Real Backlinks • Real Results
        </p>
      </td>
    </tr>

    <!-- INTRO -->
    <tr>
      <td style="padding:30px;">
        <h2 style="margin-top:0;">Hello ${safeClientName},</h2>

        <p style="font-size:16px;color:#333;">
          Struggling to get backlinks that actually improve rankings?
          Most SEO services sell spam links that Google ignores.
        </p>

        <p style="font-size:16px;color:#333;">
          We created a <strong>content-driven backlink strategy</strong> designed for
          businesses that want <strong>real SEO growth</strong> — not shortcuts.
        </p>

        <hr style="border:none;border-top:1px solid #eee;margin:25px 0;" />

        <h3 style="margin-bottom:10px;">🔥 What You Get (One-Time $249)</h3>

        <ul style="padding-left:18px;color:#333;line-height:1.8;">
          <li>✍️ 4 SEO-Optimized Blog Posts (published weekly)</li>
          <li>🔗 DoFollow Backlinks from Real Websites (DR 17–31)</li>
          <li>⭐ Bonus DR 60+ Authority Backlinks</li>
          <li>📈 100% Google Indexed Content</li>
          <li>🧠 White-Hat SEO Strategy (Safe for Long-Term Growth)</li>
          <li>📊 Detailed Reporting & Progress Tracking</li>
        </ul>

        <hr style="border:none;border-top:1px solid #eee;margin:25px 0;" />

        <h3 style="margin-bottom:10px;">💡 Who Is This Perfect For?</h3>

        <p style="color:#333;line-height:1.7;">
          Small businesses, agencies, startups, local services, and entrepreneurs
          who want stronger Google visibility without paying monthly SEO retainers.
        </p>

        <h3 style="margin-bottom:10px;">📈 Why This Works</h3>

        <p style="color:#333;line-height:1.7;">
          Instead of random backlinks, your brand gets a dedicated content category
          across multiple websites — building topical authority and natural link growth.
        </p>

        <!-- CTA BUTTON -->
        <div style="text-align:center;margin:35px 0;">
          <a href="${orderUrl}" target="_blank"
             style="background:#111;color:#fff;text-decoration:none;padding:14px 28px;
             border-radius:6px;font-size:16px;font-weight:bold;display:inline-block;">
             Get Backlink Bundle – $249
          </a>
        </div>

        <p style="color:#555;font-size:14px;line-height:1.6;">
          ✅ One-time payment<br/>
          ✅ No monthly fees<br/>
          ✅ 60-Day Money Back Guarantee
        </p>

        <p style="margin-top:25px;color:#333;">
          Have questions? Just reply to this email — we usually respond within 24 hours.
        </p>

        <p style="margin-top:25px;">
          Regards,<br/>
          <strong>${companyName}</strong>
        </p>

      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="background:#fafafa;padding:15px;text-align:center;font-size:12px;color:#777;">
        You received this email because you showed interest in SEO growth solutions.
      </td>
    </tr>

  </table>
</div>
`;

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
      text: `Hello ${clientName || 'there'}, please view this email in HTML format.`,
      html: htmlContent,
    });

    console.log("Message sent: %s", info.messageId);
    return NextResponse.json({ message: 'Email sent', id: info.messageId, success: true });

  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ message: 'Error sending email', error: String(error), success: false }, { status: 500 });
  }
}
