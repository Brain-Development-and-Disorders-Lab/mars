import { EmailClient } from "@azure/communication-email";

// Email configuration
const client = new EmailClient(process.env.AZURE_COMMUNICATION_CONNECTION_STRING!);
const FROM_ADDRESS = process.env.EMAIL_FROM_ADDRESS!;

// Content variables
const BRAND_COLOR = "#2E3192";
const YEAR = new Date().getFullYear();

/**
 * Wraps content in the standard Metadatify email chrome (header, footer, border).
 */
const buildEmail = (body: string): string => `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e4e4e7;border-radius:8px;overflow:hidden;">
          <tr>
            <td style="background-color:#ffffff;padding:24px 32px;border-bottom:1px solid #e4e4e7;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding-right:10px;vertical-align:middle;">
                    <img src="https://app.metadatify.com/Favicon.png" width="24" height="24" alt="Metadatify" style="display:block;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;color:${BRAND_COLOR};font-size:18px;font-weight:500;letter-spacing:-0.3px;">Metadatify</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">${body}</td>
          </tr>
          <tr>
            <td style="background-color:#fafafa;border-top:1px solid #e4e4e7;padding:16px 32px;">
              <p style="margin:0;font-size:11px;color:#a1a1aa;">&copy; ${YEAR} Metadatify</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/**
 * Renders a CTA button.
 */
const ctaButton = (label: string, url: string): string => `
  <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr>
      <td style="background-color:${BRAND_COLOR};border-radius:6px;">
        <a href="${url}" style="display:inline-block;padding:10px 24px;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;">${label}</a>
      </td>
    </tr>
  </table>`;

/**
 * Renders a horizontal divider.
 */
const divider = (): string => `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
    <tr><td style="border-top:1px solid #e4e4e7;"></td></tr>
  </table>`;

export const templates = {
  resetPassword: (name: string, url: string): string =>
    buildEmail(`
      <p style="margin:0 0 8px;font-size:22px;font-weight:600;color:#18181b;">Reset your password</p>
      <p style="margin:0 0 24px;font-size:13px;color:#71717a;">Hi ${name}, we received a request to reset your password.</p>
      <p style="margin:0 0 24px;font-size:13px;color:#52525b;line-height:1.6;">Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.</p>
      ${ctaButton("Reset password", url)}
      <p style="margin:0 0 4px;font-size:11px;color:#a1a1aa;">Or copy this link into your browser:</p>
      <p style="margin:0 0 24px;font-size:11px;color:${BRAND_COLOR};word-break:break-all;">${url}</p>
      ${divider()}
      <p style="margin:0;font-size:12px;color:#a1a1aa;">If you didn't request a password reset, you can safely ignore this email.</p>
    `),
};

export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  const message = {
    senderAddress: FROM_ADDRESS,
    recipients: { to: [{ address: to }] },
    content: { subject, html },
  };

  const poller = await client.beginSend(message);
  await poller.pollUntilDone();
};
