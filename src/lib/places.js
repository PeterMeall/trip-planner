// "Show the driver": the address of a place in the local language (Thai, Vietnamese, ...)
// next to the app language. Addresses come from OpenStreetMap (Nominatim, free, no key).
// When a place isn't on the map (small guesthouses), its name is machine-translated and
// combined with the local address of the area. The result is saved on the item, so both
// phones have it and it works offline afterwards.

// Country code -> language code for the local script.
export const COUNTRY_LANG = {
  th: 'th', vn: 'vi', kh: 'km', la: 'lo', mm: 'my', my: 'ms', id: 'id', jp: 'ja', kr: 'ko', cn: 'zh', tw: 'zh-TW',
  hk: 'zh-TW', ru: 'ru', gr: 'el', eg: 'ar', ma: 'ar', ae: 'ar', il: 'he', in: 'hi', lk: 'si', np: 'ne', tr: 'tr',
  es: 'es', mx: 'es', pt: 'pt', br: 'pt', fr: 'fr', it: 'it', de: 'de', pl: 'pl', cz: 'cs', hr: 'hr', ge: 'ka'
};
const CURRENCY_LANG = { THB: 'th', VND: 'vi', KHR: 'km', LAK: 'lo', MYR: 'ms', IDR: 'id', JPY: 'ja', KRW: 'ko', CNY: 'zh' };

// "Please take me to this address", in the local language.
export const PLEASE = {
  th: 'กรุณาพาไปที่อยู่นี้',
  vi: 'Vui lòng đưa tôi đến địa chỉ này',
  km: 'សូមជូនខ្ញុំទៅអាសយដ្ឋាននេះ',
  ja: 'この住所までお願いします',
  zh: '请带我去这个地址',
  'zh-TW': '請帶我去這個地址',
  ko: '이 주소로 가 주세요',
  id: 'Tolong antar saya ke alamat ini',
  ms: 'Tolong bawa saya ke alamat ini',
  es: 'Lléveme a esta dirección, por favor',
  pt: 'Leve-me a este endereço, por favor',
  fr: 'Emmenez-moi à cette adresse, s’il vous plaît',
  it: 'Mi porti a questo indirizzo, per favore',
  de: 'Bitte bringen Sie mich zu dieser Adresse'
};

const NOMI = 'https://nominatim.openstreetmap.org';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
// Nominatim asks for at most one request per second: all lookups wait their turn in one queue.
let queue = Promise.resolve();
const polite = () => { const turn = queue.then(() => sleep(1100)); queue = turn; return queue.then(() => {}); };

const getJson = async (url) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const r = await fetch(url, { signal: ctrl.signal });
    return r.ok ? await r.json() : null;
  } catch (e) { return null; } finally { clearTimeout(timer); }
};

// Throws when the map service can't be reached (offline, busy), so a half result is never saved.
const search = async (q, lang) => {
  const url = NOMI + '/search?format=jsonv2&addressdetails=1&limit=1&accept-language=' + encodeURIComponent(lang) + '&q=' + encodeURIComponent(q);
  await polite();
  let j = await getJson(url);
  if (!j) { await sleep(2500); await polite(); j = await getJson(url); }
  if (!j) throw new Error('map lookup failed');
  return j[0] || null;
};
const lookup = async (hit, lang) => {
  const code = { node: 'N', way: 'W', relation: 'R' }[hit.osm_type];
  if (!code) return null;
  await polite();
  const j = await getJson(NOMI + '/lookup?format=jsonv2&addressdetails=1&accept-language=' + encodeURIComponent(lang) + '&osm_ids=' + code + hit.osm_id);
  return j && j[0] ? j[0] : null;
};

// Machine translation for a place name: Google's free endpoint, then MyMemory as a backup.
export async function translate(text, to, from = 'en') {
  if (!text) return '';
  const g = await getJson('https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=' + from + '&tl=' + to + '&q=' + encodeURIComponent(text));
  if (g && Array.isArray(g[0])) {
    const s = g[0].map((x) => (x && x[0]) || '').join('').trim();
    if (s) return s;
  }
  const m = await getJson('https://api.mymemory.translated.net/get?langpair=' + from + '|' + to + '&q=' + encodeURIComponent(text));
  const s = m && m.responseData && m.responseData.translatedText;
  return s && !/MYMEMORY WARNING|QUERY LENGTH/i.test(s) ? s : '';
}

// Drop the country at the end; the driver knows which country they're in.
const tidy = (display) => {
  const parts = String(display || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length > 2) parts.pop();
  return parts.join(', ');
};

export const placeQuery = (it) => (it.place || it.title || '').trim();

// Returns { q, lang, localName, localAddr, appAddr, src } or null (offline / nothing found).
// src: 'map' (found on the map), 'mixed' (name translated, area from the map), 'translated'.
export async function findLocal(it, trip, appLang) {
  try { return await findLocalInner(it, trip, appLang); } catch (e) { return null; }
}
async function findLocalInner(it, trip, appLang) {
  const q = placeQuery(it);
  if (!q) return null;
  const want = appLang === 'en' ? 'en' : appLang + ',en';
  let hit = await search(q, want);
  let areaOnly = false;
  const comma = q.indexOf(',');
  if (!hit && comma > 0) { hit = await search(q.slice(comma + 1).trim(), want); areaOnly = !!hit; }
  const guess = CURRENCY_LANG[it.cur] || CURRENCY_LANG[trip.localCurrency] || '';
  if (!hit) {
    if (!guess) return null;
    const txt = await translate(q, guess);
    return txt ? { q, lang: guess, localName: '', localAddr: txt, appAddr: '', src: 'translated' } : null;
  }
  const lang = COUNTRY_LANG[(hit.address && hit.address.country_code) || ''] || guess;
  if (!lang || lang === 'en') return { q, lang: 'en', localName: '', localAddr: tidy(hit.display_name), appAddr: tidy(hit.display_name), src: 'map' };
  const loc = await lookup(hit, lang);
  const localAddr = tidy((loc || hit).display_name);
  if (areaOnly) {
    const name = q.slice(0, comma).trim() || it.title;
    const localName = await translate(name, lang);
    return { q, lang, localName: localName || name, localAddr, appAddr: tidy(hit.display_name), src: 'mixed' };
  }
  return { q, lang, localName: (loc && loc.name) || '', localAddr, appAddr: tidy(hit.display_name), src: 'map' };
}

// Coordinates for a place (used for the weather). Cached on this phone.
const geoMem = {};
export async function geocode(q) {
  const key = 'geo:' + q.toLowerCase();
  if (geoMem[key]) return geoMem[key];
  try { const c = JSON.parse(window.localStorage.getItem(key) || 'null'); if (c) { geoMem[key] = c; return c; } } catch (e) { /* ignore */ }
  let hit = null;
  try {
    hit = await search(q, 'en');
    const comma = q.indexOf(',');
    if (!hit && comma > 0) hit = await search(q.slice(comma + 1).trim(), 'en');
  } catch (e) { return null; } // offline: try again later
  const a = (hit && hit.address) || {};
  const out = hit ? { lat: Number(hit.lat), lon: Number(hit.lon), name: a.island || a.town || a.city || a.village || a.suburb || a.county || a.state || '' } : { none: true };
  geoMem[key] = out;
  try { window.localStorage.setItem(key, JSON.stringify(out)); } catch (e) { /* ignore */ }
  return out;
}
