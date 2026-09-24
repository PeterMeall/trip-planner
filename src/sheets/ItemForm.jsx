import { useState } from 'react';
import { Sheet, SheetHead, Field, TypePicker, TimeSelect, Seg, ConfirmButton } from '../components/ui.jsx';
import { t } from '../lib/i18n.js';
import { TYPE_ORDER, TRAVEL_TYPES, ZONES, tm, fromMin, parseAmount, nameOf, addDays, currenciesOf, lastCurrency, rememberCurrency, zonedMs, utcOffsetLabel, cityOf, durationLabel } from '../lib/util.js';
import { addRow, updateRow, deleteRow } from '../lib/data.js';
import RateField from '../components/RateField.jsx';
import { dayLabel, endDateOf, tripTz } from '../lib/trip.js';

export default function ItemForm({ ctx, item, date, start, type }) {
  const { trip, me, days, close, open, flash } = ctx;
  const editing = !!item;
  const s0 = start || '10:00';
  const [f, setF] = useState(() => item ? {
    ...item, price: item.price ? String(item.price) : '', cur: item.cur || trip.localCurrency, paidBy: item.paidBy || me, split: item.split || 'half',
    rate: item.rate ? String(item.rate) : '', rateTouched: !!item.rate, paid: item.paid !== false,
    endDate: item.endDate || addDays(item.date, 1), allDay: !!item.allDay,
    arrDate: endDateOf(item), startTz: item.startTz || tripTz(trip), endTz: item.endTz || item.startTz || tripTz(trip)
  } : {
    type: type || 'activity', title: '', date: date || days[0], endDate: addDays(date || days[0], 1),
    start: type === 'hotel' ? '14:00' : s0, end: type === 'hotel' ? '11:00' : fromMin(Math.min(tm(s0) + 60, 1425)),
    allDay: false, place: '', ref: '', note: '', price: '', cur: lastCurrency(trip), paidBy: me, split: 'half', rate: '', rateTouched: false, paid: true,
    arrDate: date || days[0], startTz: tripTz(trip), endTz: tripTz(trip)
  });
  const [error, setError] = useState('');
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const stay = f.type === 'hotel';
  const travel = TRAVEL_TYPES.includes(f.type) && !f.allDay;
  const setDate = (v) => setF((x) => ({ ...x, date: v, rateTouched: x.rateTouched && x.date === v, arrDate: x.arrDate < v || x.arrDate === x.date ? v : x.arrDate }));
  // Arrival can be up to three days after departure (long-haul flights, overnight trains and ferries).
  const arrOptions = [0, 1, 2, 3].map((n) => addDays(f.date, n));
  const journeyMs = travel ? zonedMs(f.arrDate, f.end, f.endTz) - zonedMs(f.date, f.start, f.startTz) : 0;

  const setStart = (v) => setF((x) => ({ ...x, start: v, end: tm(x.end) > tm(v) || stay ? x.end : fromMin(Math.min(tm(v) + 60, 1425)) }));

  const save = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    const price = parseAmount(f.price);
    if (travel && journeyMs <= 0) { setError(t('It arrives before it departs. Check the days, times and time zones.')); return; }
    if (price) rememberCurrency(trip, f.cur);
    // Travel keeps its own days and time zones; anything else that ends "earlier" than it starts runs past midnight.
    const zoned = travel && (f.startTz !== tripTz(trip) || f.endTz !== tripTz(trip));
    const otherEnd = !stay && !f.allDay && !travel && tm(f.end) < tm(f.start) ? addDays(f.date, 1) : null;
    const data = {
      type: f.type, title: f.title.trim(), date: f.date, start: f.allDay && !stay ? '' : f.start, end: f.allDay && !stay ? '' : f.end,
      allDay: !stay && f.allDay, place: f.place.trim(), q: f.place.trim() || f.title.trim(), ref: f.ref.trim(), note: f.note.trim(),
      price: price || null, cur: price ? f.cur : null, paidBy: price ? f.paidBy : null, split: price ? f.split : null,
      rate: price && f.cur !== trip.homeCurrency && parseAmount(f.rate) ? parseAmount(f.rate) : null, paid: price ? f.paid : null,
      endDate: stay ? (f.endDate > f.date ? f.endDate : addDays(f.date, 1)) : travel ? (f.arrDate !== f.date ? f.arrDate : null) : otherEnd,
      startTz: zoned ? f.startTz : null, endTz: zoned ? f.endTz : null
    };
    if (editing) { updateRow(trip.id, 'items', item.id, data); open({ kind: 'item', id: item.id }); return; }
    addRow(trip.id, 'items', { ...data, by: me });
    flash(price ? t('Added, and the cost is in Expenses') : t('Added'));
    close();
    if (days.indexOf(data.date) >= 0) ctx.setDayIdx(days.indexOf(data.date));
  };

  const remove = () => {
    deleteRow(trip.id, 'items', item.id);
    flash(t('Deleted'));
    close();
  };

  const members = trip.members || [me];
  return (
    <Sheet onClose={close} label={editing ? t('Edit') : t('Add to the day')}>
      <form className="stack" style={{ gap: 14 }} onSubmit={save}>
        <SheetHead title={editing ? t('Edit') : stay ? t('Add a stay') : t('Add to the day')} sub={stay ? t('Shows as the hotel band on each night') : dayLabel(days, f.date)} onClose={close} />
        <TypePicker types={TYPE_ORDER} value={f.type} onChange={(v) => set('type', v)} />
        <Field label={stay ? t('Hotel or place name') : t('What')} id="i-title">
          <input id="i-title" className="input" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder={stay ? t('e.g. Riverside hotel') : t('e.g. Sunset at the pier')} required />
        </Field>

        {stay ? (
          <>
            <div className="grid2">
              <Field label={t('Check in')} id="i-d1"><input id="i-d1" className="input" type="date" value={f.date} onChange={(e) => set('date', e.target.value)} /></Field>
              <Field label={t('Check out')} id="i-d2"><input id="i-d2" className="input" type="date" value={f.endDate} onChange={(e) => set('endDate', e.target.value)} /></Field>
            </div>
            <div className="grid2">
              <Field label={t('Check-in from')} id="i-s"><TimeSelect id="i-s" value={f.start} onChange={(v) => set('start', v)} /></Field>
              <Field label={t('Check-out by')} id="i-e"><TimeSelect id="i-e" value={f.end} onChange={(v) => set('end', v)} /></Field>
            </div>
          </>
        ) : (
          <>
            <Field label={travel ? t('Departs') : t('Day')} id="i-day">
              <select id="i-day" className="input" value={f.date} onChange={(e) => setDate(e.target.value)}>
                {days.map((d) => <option key={d} value={d}>{dayLabel(days, d)}</option>)}
              </select>
            </Field>
            <Seg options={[{ value: false, label: t('Set times') }, { value: true, label: t('All day') }]} value={f.allDay} onChange={(v) => set('allDay', v)} label={t('Timing')} />
            {!f.allDay && !travel && (
              <>
                <div className="grid2">
                  <Field label={t('From')} id="i-s"><TimeSelect id="i-s" value={f.start} onChange={setStart} /></Field>
                  <Field label={t('To')} id="i-e"><TimeSelect id="i-e" value={f.end} onChange={(v) => set('end', v)} /></Field>
                </div>
                {tm(f.end) < tm(f.start) && <span className="small muted">{t('Ends the next day')}</span>}
              </>
            )}
            {travel && (
              <div className="card" style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, borderRadius: 14 }}>
                <div className="grid2" style={{ gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.7fr)' }}>
                  <Field label={t('Departure time')} id="i-s"><TimeSelect id="i-s" value={f.start} onChange={(v) => set('start', v)} /></Field>
                  <Field label={t('Time zone')} id="i-sz"><ZoneSelect id="i-sz" value={f.startTz} date={f.date} onChange={(v) => setF((x) => ({ ...x, startTz: v, endTz: x.endTz === x.startTz ? v : x.endTz }))} /></Field>
                </div>
                <div className="grid2" style={{ gridTemplateColumns: 'minmax(0, 1.7fr) minmax(0, 1fr)' }}>
                  <Field label={t('Arrives')} id="i-ad">
                    <select id="i-ad" className="input" value={f.arrDate} onChange={(e) => set('arrDate', e.target.value)}>
                      {arrOptions.map((d) => <option key={d} value={d}>{dayLabel(days, d)}</option>)}
                    </select>
                  </Field>
                  <Field label={t('Arrival time')} id="i-e"><TimeSelect id="i-e" value={f.end} onChange={(v) => set('end', v)} /></Field>
                </div>
                <Field label={t('Time zone on arrival')} id="i-ez"><ZoneSelect id="i-ez" value={f.endTz} date={f.arrDate} onChange={(v) => set('endTz', v)} /></Field>
                <span className="small" style={{ fontWeight: 600, color: journeyMs > 0 ? 'var(--muted)' : 'var(--danger)' }}>
                  {journeyMs > 0 ? t('Journey time: {time}', { time: durationLabel(journeyMs) }) : t('It arrives before it departs. Check the days, times and time zones.')}
                </span>
              </div>
            )}
          </>
        )}

        <Field label={t('Where (used for directions)')} id="i-place">
          <input id="i-place" className="input" value={f.place} onChange={(e) => set('place', e.target.value)} placeholder={t('Place name or address')} />
        </Field>

        <div className="grid3">
          <Field label={t('Price')} id="i-price">
            <input id="i-price" className="input" inputMode="decimal" value={f.price} onChange={(e) => set('price', e.target.value)} placeholder={t('Optional')} />
          </Field>
          <Field label={t('Currency')} id="i-cur">
            <select id="i-cur" className="input" value={f.cur} onChange={(e) => setF((x) => ({ ...x, cur: e.target.value, rateTouched: false }))}>
              {currenciesOf(trip).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label={t('Paid by')} id="i-paid">
            <select id="i-paid" className="input" value={f.paidBy} onChange={(e) => set('paidBy', e.target.value)}>
              {members.map((m) => <option key={m} value={m}>{nameOf(trip, m)}</option>)}
            </select>
          </Field>
        </div>
        {parseAmount(f.price) > 0 && (
          <RateField trip={trip} cur={f.cur} date={f.date} value={f.rate} touched={f.rateTouched}
            onChange={(v, touched) => setF((x) => ({ ...x, rate: v, rateTouched: touched }))} />
        )}
        {parseAmount(f.price) > 0 && (
          <Seg options={[{ value: true, label: t('Paid') }, { value: false, label: t('Still to pay') }]} value={f.paid} onChange={(v) => set('paid', v)} label={t('Paid')} />
        )}
        {parseAmount(f.price) > 0 && members.length > 1 && (
          <Seg options={[{ value: 'half', label: t('Split equally') }, { value: 'payer', label: t('Just the payer') }]} value={f.split} onChange={(v) => set('split', v)} label={t('Split')} />
        )}

        <Field label={t('Booking reference')} id="i-ref"><input id="i-ref" className="input" value={f.ref} onChange={(e) => set('ref', e.target.value)} placeholder={t('Optional')} /></Field>
        <Field label={t('Notes')} id="i-note"><textarea id="i-note" className="input" value={f.note} onChange={(e) => set('note', e.target.value)} placeholder={t('Optional')} /></Field>

        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary" disabled={!f.title.trim()}>{editing ? t('Save changes') : t('Add')}</button>
        {editing && <ConfirmButton onConfirm={remove} />}
      </form>
    </Sheet>
  );
}

// Time zone picker: common places, plus whatever the item already uses.
function ZoneSelect({ id, value, date, onChange }) {
  const list = ZONES.some(([z]) => z === value) ? ZONES : [[value, cityOf(value)]].concat(ZONES);
  return (
    <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {list.map(([z, name]) => <option key={z} value={z}>{name} ({utcOffsetLabel(z, date)})</option>)}
    </select>
  );
}
