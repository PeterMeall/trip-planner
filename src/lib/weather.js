import { useEffect, useState } from 'react';
import { t } from './i18n.js';
import { geocode } from './places.js';
import { staysFor } from './trip.js';

// Daily forecast from Open-Meteo (free, no key), up to 16 days ahead.
// The place for a day is where they sleep that night (or the nearest stay before/after it).

const WX = [
  [[0], 'sun', () => t('Sunny')],
  [[1, 2], 'partly', () => t('Partly cloudy')],
  [[3], 'cloud', () => t('Cloudy')],
  [[45, 48], 'cloud', () => t('Foggy')],
  [[51, 53, 55, 56, 57], 'rain', () => t('Drizzle')],
  [[61, 63, 66], 'rain', () => t('Rain')],
  [[65, 67], 'rain', () => t('Heavy rain')],
  [[80, 81], 'rain', () => t('Showers')],
  [[82], 'rain', () => t('Heavy showers')],
  [[71, 73, 75, 77, 85, 86], 'cloud', () => t('Snow')],
  [[95, 96, 99], 'storm', () => t('Thunderstorms')]
];
export const wxLook = (code) => {
  const row = WX.find(([codes]) => codes.includes(code));
  return row ? { icon: row[1], label: row[2]() } : { icon: 'cloud', label: '' };
};

const placeFor = (items, days, date, trip) => {
  const stayOn = (d) => staysFor(items, d).night;
  let s = stayOn(date);
  if (!s) { const here = items.find((it) => it.date === date && it.place && it.type !== 'flight'); if (here) return here.place.trim(); }
  const i = days.indexOf(date);
  for (let k = 1; !s && k < days.length; k++) s = (i - k >= 0 && stayOn(days[i - k])) || (i + k < days.length && stayOn(days[i + k])) || null;
  return s ? (s.place || s.title || '').trim() : (trip.name || '').trim();
};

const mem = {};
async function forecast(lat, lon) {
  const key = 'wx:' + lat.toFixed(2) + ',' + lon.toFixed(2);
  const fresh = (c) => c && Date.now() - c.at < 3 * 3600000;
  if (fresh(mem[key])) return mem[key];
  let cached = null;
  try { cached = JSON.parse(window.localStorage.getItem(key) || 'null'); } catch (e) { /* ignore */ }
  if (fresh(cached)) { mem[key] = cached; return cached; }
  const url = 'https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon
    + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=16&past_days=3';
  try {
    const r = await fetch(url);
    const j = r.ok ? await r.json() : null;
    if (j && j.daily) {
      const days = {};
      j.daily.time.forEach((d, n) => {
        days[d] = { code: j.daily.weather_code[n], max: j.daily.temperature_2m_max[n], min: j.daily.temperature_2m_min[n], rain: j.daily.precipitation_probability_max[n] };
      });
      const out = { at: Date.now(), days };
      mem[key] = out;
      try { window.localStorage.setItem(key, JSON.stringify(out)); } catch (e) { /* ignore */ }
      return out;
    }
  } catch (e) { /* offline */ }
  return cached; // older forecast is better than none
}

// { code, max, min, rain, icon, label, place } for a trip day, or null (too far ahead, offline, unknown place).
export function useDayWeather(ctx, date) {
  const { items, days, trip } = ctx;
  const q = date ? placeFor(items, days, date, trip) : '';
  const [wx, setWx] = useState(null);
  useEffect(() => {
    let alive = true;
    setWx(null);
    if (!q) return undefined;
    (async () => {
      const g = await geocode(q);
      if (!g || g.none) return;
      const f = await forecast(g.lat, g.lon);
      const d = f && f.days[date];
      // Name the place the way they wrote it ("..., Koh Tao" -> Koh Tao), else the map's name.
      const parts = q.split(',').map((x) => x.trim()).filter(Boolean);
      const place = parts.length > 1 ? parts[parts.length - 1] : g.name;
      if (alive && d && d.max != null) setWx({ ...d, ...wxLook(d.code), place });
    })();
    return () => { alive = false; };
  }, [q, date]);
  return wx;
}

export const wxShort = (wx) => Math.round(wx.max) + '°' + (wx.rain >= 30 ? ' · ' + wx.rain + '%' : '');
