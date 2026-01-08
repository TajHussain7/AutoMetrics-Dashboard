import { debug } from "./logger.js";

export async function sendVerificationEmail(
  to: string,
  otp: string,
  purpose: "email_verification" | "reset_password" = "email_verification"
) {
  const from =
    process.env.SMTP_FROM || process.env.ADMIN_EMAIL || "no-reply@example.com";

  // Use SMTP if configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT
    ? Number(process.env.SMTP_PORT)
    : undefined;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;

  const subject =
    purpose === "reset_password" ? "Password reset code" : "Verify your email";

  const html =
    purpose === "reset_password"
      ? `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Code</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Gradient Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 4px 0;">
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 48px 40px;">
              <!-- Icon Badge -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 16px; border-radius: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                      <span style="font-size: 32px;">🔒</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Title -->
              <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700; color: #0f172a; text-align: center; line-height: 1.2;">Password Reset Code</h1>
              
              <!-- Subtitle -->
              <p style="margin: 0 0 32px 0; font-size: 16px; color: #64748b; text-align: center; line-height: 1.6;">We received a request to reset your password. Use the code below to proceed.</p>
              
              <!-- OTP Code Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 32px 0;">
                    <div style="display: inline-block; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 20px 40px;">
                      <span style="font-size: 36px; font-weight: 700; color: #3b82f6; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Timer Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.6;">
                      <strong>⏰ Expires in 10 minutes</strong><br>
                      This code will expire soon for your security. If you didn't request this, please ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Footer Text -->
              <p style="margin: 0; font-size: 14px; color: #94a3b8; text-align: center; line-height: 1.6;">
                If you didn't request a password reset, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6;">
                © ${new Date().getFullYear()} <strong style="color: #0f172a;">Tajamal Hussain</strong>. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
      : `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verification</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <!-- Gradient Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 4px 0;">
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 48px 40px;">
              <!-- Icon Badge -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <div style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); padding: 16px; border-radius: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">
                      <span style="font-size: 32px;">✉️</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Title -->
              <h1 style="margin: 0 0 16px 0; font-size: 28px; font-weight: 700; color: #0f172a; text-align: center; line-height: 1.2;">Verify Your Email</h1>
              
              <!-- Subtitle -->
              <p style="margin: 0 0 32px 0; font-size: 16px; color: #64748b; text-align: center; line-height: 1.6;">Thank you for signing up! Please use the verification code below to complete your registration.</p>
              
              <!-- OTP Code Box -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 0 0 32px 0;">
                    <div style="display: inline-block; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%); border: 2px solid #3b82f6; border-radius: 12px; padding: 20px 40px;">
                      <span style="font-size: 36px; font-weight: 700; color: #3b82f6; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</span>
                    </div>
                  </td>
                </tr>
              </table>
              
              <!-- Timer Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 14px; color: #92400e; line-height: 1.6;">
                      <strong>⏰ Expires in 10 minutes</strong><br>
                      This code will expire soon for your security. If you didn't sign up for an account, please ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Footer Text -->
              <p style="margin: 0; font-size: 14px; color: #94a3b8; text-align: center; line-height: 1.6;">
                If you didn't create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.6;">
                © ${new Date().getFullYear()} <strong style="color: #0f172a;">Tajamal Hussain</strong>. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text =
    purpose === "reset_password"
      ? `Your password reset code is ${otp}. It expires in 10 minutes.`
      : `Your verification code is ${otp}. It expires in 10 minutes.`;

  if (smtpHost && smtpPort && smtpUser && smtpPass) {
    const nodemailer = (await import("nodemailer")).default as any;

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      connectionTimeout: 10000, // 10 seconds timeout
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    try {
      // Add a race condition with timeout
      const sendPromise = transporter.sendMail({
        from,
        to,
        subject,
        text,
        html,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error("Email sending timeout after 10 seconds")),
          10000
        )
      );

      const info = await Promise.race([sendPromise, timeoutPromise]);
      debug("SMTP send result:", {
        messageId: info.messageId,
        envelope: info.envelope,
      });
      return { provider: "smtp", messageId: info.messageId };
    } catch (err) {
      console.error("Failed to send verification email via SMTP:", err);
      throw err;
    }
  }

  const err = new Error(
    "No email provider configured: set SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS. "
  );
  console.error(err.message);
  throw err;
}
