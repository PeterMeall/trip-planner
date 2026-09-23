import { useEffect, useState } from 'react';
import nl from './nl.js';

// Tiny translation layer. Text is written in English in the code as t('...'); the Dutch
// version comes from nl.js, falling back to English if a line is missing.
// The language is chosen per phone: the phone's own language by default, or the Settings switch.

const KEY = 'lang';

const detect = () => {
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved === 'en' || saved === 'nl') return saved;
  } catch (e) { /* private mode */ }
  const langs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']);
  return String(langs[0] || '').toLowerCase().startsWith('nl') ? 'nl' : 'en';
};

let lang = typeof window === 'undefined' ? 'en' : detect();
const listeners = new Set();
if (typeof document !== 'undefined') document.documentElement.lang = lang === 'nl' ? 'nl' : 'en-GB';

export const getLang = () => lang;

export const setLang = (l) => {
  lang = l === 'nl' ? 'nl' : 'en';
  try { window.localStorage.setItem(KEY, lang); } catch (e) { /* private mode */ }
  document.documentElement.lang = lang === 'nl' ? 'nl' : 'en-GB';
  listeners.forEach((f) => f(lang));
};

export function t(s, vars) {
  let out = lang === 'nl' && nl[s] != null ? nl[s] : s;
  if (vars) Object.keys(vars).forEach((k) => { out = out.split('{' + k + '}').join(String(vars[k])); });
  return out;
}

// Plural helper: tn(n, 'plan', 'plans') -> "1 plan" / "3 plans" (translated).
export const tn = (n, one, many) => t(n === 1 ? one : many, { n });

export function useLang() {
  const [l, setL] = useState(lang);
  useEffect(() => { listeners.add(setL); return () => listeners.delete(setL); }, []);
  return l;
}
