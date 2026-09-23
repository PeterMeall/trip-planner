import { addDays, tm } from './util.js';

// Builds an .ics calendar file that Google Calendar (and Apple Calendar) can import.
const esc = (s) => String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
const d8 = (d) => d.replace(/-/g, '');
const t6 = (t) => t.replace(':', '') + '00';
const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');

// Long lines must be folded at 75 octets.
const fold = (line) => {
  const out = [];
  let rest = line;
  while (rest.length > 74) { out.push(rest.slice(0, 74)); rest = ' ' + rest.slice(74); }
  out.push(rest);
  return out.join('\r\n');
};

export function buildIcs(trip, items) {
  const tz = trip.timezone || 'Asia/Bangkok';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Chiabel Travels//EN', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:' + esc(trip.name), 'X-WR-TIMEZONE:' + tz];
  items.forEach((it) => {
    lines.push('BEGIN:VEVENT', 'UID:' + it.id + '@trip-planner', 'DTSTAMP:' + stamp());
    if (it.type === 'hotel') {
      lines.push('DTSTART;VALUE=DATE:' + d8(it.date), 'DTEND;VALUE=DATE:' + d8(it.endDate || addDays(it.date, 1)), 'SUMMARY:' + esc('Stay: ' + it.title));
    } else if (it.allDay || !it.start) {
      lines.push('DTSTART;VALUE=DATE:' + d8(it.date), 'DTEND;VALUE=DATE:' + d8(addDays(it.date, 1)), 'SUMMARY:' + esc(it.title));
    } else {
      let endDate = it.date;
      let end = it.end || it.start;
      if (tm(end) <= tm(it.start)) { if (it.end) endDate = addDays(it.date, 1); else end = it.start; }
      lines.push('DTSTART;TZID=' + tz + ':' + d8(it.date) + 'T' + t6(it.start), 'DTEND;TZID=' + tz + ':' + d8(endDate) + 'T' + t6(end), 'SUMMARY:' + esc(it.title));
    }
    if (it.place) lines.push('LOCATION:' + esc(it.place));
    const desc = [it.ref ? 'Booking ref: ' + it.ref : '', it.note || ''].filter(Boolean).join('\n');
    if (desc) lines.push('DESCRIPTION:' + esc(desc));
    lines.push('END:VEVENT');
  });
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

export function downloadIcs(trip, items) {
  const blob = new Blob([buildIcs(trip, items)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (trip.name || 'trip').replace(/[^\w-]+/g, '-').toLowerCase() + '.ics';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
