import { useState } from 'react';
import { Sheet, SheetHead, Field, TypePicker, TimeSelect, ConfirmButton } from '../components/ui.jsx';
import { parseAmount, tm, fromMin, currenciesOf } from '../lib/util.js';
import { addRow, updateRow, deleteRow } from '../lib/data.js';
import { dayLabel } from '../lib/trip.js';

export function WishForm({ ctx, wish }) {
  const { trip, wishes, me, close, flash } = ctx;
  const editing = !!wish;
  const [f, setF] = useState(() => wish ? { ...wish, est: wish.est === 0 ? '0' : wish.est ? String(wish.est) : '', note: wish.note || '', area: wish.area || '', estCur: wish.estCur || trip.localCurrency } : { title: '', type: 'activity', area: '', est: '', estCur: trip.localCurrency, note: '' });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const areas = Array.from(new Set(wishes.map((w) => w.area).filter(Boolean)));

  const save = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    const est = String(f.est).trim() === '0' ? 0 : parseAmount(f.est) || null;
    const data = { title: f.title.trim(), type: f.type, area: f.area.trim(), est, estCur: f.estCur, note: f.note.trim() };
    if (editing) updateRow(trip.id, 'wishlist', wish.id, data);
    else addRow(trip.id, 'wishlist', { ...data, keen: [me] });
    flash(editing ? 'Saved' : 'Added to the wishlist');
    close();
  };

  return (
    <Sheet onClose={close} label="Wishlist idea">
      <form className="stack" style={{ gap: 14 }} onSubmit={save}>
        <SheetHead title={editing ? 'Edit idea' : 'New idea'} onClose={close} />
        <Field label="What" id="w-title"><input id="w-title" className="input" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Sunrise at Wat Arun" required /></Field>
        <TypePicker types={['activity', 'food', 'boat', 'transport', 'hotel', 'flight']} value={f.type} onChange={(v) => set('type', v)} />
        <div className="grid2">
          <Field label="Where" id="w-area">
            <input id="w-area" className="input" list="w-areas" value={f.area} onChange={(e) => set('area', e.target.value)} placeholder="e.g. Bangkok" />
            <datalist id="w-areas">{areas.map((a) => <option key={a} value={a} />)}</datalist>
          </Field>
          <div className="field">
            <label htmlFor="w-est">Rough cost</label>
            <div className="row" style={{ gap: 6 }}>
              <input id="w-est" className="input grow" inputMode="decimal" value={f.est} onChange={(e) => set('est', e.target.value)} placeholder="Optional" />
              <select aria-label="Currency" className="input" style={{ width: 84, flexShrink: 0 }} value={f.estCur} onChange={(e) => set('estCur', e.target.value)}>
                {currenciesOf(trip).map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
        <Field label="Note" id="w-note"><textarea id="w-note" className="input" value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="Why it's worth it, opening times…" /></Field>
        <button className="btn primary" disabled={!f.title.trim()}>{editing ? 'Save changes' : 'Save to wishlist'}</button>
        {editing && <ConfirmButton onConfirm={() => { deleteRow(trip.id, 'wishlist', wish.id); close(); }} />}
      </form>
    </Sheet>
  );
}

export function PlanWish({ ctx, wish }) {
  const { trip, me, days, now, close, flash, setDayIdx } = ctx;
  const startDay = days.indexOf(now.date) >= 0 ? now.date : days[0];
  const [f, setF] = useState({ date: startDay, start: '10:00', end: '12:00' });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));

  const save = (e) => {
    e.preventDefault();
    const end = tm(f.end) > tm(f.start) ? f.end : fromMin(Math.min(tm(f.start) + 60, 1425));
    const place = wish.area || '';
    const itemId = addRow(trip.id, 'items', {
      type: wish.type || 'activity', title: wish.title, date: f.date, start: f.start, end, allDay: false,
      place, q: wish.title + (place ? ', ' + place : ''), note: wish.note || '', ref: '', by: me
    });
    updateRow(trip.id, 'wishlist', wish.id, { itemId });
    setDayIdx(days.indexOf(f.date));
    flash('On the itinerary');
    close();
  };

  return (
    <Sheet onClose={close} label="Add to a day">
      <form className="stack" style={{ gap: 16 }} onSubmit={save}>
        <SheetHead title={wish.title} sub="Add to the itinerary" onClose={close} />
        <Field label="Which day" id="p-day">
          <select id="p-day" className="input" value={f.date} onChange={(e) => set('date', e.target.value)}>
            {days.map((d) => <option key={d} value={d}>{dayLabel(days, d)}</option>)}
          </select>
        </Field>
        <div className="grid2">
          <Field label="From" id="p-s"><TimeSelect id="p-s" value={f.start} onChange={(v) => set('start', v)} /></Field>
          <Field label="To" id="p-e"><TimeSelect id="p-e" value={f.end} onChange={(v) => set('end', v)} /></Field>
        </div>
        <button className="btn primary">Add to {dayLabel(days, f.date).split(' · ')[0]}</button>
      </form>
    </Sheet>
  );
}
