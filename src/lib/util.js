import { t, getLang } from './i18n.js';

// Shared helpers: types, dates, money, maps.

export const TYPES = {
  flight: { get label() { return t('Flight'); }, bg: '#E6ECF4', fg: '#2C5282', icon: 'M3 13l18-7-7 18-2-8-9-3z' },
  hotel: { get label() { return t('Stay'); }, bg: '#F4E2EA', fg: '#7A3566', icon: 'M3 19V6M3 14h18v5M21 14v-2a3 3 0 0 0-3-3h-7v5M7 12a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z' },
  activity: { get label() { return t('Activity'); }, bg: '#E2EFDC', fg: '#3A6528', icon: 'M12 3l2.6 5.6 6 .7-4.5 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6L3.4 9.3l6-.7z' },
  food: { get label() { return t('Food'); }, bg: '#FBE4CF', fg: '#9A4A0E', icon: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 1-3 3-3 6v3h3v9' },
  transport: { get label() { return t('Transport'); }, bg: '#EFE6D8', fg: '#5E4A30', icon: 'M5 16h14M6 16l1.5-5h9L18 16M5 16v3M19 16v3M8 13.5h.01M16 13.5h.01' },
  boat: { get label() { return t('Boat'); }, bg: '#DCEEEC', fg: '#1D5E5A', icon: 'M3 18c2 2 4 2 6 0s4-2 6 0 4 2 6 0M5 15l1-5h12l1 5M12 10V5' }
};
export const TYPE_ORDER = ['activity', 'food', 'transport', 'boat', 'flight', 'hotel'];

export const REMINDER_CATS = {
  cancel: { get label() { return t('Cancel'); }, bg: '#FBE7E4', fg: '#8F1D14' },
  pay: { get label() { return t('Pay'); }, bg: '#F9E9D8', fg: '#8A420C' },
  checkin: { get label() { return t('Check in'); }, bg: '#E6ECF4', fg: '#2C5282' },
  confirm: { get label() { return t('Confirm'); }, bg: '#E2EFDC', fg: '#3A6528' },
  other: { get label() { return t('Other'); }, bg: '#EFEAE2', fg: '#4A3D33' }
};

// Expense categories. Colours validated as a categorical palette on the cream surface.
export const EXP_CATS = {
  stays: { get label() { return t('Stays'); }, color: '#2a78d6', type: 'hotel' },
  flights: { get label() { return t('Flights'); }, color: '#eb6834', type: 'flight' },
  activities: { get label() { return t('Activities'); }, color: '#1baf7a', type: 'activity' },
  food: { get label() { return t('Food'); }, color: '#eda100', type: 'food' },
  transport: { get label() { return t('Transport'); }, color: '#e87ba4', type: 'transport' },
  other: { get label() { return t('Other'); }, color: '#008300', type: null }
};
export const TYPE_TO_CAT = { flight: 'flights', hotel: 'stays', activity: 'activities', food: 'food', transport: 'transport', boat: 'transport' };
export const OTHER_LOOK = { bg: '#EFE7DD', fg: '#4A3D33', icon: 'M6 8h12l-1 12H7L6 8zM9 8V6a3 3 0 0 1 6 0v2' };

export const ICONS = {
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  chevR: 'M9 6l6 6-6 6',
  chevL: 'M15 6l-6 6 6 6',
  plus: 'M12 5v14M5 12h14',
  close: 'M6 6l12 12M18 6L6 18',
  copy: 'M9 9h10v10H9zM5 15V5h10',
  clip: 'M20 11l-8.5 8.5a5 5 0 0 1-7-7L13 4a3.5 3.5 0 0 1 5 5l-8.5 8.5a2 2 0 0 1-3-3L14 7',
  bell: 'M6 16v-5a6 6 0 0 1 12 0v5l2 2H4l2-2zM10 21h4',
  check: 'M5 12l5 5 9-10',
  heart: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z',
  sun: 'M12 3v2M12 19v2M5 5l1.4 1.4M17.6 17.6L19 19M3 12h2M19 12h2M5 19l1.4-1.4M17.6 6.4L19 5M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v4M16 3v4',
  bag: 'M6 8h12l-1 12H7L6 8zM9 8V6a3 3 0 0 1 6 0v2',
  wallet: 'M4 7h14a2 2 0 0 1 2 2v9H4zM4 7l12-3v3M16 13h.01',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  trash: 'M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3',
  edit: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
  file: 'M14 3H6v18h12V7l-4-4zM14 3v4h4'
};

export const pad = (n) => (n < 10 ? '0' : '') + n;
export const tm = (s) => {
  if (!s) return 0;
  const p = String(s).split(':');
  return Number(p[0]) * 60 + Number(p[1] || 0);
};
export const fromMin = (m) => pad(Math.floor(m / 60)) + ':' + pad(m % 60);

export const TIMES = (() => {
  const out = [];
  for (let m = 0; m < 1440; m += 15) out.push(fromMin(m));
  return out;
})();

// Dates are plain 'YYYY-MM-DD' strings in the trip's own time zone.
const parseDate = (d) => {
  const [y, m, day] = d.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, day));
};
export const addDays = (d, n) => {
  const x = parseDate(d);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};
export const daysBetween = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000);
export const tripDays = (trip) => {
  if (!trip || !trip.startDate || !trip.endDate) return [];
  const n = Math.max(0, daysBetween(trip.startDate, trip.endDate));
  const out = [];
  for (let i = 0; i <= n && i < 120; i++) out.push(addDays(trip.startDate, i));
  return out;
};
const NAMES = {
  en: {
    wd: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    wds: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    mo: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    mos: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  },
  nl: {
    wd: ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'],
    wds: ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'],
    mo: ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'],
    mos: ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec']
  }
};
const N = () => NAMES[getLang()] || NAMES.en;
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const dShort = (d) => { const x = parseDate(d); return N().wds[x.getUTCDay()] + ' ' + x.getUTCDate() + ' ' + N().mos[x.getUTCMonth()]; };
// Long form is used as a heading, so it starts with a capital in Dutch too.
export const dLong = (d) => { const x = parseDate(d); return cap(N().wd[x.getUTCDay()]) + ' ' + x.getUTCDate() + ' ' + N().mo[x.getUTCMonth()]; };
export const dWeekday = (d) => N().wds[parseDate(d).getUTCDay()];
export const dNum = (d) => String(parseDate(d).getUTCDate());

// "Now" in the trip's time zone, as { date, min, label }.
export const nowIn = (tz) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz || 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date());
  const g = (t) => parts.find((p) => p.type === t).value;
  const min = Number(g('hour')) * 60 + Number(g('minute'));
  return { date: g('year') + '-' + g('month') + '-' + g('day'), min, label: fromMin(min) };
};

const SYMBOLS = { EUR: '€', THB: '฿', GBP: '£', USD: '$', JPY: '¥', AUD: 'A$', SGD: 'S$', IDR: 'Rp ', MYR: 'RM ', PHP: '₱', KRW: '₩' };
const SUFFIX = { VND: ' ₫', KHR: ' ៛', LAK: ' ₭' };
export const money = (n, cur) => {
  const num = Math.round(n || 0).toLocaleString(getLang() === 'nl' ? 'nl-NL' : 'en-GB');
  if (SUFFIX[cur]) return num + SUFFIX[cur];
  return (SYMBOLS[cur] || (cur ? cur + ' ' : '')) + num;
};

// Rates are stored as "1 home currency = X of this currency".
// The main local currency uses trip.rate; any others (e.g. VND for a Vietnam leg) live in trip.extraCurrencies.
export const rateFor = (cur, trip) => {
  if (!cur || cur === (trip.homeCurrency || 'EUR')) return 1;
  if (cur === (trip.localCurrency || 'THB')) return Number(trip.rate) || 1;
  const x = (trip.extraCurrencies || []).find((c) => c.code === cur);
  return x ? Number(x.rate) || 1 : 1;
};
export const currenciesOf = (trip) => Array.from(new Set(
  [trip.localCurrency || 'THB', trip.homeCurrency || 'EUR'].concat((trip.extraCurrencies || []).map((c) => c.code))
));
export const toHome = (amount, cur, trip) => (Number(amount) || 0) / rateFor(cur, trip);
export const toLocal = (amount, cur, trip) => toHome(amount, cur, trip) * (Number(trip.rate) || 1);
// Accepts "1200", "12.50", "12,50" and thousands separators like "250.000" or "250,000" (common for dong).
export const parseAmount = (v) => {
  let s = String(v || '').replace(/[\s\u00a0]/g, '');
  if (/^\d{1,3}([.,]\d{3})+$/.test(s)) s = s.replace(/[.,]/g, '');
  else s = s.replace(',', '.');
  const n = parseFloat(s);
  return n > 0 ? n : 0;
};

// Remembers the last currency used on this phone, so a Vietnam leg doesn't mean switching every time.
export const lastCurrency = (trip) => {
  let c = null;
  try { c = window.localStorage.getItem('cur:' + trip.id); } catch (e) { c = null; }
  return c && currenciesOf(trip).includes(c) ? c : trip.localCurrency;
};
export const rememberCurrency = (trip, cur) => {
  try { window.localStorage.setItem('cur:' + trip.id, cur); } catch (e) { /* private mode */ }
};

export const mapsUrl = (q) => 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(q || '');

export const nameOf = (trip, email) => {
  if (!email) return '';
  if (email === 'both' || email === 'shared') return email === 'both' ? t('Both') : t('Shared');
  return (trip.names && trip.names[email]) || email.split('@')[0];
};

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
