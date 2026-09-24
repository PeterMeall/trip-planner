import { useEffect, useState } from 'react';

// Live exchange rates (mid-market, updated daily) from the free, open currency-api
// (github.com/fawazahmed0/exchange-api), with a second mirror as backup. No key needed.
// Rates are "1 base = X currency", the same way the app stores them.

const mem = {};
const store = {
  get: (k) => { try { return JSON.parse(window.localStorage.getItem(k) || 'null'); } catch (e) { return null; } },
  set: (k, v) => { try { window.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode or full */ } }
};
const todayUtc = () => new Date().toISOString().slice(0, 10);

const fetchJson = async (url) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    return r.ok ? await r.json() : null;
  } catch (e) { return null; } finally { clearTimeout(timer); }
};

// All rates for a base currency on a date ('YYYY-MM-DD'), or the latest when the date is today or later.
export async function ratesOn(base, date) {
  const b = String(base || 'EUR').toLowerCase();
  const latest = !date || date >= todayUtc();
  const tag = latest ? 'latest' : date;
  const key = 'fx:' + b + ':' + (latest ? 'latest:' + todayUtc() : date);
  if (mem[key]) return mem[key];
  const cached = store.get(key);
  if (cached) { mem[key] = cached; return cached; }
  const urls = [
    'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@' + tag + '/v1/currencies/' + b + '.min.json',
    'https://' + tag + '.currency-api.pages.dev/v1/currencies/' + b + '.min.json'
  ];
  for (const url of urls) {
    const j = await fetchJson(url);
    if (j && j[b]) {
      const rates = {};
      Object.keys(j[b]).forEach((k) => { rates[k.toUpperCase()] = j[b][k]; });
      const out = { date: j.date, rates };
      mem[key] = out;
      store.set(key, out);
      return out;
    }
  }
  return null;
}

// Rate for one currency on a date: { rate, date } or null when offline and nothing cached.
export async function rateOn(base, cur, date) {
  if (!cur || cur === base) return { rate: 1, date };
  const r = await ratesOn(base, date);
  if (r && r.rates[cur]) return { rate: r.rates[cur], date: r.date };
  return null;
}

// Rounds a rate to something readable but precise enough for money (38.03, 29,594).
export const niceRate = (r) => (r >= 100 ? Math.round(r) : r >= 10 ? Math.round(r * 100) / 100 : Math.round(r * 10000) / 10000);

// React helper for the forms: the rate for `cur` on `date`, looked up whenever either changes.
export function useDayRate(base, cur, date) {
  const [state, setState] = useState({ loading: false, rate: null, date: null });
  useEffect(() => {
    let alive = true;
    if (!cur || cur === base) { setState({ loading: false, rate: 1, date }); return undefined; }
    setState((s) => ({ ...s, loading: true }));
    rateOn(base, cur, date).then((r) => {
      if (alive) setState({ loading: false, rate: r ? niceRate(r.rate) : null, date: r ? r.date : null });
    });
    return () => { alive = false; };
  }, [base, cur, date]);
  return state;
}

// Once a day (per phone), when the trip opens:
// 1. the trip's own rates move to today's rate (used for anything without a saved rate), and
// 2. prices and expenses on a day that has passed, which have no rate of their own yet,
//    get the rate of that day saved with them, so their euro amount no longer changes.
export async function syncTripRates(trip, items, expenses, save) {
  const home = trip.homeCurrency || 'EUR';
  const key = 'fx-sync:' + trip.id + ':' + todayUtc();
  if (store.get(key)) return;
  const latest = await ratesOn(home, null);
  if (!latest) return; // offline: try again next time
  const pick = (code, old) => (latest.rates[code] ? niceRate(latest.rates[code]) : old);
  const local = trip.localCurrency || 'THB';
  const next = {
    rate: local === home ? 1 : pick(local, trip.rate),
    extraCurrencies: (trip.extraCurrencies || []).map((c) => ({ code: c.code, rate: pick(c.code, c.rate) })),
    ratesDate: latest.date || todayUtc()
  };
  const changed = next.rate !== trip.rate || JSON.stringify(next.extraCurrencies) !== JSON.stringify(trip.extraCurrencies || []);
  if (changed || trip.ratesDate !== next.ratesDate) save.trip(next);

  const today = todayUtc();
  const todo = [];
  items.forEach((it) => { if (it.price && it.cur && it.cur !== home && !it.rate) todo.push(['items', it, it.date]); });
  expenses.forEach((e) => { if (e.amount && e.cur && e.cur !== home && !e.rate && e.split !== 'transfer') todo.push(['expenses', e, e.date || trip.startDate]); });
  for (const [col, row, date] of todo) {
    if (!date || date > today) continue; // not paid yet by date: keeps following today's rate
    const r = await rateOn(home, row.cur, date);
    if (r && r.rate) save.row(col, row.id, { rate: niceRate(r.rate) });
  }
  store.set(key, true);
}
