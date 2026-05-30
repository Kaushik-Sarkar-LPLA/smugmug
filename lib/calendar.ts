import { randomUUID } from 'crypto';
import { contact } from '@/lib/site-content';

export type CalendarInvite = {
  filename: string;
  ics: string;
};

function icsEscape(value: string) {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function formatIcsDateTimeLocal(parts: { y: number; m: number; d: number; hh: number; mm: number }) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${parts.y}${pad(parts.m)}${pad(parts.d)}T${pad(parts.hh)}${pad(parts.mm)}00`;
}

function formatIcsUtcStamp(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

export function parseDurationMinutes(label: string, fallbackMinutes = 120) {
  const lower = label.toLowerCase();
  const hourMatch = lower.match(/(\d+(?:\.\d+)?)\s*hour/);
  if (hourMatch) return Math.max(15, Math.round(parseFloat(hourMatch[1]) * 60));
  const minMatch = lower.match(/(\d+)\s*min/);
  if (minMatch) return Math.max(15, parseInt(minMatch[1], 10));
  const numeric = Number(label);
  if (Number.isFinite(numeric) && numeric > 0) return Math.round(numeric * 60);
  return fallbackMinutes;
}

export function resolveEventTimezone(area?: string) {
  if (area?.includes('(AZ)')) return 'America/Phoenix';
  return 'America/Chicago';
}

function addMinutes(parts: { y: number; m: number; d: number; hh: number; mm: number }, minutes: number) {
  const date = new Date(parts.y, parts.m - 1, parts.d, parts.hh, parts.mm, 0);
  date.setMinutes(date.getMinutes() + minutes);
  return {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    hh: date.getHours(),
    mm: date.getMinutes(),
  };
}

function parseDateParts(date: string, time?: string) {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return null;
  if (time) {
    const [hh, mm] = time.split(':').map(Number);
    if (Number.isFinite(hh) && Number.isFinite(mm)) return { y, m, d, hh, mm };
    return null;
  }
  return { y, m, d, hh: 10, mm: 0 };
}

export function buildCalendarInvite(opts: {
  summary: string;
  description: string;
  location: string;
  attendeeName: string;
  attendeeEmail: string;
  date: string;
  time?: string;
  durationMinutes: number;
  timezone?: string;
  filename?: string;
}): CalendarInvite | null {
  const start = parseDateParts(opts.date, opts.time);
  if (!start) return null;

  const timezone = opts.timezone || 'America/Chicago';
  const end = addMinutes(start, Math.max(15, opts.durationMinutes));
  const uid = `${randomUUID()}@pixilens.com`;
  const organizer = process.env.MS_GRAPH_SENDER || contact.email;

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pixilens Photography//Booking Forms//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatIcsUtcStamp()}`,
    `DTSTART;TZID=${timezone}:${formatIcsDateTimeLocal(start)}`,
    `DTEND;TZID=${timezone}:${formatIcsDateTimeLocal(end)}`,
    `SUMMARY:${icsEscape(opts.summary)}`,
    `DESCRIPTION:${icsEscape(opts.description)}`,
    `LOCATION:${icsEscape(opts.location)}`,
    `ORGANIZER;CN=Pixilens Photography:mailto:${organizer}`,
    `ATTENDEE;CN=${icsEscape(opts.attendeeName)};RSVP=TRUE:mailto:${opts.attendeeEmail}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return {
    filename: opts.filename || 'pixilens-event.ics',
    ics: `${lines.join('\r\n')}\r\n`,
  };
}
