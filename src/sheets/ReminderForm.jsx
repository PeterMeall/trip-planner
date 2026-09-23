import { useState } from 'react';
import { Sheet, SheetHead, Field, Chips, Seg, TimeSelect, ConfirmButton } from '../components/ui.jsx';
import { REMINDER_CATS, nameOf } from '../lib/util.js';
import { addRow, updateRow, deleteRow } from '../lib/data.js';
import { dayLabel } from '../lib/trip.js';

export default function ReminderForm({ ctx, reminder, itemId }) {
  const { trip, items, days, now, close, flash, setTab } = ctx;
  const editing = !!reminder;
  const linked0 = itemId ? items.find((it) => it.id === itemId) : null;
  const [f, setF] = useState(() => reminder ? { note: '', ...reminder, date: reminder.date || '', itemId: reminder.itemId || '' } : {
    cat: 'cancel', title: '', date: linked0 && linked0.date > now.date ? linked0.date : now.date, time: '18:00', who: 'both', itemId: itemId || '', note: ''
  });
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const linked = f.itemId ? items.find((it) => it.id === f.itemId) : null;

  const save = (e) => {
    e.preventDefault();
    if (!f.title.trim()) return;
    const data = { cat: f.cat, title: f.title.trim(), date: f.date || null, time: f.time, who: f.who, itemId: f.itemId || null, note: (f.note || '').trim(), done: !!f.done };
    if (editing) updateRow(trip.id, 'reminders', reminder.id, data);
    else { addRow(trip.id, 'reminders', data); setTab('rem'); }
    flash(editing ? 'Saved' : 'Reminder added');
    close();
  };

  return (
    <Sheet onClose={close} label="Reminder">
      <form className="stack" style={{ gap: 14 }} onSubmit={save}>
        <SheetHead title={editing ? 'Edit reminder' : 'New reminder'} sub={linked ? 'Linked to ' + linked.title : 'Not linked to a booking'} onClose={close} />
        <Chips label="Kind of reminder" value={f.cat} onChange={(v) => set('cat', v)}
          options={Object.keys(REMINDER_CATS).map((k) => ({ value: k, label: REMINDER_CATS[k].label, style: { background: REMINDER_CATS[k].bg, color: REMINDER_CATS[k].fg, border: '2px solid ' + REMINDER_CATS[k].fg } }))} />
        <Field label="What needs doing" id="r-title">
          <input id="r-title" className="input" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Cancel the backup hotel" required />
        </Field>
        <div className="grid2">
          <Field label="Do it by" id="r-date"><input id="r-date" className="input" type="date" value={f.date} onChange={(e) => set('date', e.target.value)} /></Field>
          <Field label="Time" id="r-time"><TimeSelect id="r-time" value={f.time} onChange={(v) => set('time', v)} /></Field>
        </div>
        <div className="field">
          <span className="label">Who's on it</span>
          <Seg label="Who's on it" value={f.who} onChange={(v) => set('who', v)}
            options={trip.members.map((m) => ({ value: m, label: nameOf(trip, m) })).concat([{ value: 'both', label: 'Both' }])} />
        </div>
        <Field label="Linked booking (optional)" id="r-item">
          <select id="r-item" className="input" value={f.itemId} onChange={(e) => set('itemId', e.target.value)}>
            <option value="">None</option>
            {items.map((it) => <option key={it.id} value={it.id}>{it.title} ({dayLabel(days, it.date).split(' · ')[0]})</option>)}
          </select>
        </Field>
        <Field label="Note (optional)" id="r-note">
          <input id="r-note" className="input" value={f.note} onChange={(e) => set('note', e.target.value)} placeholder="e.g. Free cancellation until then" />
        </Field>
        <button className="btn primary" disabled={!f.title.trim()}>Save reminder</button>
        {editing && <ConfirmButton onConfirm={() => { deleteRow(trip.id, 'reminders', reminder.id); close(); }} />}
      </form>
    </Sheet>
  );
}
