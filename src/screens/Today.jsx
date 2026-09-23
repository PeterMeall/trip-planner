import { Icon, TypeBubble } from '../components/ui.jsx';
import { dLong, daysBetween, mapsUrl, tm, TYPES } from '../lib/util.js';
import { dayItems, staysFor, timeLabel } from '../lib/trip.js';

const endMin = (it) => Math.max(tm(it.end || it.start), tm(it.start) + 30);

export default function Today({ ctx }) {
  const { trip, items, days, now, open, setTab, remOverdue, remToday } = ctx;
  const idx = days.indexOf(now.date);
  const before = days.length && now.date < days[0];
  const after = days.length && now.date > days[days.length - 1];
  const showDate = idx >= 0 ? now.date : (before ? days[0] : days[days.length - 1]);
  const list = dayItems(items, showDate);

  const current = idx >= 0 ? list.find((it) => !it.allDay && tm(it.start) <= now.min && now.min < endMin(it)) : null;
  const upcoming = idx >= 0 ? list.filter((it) => !it.allDay && tm(it.start) > now.min) : list;
  const next = upcoming[0];
  const later = upcoming.slice(1);
  const night = staysFor(items, showDate).night;

  const diff = next && idx >= 0 ? tm(next.start) - now.min : 0;
  const countdown = diff > 0 ? 'in ' + (Math.floor(diff / 60) ? Math.floor(diff / 60) + ' h ' : '') + (diff % 60 ? (diff % 60) + ' min' : '') : '';

  const alertParts = [];
  if (remOverdue) alertParts.push(remOverdue + ' overdue');
  if (remToday) alertParts.push(remToday + ' due today');

  const toGo = before ? daysBetween(now.date, days[0]) : 0;

  return (
    <main className="screen">
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="stack grow">
          <span className="eyebrow">
            {trip.name}{idx >= 0 ? ' · Day ' + (idx + 1) + ' of ' + days.length : before ? ' · ' + toGo + (toGo === 1 ? ' day' : ' days') + ' to go' : ' · trip complete'}
          </span>
          <h1 className="h1 big">{before ? 'Day 1: ' + dLong(days[0]) : dLong(showDate)}</h1>
          {idx >= 0 && <span className="sub">{now.label} local time</span>}
          {before && <span className="sub">Here's what's planned for your first day.</span>}
        </div>
        <button className="iconbtn clear" aria-label="Settings" onClick={() => open({ kind: 'settings' })}><Icon d="gear" size={22} /></button>
      </div>

      {alertParts.length > 0 && (
        <button className="alert" onClick={() => setTab('rem')}>
          <Icon d="bell" size={20} stroke={1.9} />
          <span className="grow">Reminders: {alertParts.join(', ')}</span>
          <Icon d="chevR" size={18} stroke={2} />
        </button>
      )}

      {current && (
        <button className="now-strip" onClick={() => open({ kind: 'item', id: current.id })}>
          <span className="dot" />
          <span className="stack grow" style={{ gap: 2 }}>
            <span className="tag" style={{ padding: 0, color: '#B45A12' }}>Happening now</span>
            <span className="row-title">{current.title}</span>
          </span>
          <span className="small muted">until {current.end || current.start}</span>
        </button>
      )}

      {next ? (
        <div className="next">
          <div className="between" style={{ alignItems: 'center' }}>
            <span className="eyebrow soft" style={{ color: 'var(--primary-soft)' }}>{idx >= 0 ? 'Next up' : 'First up'}</span>
            {countdown && <span className="count">{countdown}</span>}
          </div>
          <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
            <span className="bubble lg" style={{ background: 'var(--surface)', color: 'var(--primary)' }}>
              <Icon d={(TYPES[next.type] || TYPES.activity).icon} size={22} />
            </span>
            <div className="stack">
              <span className="title">{next.title}</span>
              <span className="soft" style={{ fontSize: 15 }}>{timeLabel(next)}{next.place ? ' · ' + next.place : ''}</span>
            </div>
          </div>
          <div className="row">
            <a className="btn light" href={mapsUrl(next.q || next.place || next.title)} target="_blank" rel="noopener noreferrer">
              <Icon d="pin" size={18} stroke={2} />Directions
            </a>
            <button className="btn ghost" onClick={() => open({ kind: 'item', id: next.id })}>Details</button>
          </div>
        </div>
      ) : (
        <div className="empty">
          {after ? 'That’s a wrap. Have a look at Expenses for the final totals.' : 'Nothing else planned for today.'}
          {!after && <div style={{ marginTop: 12 }}><button className="btn sm outline" onClick={() => open({ kind: 'itemForm', date: showDate })}>Add something</button></div>}
        </div>
      )}

      {later.length > 0 && (
        <section className="section">
          <h2 className="eyebrow">Later today</h2>
          <div className="card list">
            {later.map((it) => (
              <button key={it.id} className="row-btn" onClick={() => open({ kind: 'item', id: it.id })}>
                <span className="time">{it.start}</span>
                <TypeBubble type={it.type} />
                <span className="row-title grow">{it.title}</span>
                <Icon d="chevR" size={18} stroke={2} color="#A08C7B" />
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="eyebrow">Tonight</h2>
        {night ? (
          <div className="card row" style={{ padding: '12px 12px 12px 14px', gap: 12 }}>
            <button className="row grow" style={{ border: 0, background: 'none', padding: 0, textAlign: 'left', gap: 12 }} onClick={() => open({ kind: 'item', id: night.id })}>
              <TypeBubble type="hotel" />
              <span className="stack grow" style={{ gap: 2 }}>
                <span className="row-title">{night.title}</span>
                {night.place && <span className="small muted">{night.place}</span>}
              </span>
            </button>
            <a className="iconbtn" style={{ background: '#F4E2EA', color: '#7A3566' }} href={mapsUrl(night.q || night.place || night.title)}
              target="_blank" rel="noopener noreferrer" aria-label="Directions to tonight's stay"><Icon d="pin" size={20} stroke={2} /></a>
          </div>
        ) : (
          <button className="empty" style={{ textAlign: 'left', background: 'none' }} onClick={() => open({ kind: 'itemForm', date: showDate, type: 'hotel' })}>
            No stay added for tonight. Tap to add one.
          </button>
        )}
      </section>
    </main>
  );
}
