import { t } from './i18n.js';
import { tm, dShort, money, toHome, toLocal, nameOf, TYPE_TO_CAT, addDays, zonedMs, cityOf, durationLabel } from './util.js';

export const isStay = (it) => it.type === 'hotel';
export const tripTz = (trip) => (trip && trip.timezone) || 'Asia/Bangkok';

// Last day an item runs into. Items can span days (overnight train, long-haul flight).
// Older items with an end time before the start time are treated as ending the next day.
export const endDateOf = (it) => {
  if (isStay(it)) return it.endDate || it.date;
  if (it.endDate && it.endDate >= it.date) return it.endDate;
  if (!it.allDay && it.end && it.start && tm(it.end) < tm(it.start)) return addDays(it.date, 1);
  return it.date;
};
export const startTzOf = (it, trip) => it.startTz || tripTz(trip);
export const endTzOf = (it, trip) => it.endTz || it.startTz || tripTz(trip);

// Absolute start and end (ms), taking each end's own time zone into account.
export const startMs = (it, trip) => zonedMs(it.date, it.allDay ? '00:00' : it.start, startTzOf(it, trip));
export const endMs = (it, trip) => {
  const s = startMs(it, trip);
  if (it.allDay) return zonedMs(addDays(endDateOf(it), 1), '00:00', endTzOf(it, trip));
  const e = zonedMs(endDateOf(it), it.end || it.start, endTzOf(it, trip));
  return e > s ? e : s + 30 * 60000;
};

export const dayItems = (items, date) => items.filter((it) => !isStay(it) && it.date <= date && date <= endDateOf(it));

// The part of an item that falls on one calendar day, in minutes from midnight (local wall-clock times).
export const segment = (it, date) => {
  const last = endDateOf(it);
  const first = date === it.date;
  const isLast = date === last;
  const st = first ? tm(it.start) : 0;
  let en = isLast ? tm(it.end || it.start) : 1440;
  if (en <= st) en = Math.min(st + 30, 1440);
  return { st, en, first, last: isLast, multi: it.date !== last };
};

const zoneNote = (it, trip, which) => {
  const tz = which === 'start' ? startTzOf(it, trip) : endTzOf(it, trip);
  const differs = startTzOf(it, trip) !== endTzOf(it, trip) || tz !== tripTz(trip);
  return differs ? ' ' + cityOf(tz) : '';
};

// Which stay covers the night of `date`, and which one checks out that morning.
export const staysFor = (items, date) => {
  const stays = items.filter(isStay);
  const night = stays.find((s) => s.date <= date && date < (s.endDate || s.date));
  const out = stays.find((s) => s.endDate === date && s !== night);
  return { night, out };
};

export const bandText = (items, date) => {
  const { night, out } = staysFor(items, date);
  const outText = (o) => (o.end ? t('Check out {name} by {time}', { name: o.title, time: o.end }) : t('Check out {name}', { name: o.title }));
  const inText = (n) => (n.start ? t('{name} from {time}', { name: n.title, time: n.start }) : n.title);
  if (night && out) return outText(out) + ' · ' + inText(night);
  if (night && night.date === date) return night.start ? t('Check in at {name} from {time}', { name: night.title, time: night.start }) : t('Check in at {name}', { name: night.title });
  if (night) return t('Staying at {name}', { name: night.title });
  if (out) return outText(out);
  return t('No stay added for tonight');
};

export const dayLabel = (days, date) => {
  const i = days.indexOf(date);
  return (i >= 0 ? t('Day {n}', { n: i + 1 }) + ' · ' : '') + dShort(date);
};

export const timeLabel = (it, trip) => {
  if (isStay(it)) return t('{from} to {to}', { from: dShort(it.date), to: dShort(it.endDate || it.date) });
  const last = endDateOf(it);
  if (it.allDay) return last !== it.date ? t('{from} to {to}', { from: dShort(it.date), to: dShort(last) }) : t('All day');
  const zoned = it.startTz || it.endTz;
  if (last === it.date && !zoned) return it.start + (it.end && it.end !== it.start ? '–' + it.end : '');
  const a = it.start + zoneNote(it, trip, 'start');
  const b = (last !== it.date ? dShort(last) + ' ' : '') + (it.end || it.start) + zoneNote(it, trip, 'end');
  return a + ' → ' + b;
};

// Short label for the block on one day of the itinerary grid.
export const segmentLabel = (it, date, trip) => {
  const seg = segment(it, date);
  if (!seg.multi) return timeLabel(it, trip);
  if (seg.first) return t('{time} → {day}', { time: it.start + zoneNote(it, trip, 'start'), day: dShort(endDateOf(it)) });
  if (seg.last) return t('arrives {time}', { time: (it.end || it.start) + zoneNote(it, trip, 'end') });
  return t('continues');
};

// "11 h 30 min", only for items that cross days or time zones.
export const durationText = (it, trip) => {
  if (isStay(it) || it.allDay) return '';
  if (endDateOf(it) === it.date && !it.startTz && !it.endTz) return '';
  return durationLabel(endMs(it, trip) - startMs(it, trip));
};

export const costText = (it, trip) => {
  if (!it.price) return t('No cost added');
  const local = trip.localCurrency || 'THB';
  const home = trip.homeCurrency || 'EUR';
  const main = money(it.price, it.cur);
  const other = it.cur === home ? money(toLocal(it.price, it.cur, trip), local) : money(toHome(it.price, it.cur, trip), home);
  const split = it.split === 'payer' ? t('not split') : t('split equally');
  return main + ' (≈ ' + other + ') · ' + t('paid by {name}', { name: nameOf(trip, it.paidBy) }) + ', ' + split;
};

// All expenses: priced itinerary items plus ones added by hand.
export const allExpenses = (items, expenses, trip, nowKey) => {
  const list = [];
  items.forEach((it) => {
    if (!it.price) return;
    list.push({
      key: 'i' + it.id, src: 'itinerary', itemId: it.id, title: it.title, amount: it.price, cur: it.cur,
      cat: TYPE_TO_CAT[it.type] || 'other', type: it.type, date: it.date, paidBy: it.paidBy, split: it.split || 'half',
      planned: (it.date + ' ' + (it.start || '00:00')) > nowKey
    });
  });
  expenses.forEach((e) => list.push({ key: 'e' + e.id, src: 'manual', id: e.id, ...e, planned: false }));
  list.forEach((e) => { e.home = toHome(e.amount, e.cur, trip); });
  return list;
};

// Positive = this person is owed money. Shared costs are split equally between the members.
export const balances = (list, members) => {
  const bal = {};
  const paid = {};
  members.forEach((m) => { bal[m] = 0; paid[m] = 0; });
  list.forEach((e) => {
    if (!(e.paidBy in bal)) return;
    if (e.split === 'transfer') {
      if (e.to in bal) { bal[e.paidBy] += e.home; bal[e.to] -= e.home; }
      return;
    }
    paid[e.paidBy] += e.home;
    if (e.split === 'payer') return;
    const share = e.home / members.length;
    members.forEach((m) => { bal[m] -= share; });
    bal[e.paidBy] += e.home;
  });
  return { bal, paid };
};

export const sortByTime = (a, b) => String(a.date).localeCompare(String(b.date)) || tm(a.start) - tm(b.start);
