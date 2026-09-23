import { useState } from 'react';
import { Sheet, SheetHead, Field, Chips, Seg, ConfirmButton } from '../components/ui.jsx';
import Attachments from '../components/Attachments.jsx';
import { EXP_CATS, parseAmount, nameOf, currenciesOf, lastCurrency, rememberCurrency } from '../lib/util.js';
import { addRow, updateRow, deleteRow, addAttachment } from '../lib/data.js';

export default function ExpenseForm({ ctx, expense }) {
  const { trip, me, now, close, flash } = ctx;
  const editing = !!expense;
  const [f, setF] = useState(() => expense ? { ...expense, amount: String(expense.amount), date: expense.date || '' } : {
    title: '', amount: '', cur: lastCurrency(trip), cat: 'food', date: now.date, paidBy: me, split: 'half'
  });
  const [pending, setPending] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const amount = parseAmount(f.amount);
  const transfer = f.split === 'transfer';

  const save = (e) => {
    e.preventDefault();
    if (!f.title.trim() || !amount) return;
    rememberCurrency(trip, f.cur);
    const data = { title: f.title.trim(), amount, cur: f.cur, cat: f.cat, date: f.date || null, paidBy: f.paidBy, split: f.split };
    if (editing) updateRow(trip.id, 'expenses', expense.id, data);
    else {
      const id = addRow(trip.id, 'expenses', data);
      if (pending) addAttachment(trip.id, { ...pending.meta, parentId: 'exp:' + id }, pending.dataUrl);
    }
    flash(editing ? 'Saved' : 'Expense added');
    close();
  };

  return (
    <Sheet onClose={close} label="Expense">
      <form className="stack" style={{ gap: 14 }} onSubmit={save}>
        <SheetHead title={editing ? 'Edit expense' : 'Add an expense'} sub={transfer ? 'A payment between the two of you' : 'For anything paid outside the itinerary'} onClose={close} />
        <Field label="What was it" id="x-title"><input id="x-title" className="input" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Taxi from the pier" required /></Field>
        <div className="grid3">
          <Field label="Amount" id="x-amount" style={{ gridColumn: 'span 2' }}>
            <input id="x-amount" className="input" inputMode="decimal" value={f.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0" required />
          </Field>
          <Field label="Currency" id="x-cur">
            <select id="x-cur" className="input" value={f.cur} onChange={(e) => set('cur', e.target.value)}>
              {currenciesOf(trip).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        {!transfer && <Chips label="Category" value={f.cat} onChange={(v) => set('cat', v)} options={Object.keys(EXP_CATS).map((k) => ({ value: k, label: EXP_CATS[k].label }))} />}
        <div className="grid2">
          <Field label="When (empty = before the trip)" id="x-date"><input id="x-date" className="input" type="date" value={f.date} onChange={(e) => set('date', e.target.value)} /></Field>
          <Field label="Paid by" id="x-paid">
            <select id="x-paid" className="input" value={f.paidBy} onChange={(e) => set('paidBy', e.target.value)}>
              {trip.members.map((m) => <option key={m} value={m}>{nameOf(trip, m)}</option>)}
            </select>
          </Field>
        </div>
        {!transfer && trip.members.length > 1 && (
          <Seg label="Split" value={f.split} onChange={(v) => set('split', v)} options={[{ value: 'half', label: 'Split equally' }, { value: 'payer', label: 'Just the payer' }]} />
        )}
        <Attachments ctx={ctx} parentId={editing ? 'exp:' + expense.id : null} label="Attach a receipt photo" pending={pending} onPending={setPending} />
        <button className="btn primary" disabled={!f.title.trim() || !amount}>Save expense</button>
        {editing && <ConfirmButton onConfirm={() => { deleteRow(trip.id, 'expenses', expense.id); close(); }} />}
      </form>
    </Sheet>
  );
}
