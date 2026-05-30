import { contact } from '@/lib/site-content';
import type { CalendarInvite } from '@/lib/calendar';

export type { CalendarInvite };

export function htmlEscape(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function field(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim();
}

export function formatRows(rows: Array<[string, string]>) {
  return rows.map(([label, value]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #eadfce;color:#7a5b23;font-weight:600;">${htmlEscape(label)}</td><td style="padding:8px 12px;border-bottom:1px solid #eadfce;">${htmlEscape(value || 'Not provided')}</td></tr>`).join('');
}

async function graphAccessToken() {
  const tenantId = process.env.MS_GRAPH_TENANT_ID;
  const clientId = process.env.MS_GRAPH_CLIENT_ID;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET;
  if (!tenantId || !clientId || !clientSecret) return null;

  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) throw new Error(`Microsoft Graph token request failed: ${response.status}`);
  const body = await response.json() as { access_token?: string };
  if (!body.access_token) throw new Error('Microsoft Graph token response did not include an access token');
  return body.access_token;
}

type GraphAttachment = {
  '@odata.type': '#microsoft.graph.fileAttachment';
  name: string;
  contentType: string;
  contentBytes: string;
};

async function sendGraphMessage(
  accessToken: string,
  sender: string,
  message: { to: string; subject: string; text: string; html: string; replyTo?: string; attachments?: GraphAttachment[] },
) {
  const response = await fetch(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(sender)}/sendMail`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        subject: message.subject,
        body: {
          contentType: 'HTML',
          content: message.html,
        },
        toRecipients: [{ emailAddress: { address: message.to } }],
        replyTo: message.replyTo ? [{ emailAddress: { address: message.replyTo } }] : undefined,
        attachments: message.attachments?.length ? message.attachments : undefined,
      },
      saveToSentItems: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Microsoft Graph sendMail failed: ${response.status} ${errorText.slice(0, 500)}`);
  }
}

export async function sendPixilensEmail({
  toUser,
  userName,
  subject,
  text,
  html,
  calendarInvite,
}: {
  toUser: string;
  userName: string;
  subject: string;
  text: string;
  html: string;
  calendarInvite?: CalendarInvite | null;
}) {
  const sender = process.env.MS_GRAPH_SENDER || contact.email;
  const accessToken = await graphAccessToken();
  if (!accessToken) return false;

  const attachments = calendarInvite
    ? [{
        '@odata.type': '#microsoft.graph.fileAttachment' as const,
        name: calendarInvite.filename,
        contentType: 'text/calendar; charset=utf-8',
        contentBytes: Buffer.from(calendarInvite.ics, 'utf8').toString('base64'),
      }]
    : undefined;

  const calendarNote = calendarInvite
    ? '<p>A calendar invite is attached so you can add this event to your calendar.</p>'
    : '';

  await sendGraphMessage(accessToken, sender, { to: contact.email, replyTo: toUser, subject, text, html, attachments });
  await sendGraphMessage(accessToken, sender, {
    to: toUser,
    subject: 'Pixilens received your enquiry',
    text: `Hi ${userName},\n\nThank you for contacting Pixilens. We received your enquiry and will get back to you soon.${calendarInvite ? '\n\nA calendar invite is attached to this email.' : ''}\n\n${text}`,
    html: `<div style="font-family:Arial,sans-serif;color:#17130f;line-height:1.5;"><p>Hi ${htmlEscape(userName)},</p><p>Thank you for contacting Pixilens. We received your enquiry and will get back to you soon.</p>${calendarNote}${html}</div>`,
    attachments,
  });
  return true;
}
