import nodemailer from 'nodemailer';
import { contact } from '@/lib/site-content';

export function htmlEscape(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function field(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim();
}

export function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.office365.com';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    requireTLS: true,
    auth: { user, pass },
  });
}

export function formatRows(rows: Array<[string, string]>) {
  return rows.map(([label, value]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eadfce;color:#7a5b23;font-weight:600;">${htmlEscape(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #eadfce;">${htmlEscape(value || 'Not provided')}</td></tr>`).join('');
}

export async function sendPixilensEmail({ toUser, userName, subject, text, html }: { toUser: string; userName: string; subject: string; text: string; html: string }) {
  const transporter = createTransporter();
  if (!transporter) return false;

  const from = process.env.SMTP_FROM || `Pixilens <${contact.email}>`;
  await transporter.sendMail({ from, to: contact.email, replyTo: toUser, subject, text, html });
  await transporter.sendMail({
    from,
    to: toUser,
    subject: 'Pixilens received your enquiry',
    text: `Hi ${userName},\n\nThank you for contacting Pixilens. We received your enquiry and will get back to you soon.\n\n${text}`,
    html: `<div style="font-family:Arial,sans-serif;color:#17130f;line-height:1.5;"><p>Hi ${htmlEscape(userName)},</p><p>Thank you for contacting Pixilens. We received your enquiry and will get back to you soon.</p>${html}</div>`,
  });
  return true;
}
