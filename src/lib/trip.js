import { tm, dShort, money, toHome, toLocal, nameOf, TYPE_TO_CAT } from './util.js';

export const isStay = (it) => it.type === 'hotel';
export const dayItems = (items, date) => items.filter((it) => !isStay(it) && it.date === date);

// Which stay covers the night of `date`, and which one checks out that morning.
export const staysFor = (items, date) => {
  const stays = items.filter(isStay);
  const night = stays.find((s) => s.date <= date && date < (s.endDate || s.date));
  const out = stays.find((s) => s.endDate === date && s !== night);
  return { night, out };
};

export const bandText = (items, date) => {
  const { night, out } = staysFor(items, date);
  if (night && out) return 'Check out ' + out.title + (out.end ? ' by ' + out.end : '') + ' · ' + night.title + (night.start ? ' from ' + night.start : '');
  if (night && night.date === date) return 'Check in at ' + night.title + (night.start ? ' from ' + night.start : '');
  if (night) return 'Staying at ' + night.title;
  if (out) return 'Check out ' + out.title + (out.end ? ' by ' + out.end : '');
  return 'No stay added for tonight';
};

export const dayLabel = (days, date) => {
  const i = days.indexOf(date);
  return (i >= 0 ? 'Day ' + (i + 1) + ' · ' : '') + dShort(date);
};

export const timeLabel = (it) => {
  if (isStay(it)) return dShort(it.date) + ' to ' + dShort(it.endDate || it.date);
  if (it.allDay) return 'All day';
  return it.start + (it.end && it.end !== it.start ? '–' + it.end : '');
};

export const costText = (it, trip) => {
  if (!it.price) return 'No cost added';
  const local = trip.localCurrency || 'THB';
  const home = trip.homeCurrency || 'EUR';
  const main = money(it.price, it.cur);
  const other = it.cur === home ? money(toLocal(it.price, it.cur, trip), local) : money(toHome(it.price, it.cur, trip), home);
  const split = it.split === 'payer' ? 'not split' : 'split equally';
  return main + ' (≈ ' + other + ') · paid by ' + nameOf(trip, it.paidBy) + ', ' + split;
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
