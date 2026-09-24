import { useState } from 'react';
import { Sheet, SheetHead, Field, Chips, Seg, ConfirmButton } from '../components/ui.jsx';
import { t } from '../lib/i18n.js';
import Attachments from '../components/Attachments.jsx';
import RateField from '../components/RateField.jsx';
import { EXP_CATS, parseAmount, nameOf, currenciesOf, lastCurrency, rememberCurrency } from '../lib/util.js';
import { addRow, updateRow, deleteRow, addAttachment } from '../lib/data.js';

export default function ExpenseForm({ ctx, expense }) {
  const { trip, me, now, close, flash } = ctx;
  const editing = !!expense;
  const [f, setF] = useState(() => expense ? { ...expense, amount: String(expense.amount), date: expense.date || '', rate: expense.rate ? String(expense.rate) : '', rateTouched: !!expense.rate, paid: expense.paid !== false } : {
    title: '', amount: '', cur: lastCurrency(trip), cat: 'food', date: now.date, paidBy: me, split: 'half', rate: '', rateTouched: false, paid: true
  });
  const [pending, setPending] = useState(null);
  const set = (k, v) => setF((x) => ({ ...x, [k]: v }));
  const amount = parseAmount(f.amount);
  const transfer = f.split === 'transfer';

  const save = (e) => {
    e.preventDefault();
    if (!f.title.trim() || !amount) return;
    rememberCurrency(trip, f.cur);
    const data = { title: f.title.trim(), amount, cur: f.cur, cat: f.cat, date: f.date || null, paidBy: f.paidBy, split: f.split,
      rate: f.cur !== (trip.homeCurrency || 'EUR') && parseAmount(f.rate) ? parseAmount(f.rate) : null, paid: transfer ? true : f.paid };
    if (editing) updateRow(trip.id, 'expenses', expense.id, data);
    else {
      const id = addRow(trip.id, 'expenses', data);
      if (pending) addAttachment(trip.id, { ...pending.meta, parentId: 'exp:' + id }, pending.dataUrl);
    }
    flash(editing ? t('Saved') : t('Expense added'));
    close();
  };

  return (
    <Sheet onClose={close} label={t('Expense')}>
      <form className="stack" style={{ gap: 14 }} onSubmit={save}>
        <SheetHead title={editing ? t('Edit expense') : t('Add an expense')} sub={transfer ? t('A payment between the two of you') : t('For anything paid outside the itinerary')} onClose={close} />
        <Field label={t('What was it')} id="x-title"><input id="x-title" className="input" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder={t('e.g. Taxi from the pier')} required /></Field>
        <div className="grid3">
          <Field label={t('Amount')} id="x-amount" style={{ gridColumn: 'span 2' }}>
            <input id="x-amount" className="input" inputMode="decimal" value={f.amount} onChange={(e) => set('amount', e.target.value)} placeholder="0" required />
          </Field>
          <Field label={t('Currency')} id="x-cur">
            <select id="x-cur" className="input" value={f.cur} onChange={(e) => setF((x) => ({ ...x, cur: e.target.value, rateTouched: false }))}>
              {currenciesOf(trip).map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        {!transfer && <Chips label={t('Category')} value={f.cat} onChange={(v) => set('cat', v)} options={Object.keys(EXP_CATS).map((k) => ({ value: k, label: EXP_CATS[k].label }))} />}
        <div className="grid2">
          <Field label={t('When (empty = before the trip)')} id="x-date"><input id="x-date" className="input" type="date" value={f.date} onChange={(e) => setF((x) => ({ ...x, date: e.target.value, rateTouched: x.rateTouched && x.date === e.target.value }))} /></Field>
          <Field label={t('Paid by')} id="x-paid">
            <select id="x-paid" className="input" value={f.paidBy} onChange={(e) => set('paidBy', e.target.value)}>
              {trip.members.map((m) => <option key={m} value={m}>{nameOf(trip, m)}</option>)}
            </select>
          </Field>
        </div>
        {amount > 0 && (
          <RateField trip={trip} cur={f.cur} date={f.date || trip.startDate} value={f.rate} touched={f.rateTouched}
            onChange={(v, touched) => setF((x) => ({ ...x, rate: v, rateTouched: touched }))} />
        )}
        {!transfer && (
          <Seg label={t('Paid')} value={f.paid} onChange={(v) => set('paid', v)} options={[{ value: true, label: t('Paid') }, { value: false, label: t('Still to pay') }]} />
        )}
        {!transfer && trip.members.length > 1 && (
          <Seg label={t('Split')} value={f.split} onChange={(v) => set('split', v)} options={[{ value: 'half', label: t('Split equally') }, { value: 'payer', label: t('Just the payer') }]} />
        )}
        <Attachments ctx={ctx} parentId={editing ? 'exp:' + expense.id : null} label={t('Attach a receipt photo')} pending={pending} onPending={setPending} />
        <button className="btn primary" disabled={!f.title.trim() || !amount}>{t('Save expense')}</button>
        {editing && <ConfirmButton onConfirm={() => { deleteRow(trip.id, 'expenses', expense.id); close(); }} />}
      </form>
    </Sheet>
  );
}
