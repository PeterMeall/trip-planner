import { useState } from 'react';
import { Sheet, SheetHead, Field, TypePicker, TimeSelect, Seg, ConfirmButton } from '../components/ui.jsx';
import { TYPE_ORDER, tm, fromMin, parseAmount, nameOf, addDays, currenciesOf, lastCurrency, rememberCurrency } from '../lib/util.js';
import { addRow, updateRow, deleteRow } from '../lib/data.js';
import { dayLabel } from '../lib/trip.js';

export default function ItemForm({ ctx, item, date, start, type }) {
  const { trip, me, days, close, open, flash } = ctx;
  const editing = !!item;
  const s0 = start || '10:00';
  const [f, setF] = useState(() => item ? {
    ...item, price: item.price ? String(item.price) : '', cur: item.cur || trip.localCurrency, paidBy: item.paidBy || me, split: item.split || 'half',
    endDate: item.endDate || addDays(item.date, 1), allDay: !!item.allDay
  } : {
    type: type || 'activity', title: '', date: date || days[0], endDate: addDays(date || days[0], 1),
    start: type === 'hotel' ? '14:00' : s0, end: type === 'hotel' ? '11:00' : fromMin(Math.min(tm(s0) + 60, 1425)),
    allDay: false, place: '', ref: '', note: '', price: '', cur: lastCurrency(trip), paidBy: me, split: 'half'
  });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const stay = f.type === 'hotel';

  const setStart = (v) => setF((x) => ({ ...x, start: v, end: tm(x.end) > tm(v) || stay ? x.end : fromMin(Math.min(tm(v) + 60, 1425)) }));

  const save = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    const price = parseAmount(f.price);
    if (price) rememberCurrency(trip, f.cur);
    const data = {
      type: f.type, title: f.title.trim(), date: f.date, start: f.allDay && !stay ? '' : f.start, end: f.allDay && !stay ? '' : f.end,
      allDay: !stay && f.allDay, place: f.place.trim(), q: f.place.trim() || f.title.trim(), ref: f.ref.trim(), note: f.note.trim(),
      price: price || null, cur: price ? f.cur : null, paidBy: price ? f.paidBy : null, split: price ? f.split : null,
      endDate: stay ? (f.endDate > f.date ? f.endDate : addDays(f.date, 1)) : null
    };
    if (editing) { updateRow(trip.id, 'items', item.id, data); open({ kind: 'item', id: item.id }); return; }
    addRow(trip.id, 'items', { ...data, by: me });
    flash(price ? 'Added, and the cost is in Expenses' : 'Added');
    close();
    if (days.indexOf(data.date) >= 0) ctx.setDayIdx(days.indexOf(data.date));
  };

  const remove = () => {
    deleteRow(trip.id, 'items', item.id);
    flash('Deleted');
    close();
  };

  const members = trip.members || [me];
  return (
    <Sheet onClose={close} label={editing ? 'Edit' : 'Add to the day'}>
      <form className="stack" style={{ gap: 14 }} onSubmit={save}>
        <SheetHead title={editing ? 'Edit' : stay ? 'Add a stay' : 'Add to the day'} sub={stay ? 'Shows as the hotel band on each night' : dayLabel(days, f.date)} onClose={close} />
        <TypePicker types={TYPE_ORDER} value={f.type} onChange={(v) => set('type', v)} />
        <Field label={stay ? 'Hotel or place name' : 'What'} id="i-title">
          <input id="i-title" className="input" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder={stay ? 'e.g. Riverside hotel' : 'e.g. Sunset at the pier'} required />
        </Field>

        {stay ? (
          <>
            <div className="grid2">
              <Field label="Check in" id="i-d1"><input id="i-d1" className="input" type="date" value={f.date} onChange={(e) => set('date', e.target.value)} /></Field>
              <Field label="Check out" id="i-d2"><input id="i-d2" className="input" type="date" value={f.endDate} onChange={(e) => set('endDate', e.target.value)} /></Field>
            </div>
            <div className="grid2">
              <Field label="Check-in from" id="i-s"><TimeSelect id="i-s" value={f.start} onChange={(v) => set('start', v)} /></Field>
              <Field label="Check-out by" id="i-e"><TimeSelect id="i-e" value={f.end} onChange={(v) => set('end', v)} /></Field>
            </div>
          </>
        ) : (
          <>
            <Field label="Day" id="i-day">
              <select id="i-day" className="input" value={f.date} onChange={(e) => set('date', e.target.value)}>
                {days.map((d) => <option key={d} value={d}>{dayLabel(days, d)}</option>)}
              </select>
            </Field>
            <Seg options={[{ value: false, label: 'Set times' }, { value: true, label: 'All day' }]} value={f.allDay} onChange={(v) => set('allDay', v)} label="Timing" />
            {!f.allDay && (
              <div className="grid2">
                <Field label="From" id="i-s"><TimeSelect id="i-s" value={f.start} onChange={setStart} /></Field>
                <Field label="To" id="i-e"><TimeSelect id="i-e" value={f.end} onChange={(v) => set('end', v)} /></Field>
              </div>
            )}
          </>
        )}

        <Field label="Where (used for directions)" id="i-place">
          <input id="i-place" className="input" value={f.place} onChange={(e) => set('place', e.target.value)} placeholder="Place name or address" />
        </Field>

        <div className="grid3">
          <Field label="Price" id="i-price">
            <input id="i-price" className="input" inputMode="decimal" value={f.price} onChange={(e) => set('price', e.target.value)} placeholder="Optional" />
          </Field>
          <Field label="Currency" id="i-cur">
            <select id="i-cur" className="input" value={f.cur} onChange={(e) => set('cur', e.target.value)}>
              {currenciesOf(trip).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Paid by" id="i-paid">
            <select id="i-paid" className="input" value={f.paidBy} onChange={(e) => set('paidBy', e.target.value)}>
              {members.map((m) => <option key={m} value={m}>{nameOf(trip, m)}</option>)}
            </select>
          </Field>
        </div>
        {parseAmount(f.price) > 0 && members.length > 1 && (
          <Seg options={[{ value: 'half', label: 'Split equally' }, { value: 'payer', label: 'Just the payer' }]} value={f.split} onChange={(v) => set('split', v)} label="Split" />
        )}

        <Field label="Booking reference" id="i-ref"><input id="i-ref" className="input" value={f.ref} onChange={(e) => set('ref', e.target.value)} placeholder="Optional" /></Field>
        <Field label="Notes" id="i-note"><textarea id="i-note" className="input" value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="Optional" /></Field>

        <button className="btn primary" disabled={!f.title.trim()}>{editing ? 'Save changes' : 'Add'}</button>
        {editing && <ConfirmButton onConfirm={remove} />}
      </form>
    </Sheet>
  );
}
