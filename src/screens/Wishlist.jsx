import { useState } from 'react';
import { Icon, Fab, TypeBubble } from '../components/ui.jsx';
import { money, nameOf } from '../lib/util.js';
import { arrayUnion, arrayRemove } from 'firebase/firestore';
import { updateRow } from '../lib/data.js';
import { dayLabel } from '../lib/trip.js';
import { t } from '../lib/i18n.js';

export default function Wishlist({ ctx }) {
  const { trip, wishes, items, days, open } = ctx;
  const ALL = '__all';
  const [area, setArea] = useState(ALL);
  const areas = [ALL].concat(Array.from(new Set(wishes.map((w) => w.area).filter(Boolean))).sort());
  const shown = wishes.filter((w) => area === ALL || w.area === area)
    .sort((a, b) => Number(!!a.itemId) - Number(!!b.itemId) || String(a.title).localeCompare(String(b.title)));
  const scheduled = wishes.filter((w) => w.itemId && items.some((it) => it.id === w.itemId)).length;

  return (
    <>
      <main className="screen">
        {ctx.listHead}
        <div className="stack">
          <span className="sub">{(wishes.length === 1 ? t('1 idea') : t('{n} ideas', { n: wishes.length })) + ' · ' + t('{n} on the itinerary', { n: scheduled })}</span>
        </div>
        {areas.length > 2 && (
          <div className="chips" role="group" aria-label={t('Filter by area')}>
            {areas.map((a) => <button key={a} className={'chip' + (a === area ? ' on' : '')} aria-pressed={a === area} onClick={() => setArea(a)}>{a === ALL ? t('All') : a}</button>)}
          </div>
        )}
        {!wishes.length && <div className="empty">{t('Collect places you might want to go. When you decide, tap "Add to a day" and it lands on the itinerary.')}</div>}
        {shown.map((w) => {
          const item = w.itemId ? items.find((it) => it.id === w.itemId) : null;
          const cost = w.est === 0 ? t('free') : w.est ? t('about {amount}', { amount: money(w.est, w.estCur || trip.localCurrency) }) : '';
          const keen = Array.isArray(w.keen) ? w.keen : [];
          return (
            <div key={w.id} className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, borderRadius: 18 }}>
              <button className="row" style={{ alignItems: 'flex-start', gap: 12, border: 0, background: 'none', padding: 0, textAlign: 'left' }}
                onClick={() => open({ kind: 'wishForm', wish: w })} aria-label={t('Edit {name}', { name: w.title })}>
                <TypeBubble type={w.type} />
                <span className="stack grow" style={{ gap: 3 }}>
                  <span style={{ fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>{w.title}</span>
                  <span className="small muted">{[w.area, cost].filter(Boolean).join(' · ')}</span>
                </span>
              </button>
              {w.note && <p style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--ink-2)' }}>{w.note}</p>}
              <div className="row" style={{ gap: 6 }}>
                {trip.members.map((m) => {
                  const on = keen.includes(m);
                  return (
                    <button key={m} className="pill" aria-pressed={on} aria-label={on ? t('{name} is keen', { name: nameOf(trip, m) }) : t('{name} is not keen yet', { name: nameOf(trip, m) })}
                      onClick={() => updateRow(trip.id, 'wishlist', w.id, { keen: on ? arrayRemove(m) : arrayUnion(m) })}
                      style={{ height: 36, padding: '0 10px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, border: on ? 0 : '1px solid var(--line)', background: on ? '#F9E1D6' : 'var(--surface)', color: on ? 'var(--primary)' : 'var(--muted)' }}>
                      <Icon d="heart" size={15} stroke={2} fill={on ? 'currentColor' : 'none'} />{nameOf(trip, m)}
                    </button>
                  );
                })}
                <span className="grow" />
                {item ? (
                  <button className="pill" style={{ height: 36, padding: '0 12px', border: 0, background: 'var(--good-soft)', color: 'var(--good)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}
                    onClick={() => open({ kind: 'item', id: item.id })}>
                    <Icon d="check" size={14} stroke={2.6} />{dayLabel(days, item.date).split(' · ')[0]}
                  </button>
                ) : (
                  <button className="btn sm primary" onClick={() => open({ kind: 'planWish', wish: w })}>{t('Add to a day')}</button>
                )}
              </div>
            </div>
          );
        })}
      </main>
      <Fab label={t('Add a wishlist idea')} onClick={() => open({ kind: 'wishForm' })} />
    </>
  );
}
