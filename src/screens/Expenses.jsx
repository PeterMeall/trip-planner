import { useState } from 'react';
import { Fab, TypeBubble, Icon } from '../components/ui.jsx';
import { EXP_CATS, TYPES, OTHER_LOOK, money, nameOf, toLocal } from '../lib/util.js';
import { allExpenses, balances, dayLabel } from '../lib/trip.js';
import { addRow } from '../lib/data.js';

export default function Expenses({ ctx }) {
  const { trip, items, expenses, days, open, nowKey, attachments, flash } = ctx;
  const [filter, setFilter] = useState('all');
  const home = trip.homeCurrency || 'EUR';
  const local = trip.localCurrency || 'THB';
  const all = allExpenses(items, expenses, trip, nowKey);
  const spend = all.filter((e) => e.split !== 'transfer');
  const total = spend.reduce((a, e) => a + e.home, 0);
  const spent = spend.filter((e) => !e.planned).reduce((a, e) => a + e.home, 0);
  const cats = Object.keys(EXP_CATS).map((k) => ({ k, ...EXP_CATS[k], sum: spend.filter((e) => e.cat === k).reduce((a, e) => a + e.home, 0) })).filter((c) => c.sum > 0);

  const members = trip.members || [];
  const { bal, paid } = balances(all, members);
  let balanceText = 'All square';
  let settle = null;
  if (members.length === 2) {
    const [a, b] = members;
    if (bal[a] > 0.5) { balanceText = nameOf(trip, b) + ' owes ' + nameOf(trip, a) + ' ' + money(bal[a], home); settle = { from: b, to: a, amount: bal[a] }; }
    else if (bal[b] > 0.5) { balanceText = nameOf(trip, a) + ' owes ' + nameOf(trip, b) + ' ' + money(bal[b], home); settle = { from: a, to: b, amount: bal[b] }; }
  }
  const doSettle = () => {
    if (!settle) return;
    addRow(trip.id, 'expenses', {
      title: 'Settled up: ' + nameOf(trip, settle.from) + ' paid ' + nameOf(trip, settle.to),
      amount: Math.round(settle.amount * 100) / 100, cur: home, cat: 'other', date: new Date().toISOString().slice(0, 10),
      paidBy: settle.from, to: settle.to, split: 'transfer'
    });
    flash('Settled up');
  };

  const shown = all.filter((e) => filter === 'all' || e.src === filter);
  const keys = Array.from(new Set(shown.map((e) => (e.date && days.indexOf(e.date) >= 0 ? e.date : (e.date && e.date > days[days.length - 1] ? 'after' : 'before'))))).sort((x, y) => {
    const rank = (k) => (k === 'before' ? '0' : k === 'after' ? '9' : '5' + k);
    return rank(x).localeCompare(rank(y));
  });
  const groupOf = (e) => (e.date && days.indexOf(e.date) >= 0 ? e.date : (e.date && e.date > days[days.length - 1] ? 'after' : 'before'));

  return (
    <>
      <main className="screen">
        <div className="between">
          <h1 className="h1">Expenses</h1>
          <span className="small muted" style={{ textAlign: 'right' }}>1 {home} = {[{ code: local, rate: trip.rate }].concat(trip.extraCurrencies || []).map((c) => Number(c.rate).toLocaleString('en-GB') + ' ' + c.code).join(' · ')}</span>
        </div>

        <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14, borderRadius: 20 }}>
          <div className="stack" style={{ gap: 2 }}>
            <span className="eyebrow">Trip total</span>
            <span style={{ fontFamily: 'var(--display)', fontSize: 40, fontWeight: 500, lineHeight: 1.1 }}>{money(total, home)}</span>
            <span className="small muted" style={{ fontSize: 14 }}>
              ≈ {money(toLocal(total, home, trip), local)} · {money(spent, home)} spent so far · {money(total - spent, home)} still to come
            </span>
          </div>
          {cats.length > 0 && (
            <>
              <div className="stackbar" aria-hidden="true">
                {cats.map((c) => <span key={c.k} title={c.label + ': ' + money(c.sum, home)} style={{ flexGrow: c.sum, background: c.color }} />)}
              </div>
              <div className="legend" role="list" aria-label="Spending by category">
                {cats.map((c) => (
                  <div key={c.k} role="listitem"><i style={{ background: c.color }} /><span className="grow" style={{ color: 'var(--ink-2)' }}>{c.label}</span><b className="num">{money(c.sum, home)}</b></div>
                ))}
              </div>
            </>
          )}
        </div>

        {members.length === 2 && (
          <div className="card row" style={{ padding: 14, gap: 12 }}>
            <div className="stack grow" style={{ gap: 2 }}>
              <span className="eyebrow">Balance</span>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{balanceText}</span>
              <span className="small muted">{members.map((m) => nameOf(trip, m) + ' paid ' + money(paid[m], home)).join(' · ')}</span>
            </div>
            {settle && <button className="btn sm outline" style={{ height: 44 }} onClick={doSettle}>Settle up</button>}
          </div>
        )}

        <div className="chips" role="group" aria-label="Filter expenses">
          {[['all', 'All'], ['itinerary', 'From itinerary'], ['manual', 'Added manually']].map(([v, l]) => (
            <button key={v} className={'chip' + (filter === v ? ' on' : '')} aria-pressed={filter === v} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>

        {!all.length && <div className="empty">Add a price when you put something on the itinerary and it shows up here. Anything else, add with the + button.</div>}

        {keys.map((k) => {
          const list = shown.filter((e) => groupOf(e) === k);
          const sum = list.filter((e) => e.split !== 'transfer').reduce((a, e) => a + e.home, 0);
          return (
            <section key={k} className="section" style={{ gap: 8 }}>
              <div className="between">
                <h2 className="eyebrow">{k === 'before' ? 'Before the trip' : k === 'after' ? 'After the trip' : dayLabel(days, k)}</h2>
                <span className="small muted" style={{ fontWeight: 700 }}>{money(sum, home)}</span>
              </div>
              <div className="card list">
                {list.map((e) => {
                  const look = e.src === 'itinerary' ? (TYPES[e.type] || TYPES.activity) : (EXP_CATS[e.cat] && TYPES[EXP_CATS[e.cat].type]) || OTHER_LOOK;
                  const receipt = e.src === 'manual' && attachments.some((a) => a.parentId === 'exp:' + e.id);
                  const meta = e.split === 'transfer' ? ['Payment between you'] : [
                    'Paid by ' + nameOf(trip, e.paidBy), e.split === 'payer' ? 'not split' : 'split equally',
                    e.src === 'itinerary' ? 'from itinerary' : 'added manually'
                  ];
                  if (receipt) meta.push('receipt');
                  if (e.planned) meta.push('planned');
                  return (
                    <button key={e.key} className="row-btn" style={{ minHeight: 60 }}
                      onClick={() => (e.src === 'itinerary' ? open({ kind: 'item', id: e.itemId }) : open({ kind: 'expForm', expense: expenses.find((x) => x.id === e.id) }))}>
                      <TypeBubble look={look} />
                      <span className="stack grow" style={{ gap: 2 }}>
                        <span className="row-title">{e.title}</span>
                        <span className="row-meta">{meta.join(' · ')}</span>
                      </span>
                      <span className="stack" style={{ alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                        <span className="num" style={{ fontSize: 15, fontWeight: 700 }}>{money(e.amount, e.cur)}</span>
                        <span className="num small muted" style={{ fontSize: 12 }}>≈ {e.cur === home ? money(toLocal(e.amount, e.cur, trip), local) : money(e.home, home)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
      <Fab label="Add an expense" onClick={() => open({ kind: 'expForm' })} />
    </>
  );
}
