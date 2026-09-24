import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSub, updateTrip, updateRow } from './lib/data.js';
import { syncTripRates } from './lib/rates.js';
import { findLocal, placeQuery } from './lib/places.js';
import { tripDays, nowIn, tm } from './lib/util.js';
import { Icon, Seg, MeButton } from './components/ui.jsx';
import { t, getLang } from './lib/i18n.js';
import Today from './screens/Today.jsx';
import Itinerary from './screens/Itinerary.jsx';
import Reminders from './screens/Reminders.jsx';
import Wishlist from './screens/Wishlist.jsx';
import Packing from './screens/Packing.jsx';
import Expenses from './screens/Expenses.jsx';
import ItemDetail from './sheets/ItemDetail.jsx';
import ItemForm from './sheets/ItemForm.jsx';
import ReminderForm from './sheets/ReminderForm.jsx';
import { WishForm, PlanWish } from './sheets/WishSheets.jsx';
import ExpenseForm from './sheets/ExpenseForm.jsx';
import Settings from './sheets/Settings.jsx';
import DriverCard from './sheets/DriverCard.jsx';

// Tab labels are kept short so the Dutch versions fit under the icons.
const TABS = [
  { id: 'today', get label() { return t('Today'); }, icon: 'sun' },
  { id: 'day', get label() { return t('Itinerary'); }, icon: 'calendar' },
  { id: 'lists', get label() { return t('Lists'); }, icon: 'list' },
  { id: 'money', get label() { return t('Expenses'); }, icon: 'wallet' }
];

export default function TripApp({ user, trip, trips, onSwitch, onNewTrip }) {
  const me = (user.email || '').toLowerCase();
  const itemsRaw = useSub(trip.id, 'items');
  const reminders = useSub(trip.id, 'reminders');
  const wishes = useSub(trip.id, 'wishlist');
  const packing = useSub(trip.id, 'packing');
  const expenses = useSub(trip.id, 'expenses');
  const attachments = useSub(trip.id, 'attachments');

  // Exchange rates: today's rate for the trip, and the rate of the day for anything already paid.
  const rateSynced = useRef(false);
  useEffect(() => {
    if (rateSynced.current) return undefined;
    const timer = setTimeout(() => {
      rateSynced.current = true;
      syncTripRates(trip, itemsRaw, expenses, {
        trip: (data) => updateTrip(trip.id, data),
        row: (col, id, data) => updateRow(trip.id, col, id, data)
      });
      prefetchDriver(trip, itemsRaw);
    }, 4000); // give the lists a moment to arrive
    return () => clearTimeout(timer);
  }, [trip, itemsRaw, expenses]);

  // Re-render every minute so "now", countdowns and overdue reminders stay current.
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 60000); return () => clearInterval(t); }, []);
  const now = useMemo(() => nowIn(trip.timezone), [trip.timezone, tick]);

  const days = useMemo(() => tripDays(trip), [trip]);
  const items = useMemo(() => itemsRaw.slice().sort((a, b) =>
    String(a.date).localeCompare(String(b.date)) || tm(a.start) - tm(b.start)), [itemsRaw]);

  const inTripIdx = days.indexOf(now.date);
  const [tab, setTabRaw] = useState('today');
  // Reminders, Wishlist and Packing live together under "Lists".
  const [listTab, setListTab] = useState('rem');
  const setTab = useCallback((id) => {
    if (id === 'rem' || id === 'wish' || id === 'pack') { setListTab(id); setTabRaw('lists'); } else setTabRaw(id);
  }, []);
  const [dayIdx, setDayIdx] = useState(inTripIdx >= 0 ? inTripIdx : 0);
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState('');

  const flash = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(''), 1800); }, []);
  const close = useCallback(() => setSheet(null), []);

  // Android back button: close an open sheet first, then return to Today, and only leave the app from Today.
  // Whenever we're somewhere back should handle, one extra history entry "catches" the back press.
  const guarded = useRef(false);
  const ignorePop = useRef(false);
  const current = useRef({ tab, sheet });
  current.current = { tab, sheet };
  const [guardTick, setGuardTick] = useState(0);
  const needsGuard = !!sheet || tab !== 'today';
  useEffect(() => {
    if (needsGuard && !guarded.current) {
      window.history.pushState({ chiabel: true }, '');
      guarded.current = true;
    } else if (!needsGuard && guarded.current) {
      // Back on Today through the tab bar: drop the extra entry so the next back press leaves the app.
      guarded.current = false;
      ignorePop.current = true;
      window.history.back();
    }
  }, [needsGuard, guardTick]);
  useEffect(() => {
    const onPop = () => {
      if (ignorePop.current) { ignorePop.current = false; return; }
      guarded.current = false;
      const s = current.current;
      if (s.sheet) setSheet(null);
      else if (s.tab !== 'today') setTab('today');
      setGuardTick((x) => x + 1);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  useEffect(() => {
    const onErr = (e) => flash(t('Couldn\u2019t save: {error}', { error: e.detail }));
    window.addEventListener('write-error', onErr);
    return () => window.removeEventListener('write-error', onErr);
  }, [flash]);

  const nowKey = now.date + ' ' + now.label;
  const remKey = (r) => (r.date ? r.date + ' ' + (r.time || '23:59') : '9999');
  const remOverdue = reminders.filter((r) => !r.done && r.date && remKey(r) < nowKey).length;
  const remToday = reminders.filter((r) => !r.done && r.date === now.date && remKey(r) >= nowKey).length;
  const attention = remOverdue + remToday;

  const ctx = {
    trip, trips, me, user, items, days, now, reminders, wishes, packing, expenses, attachments,
    dayIdx, setDayIdx, setTab, open: setSheet, close, flash, onSwitch, onNewTrip,
    remOverdue, remToday, remKey, nowKey
  };
  ctx.listHead = (
    <div className="stack" style={{ gap: 12 }}>
      <div className="head-row">
        <h1 className="h1 grow">{t('Lists')}</h1>
        <MeButton ctx={ctx} />
      </div>
      <Seg label={t('Lists')} value={listTab} onChange={setListTab} options={[
        { value: 'rem', label: t('Reminders') + (attention ? ' (' + attention + ')' : '') },
        { value: 'wish', label: t('Wishlist') },
        { value: 'pack', label: t('Packing') }
      ]} />
    </div>
  );

  return (
    <div className="app">
      {tab === 'today' && <Today ctx={ctx} />}
      {tab === 'day' && <Itinerary ctx={ctx} />}
      {tab === 'lists' && listTab === 'rem' && <Reminders ctx={ctx} />}
      {tab === 'lists' && listTab === 'wish' && <Wishlist ctx={ctx} />}
      {tab === 'lists' && listTab === 'pack' && <Packing ctx={ctx} />}
      {tab === 'money' && <Expenses ctx={ctx} />}

      <nav className="tabbar" aria-label={t('Main')}>
        {TABS.map((tb) => (
          <button key={tb.id} className={tab === tb.id ? 'on' : ''} aria-current={tab === tb.id ? 'page' : undefined}
            aria-label={tb.id === 'lists' && attention ? tb.label + ', ' + (attention === 1 ? t('1 needs attention') : t('{n} need attention', { n: attention })) : tb.label}
            onClick={() => { setSheet(null); setTabRaw(tb.id); }}>
            <span style={{ position: 'relative', display: 'flex' }}>
              <Icon d={tb.icon} size={22} />
              {tb.id === 'lists' && attention > 0 && <span className="badge">{attention}</span>}
            </span>
            <span className="lbl">{tb.label}</span>
          </button>
        ))}
      </nav>

      {sheet && sheet.kind === 'item' && <ItemDetail ctx={ctx} id={sheet.id} />}
      {sheet && sheet.kind === 'itemForm' && <ItemForm ctx={ctx} {...sheet} />}
      {sheet && sheet.kind === 'remForm' && <ReminderForm ctx={ctx} {...sheet} />}
      {sheet && sheet.kind === 'wishForm' && <WishForm ctx={ctx} {...sheet} />}
      {sheet && sheet.kind === 'planWish' && <PlanWish ctx={ctx} {...sheet} />}
      {sheet && sheet.kind === 'expForm' && <ExpenseForm ctx={ctx} {...sheet} />}
      {sheet && sheet.kind === 'settings' && <Settings ctx={ctx} />}
      {sheet && sheet.kind === 'driver' && <DriverCard ctx={ctx} id={sheet.id} />}

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

// Driver cards for the next few days are looked up in the background while there's internet,
// so they also work later without a connection. Once a day per phone.
async function prefetchDriver(trip, items) {
  const today = new Date().toISOString().slice(0, 10);
  const key = 'drv-sync:' + trip.id + ':' + today;
  try { if (window.localStorage.getItem(key)) return; } catch (e) { /* private mode */ }
  const soon = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  const todo = items.filter((it) => it.type !== 'flight' && it.place && it.date >= today && it.date <= soon
    && !(it.drv && (it.drv.q === placeQuery(it) || it.drv.src === 'own'))).slice(0, 8);
  for (const it of todo) {
    const r = await findLocal(it, trip, getLang());
    if (r) updateRow(trip.id, 'items', it.id, { drv: r });
  }
  try { window.localStorage.setItem(key, '1'); } catch (e) { /* private mode */ }
}
