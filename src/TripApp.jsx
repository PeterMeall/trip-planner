import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSub } from './lib/data.js';
import { tripDays, nowIn, tm } from './lib/util.js';
import { Icon } from './components/ui.jsx';
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

const TABS = [
  { id: 'today', label: 'Today', icon: 'sun' },
  { id: 'day', label: 'Itinerary', icon: 'calendar' },
  { id: 'rem', label: 'Reminders', icon: 'bell' },
  { id: 'wish', label: 'Wishlist', icon: 'heart' },
  { id: 'pack', label: 'Packing', icon: 'bag' },
  { id: 'money', label: 'Expenses', icon: 'wallet' }
];

export default function TripApp({ user, trip, trips, onSwitch, onNewTrip }) {
  const me = (user.email || '').toLowerCase();
  const itemsRaw = useSub(trip.id, 'items');
  const reminders = useSub(trip.id, 'reminders');
  const wishes = useSub(trip.id, 'wishlist');
  const packing = useSub(trip.id, 'packing');
  const expenses = useSub(trip.id, 'expenses');
  const attachments = useSub(trip.id, 'attachments');

  // Re-render every minute so "now", countdowns and overdue reminders stay current.
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick((x) => x + 1), 60000); return () => clearInterval(t); }, []);
  const now = useMemo(() => nowIn(trip.timezone), [trip.timezone, tick]);

  const days = useMemo(() => tripDays(trip), [trip]);
  const items = useMemo(() => itemsRaw.slice().sort((a, b) =>
    String(a.date).localeCompare(String(b.date)) || tm(a.start) - tm(b.start)), [itemsRaw]);

  const inTripIdx = days.indexOf(now.date);
  const [tab, setTab] = useState('today');
  const [dayIdx, setDayIdx] = useState(inTripIdx >= 0 ? inTripIdx : 0);
  const [sheet, setSheet] = useState(null);
  const [toast, setToast] = useState('');

  const flash = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(''), 1800); }, []);
  const close = useCallback(() => setSheet(null), []);
  useEffect(() => {
    const onErr = (e) => flash('Couldn\u2019t save: ' + e.detail);
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

  return (
    <div className="app">
      {tab === 'today' && <Today ctx={ctx} />}
      {tab === 'day' && <Itinerary ctx={ctx} />}
      {tab === 'rem' && <Reminders ctx={ctx} />}
      {tab === 'wish' && <Wishlist ctx={ctx} />}
      {tab === 'pack' && <Packing ctx={ctx} />}
      {tab === 'money' && <Expenses ctx={ctx} />}

      <nav className="tabbar" aria-label="Main">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} aria-current={tab === t.id ? 'page' : undefined}
            aria-label={t.id === 'rem' && attention ? t.label + ', ' + attention + ' need attention' : t.label}
            onClick={() => { setSheet(null); setTab(t.id); }}>
            <span style={{ position: 'relative', display: 'flex' }}>
              <Icon d={t.icon} size={22} />
              {t.id === 'rem' && attention > 0 && <span className="badge">{attention}</span>}
            </span>
            <span className="lbl">{t.label}</span>
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

      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}
