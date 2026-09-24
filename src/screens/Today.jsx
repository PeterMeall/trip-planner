import { Icon, TypeBubble, MeButton } from '../components/ui.jsx';
import { t } from '../lib/i18n.js';
import { dLong, daysBetween, mapsUrl, tm, TYPES } from '../lib/util.js';
import { useDayWeather } from '../lib/weather.js';
import { dayItems, staysFor, timeLabel, startMs, endMs } from '../lib/trip.js';

export default function Today({ ctx }) {
  const { trip, items, days, now, open, setTab, remOverdue, remToday } = ctx;
  const idx = days.indexOf(now.date);
  const before = days.length && now.date < days[0];
  const after = days.length && now.date > days[days.length - 1];
  const showDate = idx >= 0 ? now.date : (before ? days[0] : days[days.length - 1]);
  // Compare real moments in time, so flights and trains in other time zones line up correctly.
  const nowMs = Date.now();
  const list = dayItems(items, showDate).filter((it) => !it.allDay).sort((a, b) => startMs(a, trip) - startMs(b, trip));

  const current = idx >= 0 ? list.find((it) => startMs(it, trip) <= nowMs && nowMs < endMs(it, trip)) : null;
  const upcoming = idx >= 0 ? list.filter((it) => startMs(it, trip) > nowMs) : list.filter((it) => it.date === showDate);
  const next = upcoming[0];
  const later = upcoming.slice(1);
  const night = staysFor(items, showDate).night;
  const wx = useDayWeather(ctx, showDate);

  const diff = next && idx >= 0 ? Math.round((startMs(next, trip) - nowMs) / 60000) : 0;
  const countdown = diff > 0 ? t('in {time}', { time: ((Math.floor(diff / 60) ? Math.floor(diff / 60) + ' ' + t('h') + ' ' : '') + (diff % 60 ? (diff % 60) + ' min' : '')).trim() }) : '';

  const alertParts = [];
  if (remOverdue) alertParts.push(t('{n} overdue', { n: remOverdue }));
  if (remToday) alertParts.push(t('{n} due today', { n: remToday }));

  const toGo = before ? daysBetween(now.date, days[0]) : 0;

  return (
    <>
    <main className="screen">
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="stack grow">
          <span className="eyebrow">
            {trip.name}{idx >= 0 ? ' · ' + t('Day {n} of {total}', { n: idx + 1, total: days.length }) : before ? ' · ' + (toGo === 1 ? t('1 day to go') : t('{n} days to go', { n: toGo })) : ' · ' + t('trip complete')}
          </span>
          <h1 className="h1 big">{before ? t('Day 1: {date}', { date: dLong(days[0]) }) : dLong(showDate)}</h1>
          {idx >= 0 && <span className="sub">{t('{time} local time', { time: now.label })}</span>}
          {before && <span className="sub">{t('Here\u2019s what\u2019s planned for your first day.')}</span>}
          {wx && (
            <span className="wx-line">
              <Icon d={wx.icon} size={22} stroke={1.8} />
              <span className="stack" style={{ gap: 0 }}>
                <span><b>{Math.round(wx.max)}°</b> <span className="muted">/ {Math.round(wx.min)}°</span> · {wx.label}</span>
                <span className="small muted">{[wx.rain >= 20 ? t('{n}% chance of rain', { n: wx.rain }) : '', wx.place].filter(Boolean).join(' · ')}</span>
              </span>
            </span>
          )}
        </div>
        <MeButton ctx={ctx} />
      </div>

      {alertParts.length > 0 && (
        <button className="alert" onClick={() => setTab('rem')}>
          <Icon d="bell" size={20} stroke={1.9} />
          <span className="grow">{t('Reminders: {list}', { list: alertParts.join(', ') })}</span>
          <Icon d="chevR" size={18} stroke={2} />
        </button>
      )}

      {current && (
        <button className="now-strip" onClick={() => open({ kind: 'item', id: current.id })}>
          <span className="dot" />
          <span className="stack grow" style={{ gap: 2 }}>
            <span className="tag" style={{ padding: 0, color: '#B45A12' }}>{t('Happening now')}</span>
            <span className="row-title">{current.title}</span>
          </span>
          <span className="small muted">{t('until {time}', { time: current.end || current.start })}</span>
        </button>
      )}

      {next ? (
        <div className="next">
          <div className="between" style={{ alignItems: 'center' }}>
            <span className="eyebrow soft" style={{ color: 'var(--primary-soft)' }}>{idx >= 0 ? t('Next up') : t('First up')}</span>
            {countdown && <span className="count">{countdown}</span>}
          </div>
          <div className="row" style={{ alignItems: 'flex-start', gap: 14 }}>
            <span className="bubble lg" style={{ background: 'var(--surface)', color: 'var(--primary)' }}>
              <Icon d={(TYPES[next.type] || TYPES.activity).icon} size={22} />
            </span>
            <div className="stack">
              <span className="title">{next.title}</span>
              <span className="soft" style={{ fontSize: 15 }}>{timeLabel(next, trip)}{next.place ? ' · ' + next.place : ''}</span>
            </div>
          </div>
          <div className="row">
            <a className="btn light" href={mapsUrl(next.q || next.place || next.title)} target="_blank" rel="noopener noreferrer">
              <Icon d="pin" size={18} stroke={2} />{t('Directions')}
            </a>
            {next.type !== 'flight' && next.place && (
              <button className="btn ghost" style={{ flex: '0 0 auto', padding: '0 14px' }} aria-label={t('Show the driver')} onClick={() => open({ kind: 'driver', id: next.id })}>
                <Icon d="car" size={20} stroke={2} />
              </button>
            )}
            <button className="btn ghost" onClick={() => open({ kind: 'item', id: next.id })}>{t('Details')}</button>
          </div>
        </div>
      ) : (
        <div className="empty">
          {after ? t('That’s a wrap. Have a look at Expenses for the final totals.') : t('Nothing else planned for today.')}
          {!after && <div style={{ marginTop: 12 }}><button className="btn sm outline" onClick={() => open({ kind: 'itemForm', date: showDate })}>{t('Add something')}</button></div>}
        </div>
      )}

      {later.length > 0 && (
        <section className="section">
          <h2 className="eyebrow">{t('Later today')}</h2>
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
        <h2 className="eyebrow">{t('Tonight')}</h2>
        {night ? (
          <div className="card row" style={{ padding: '12px 12px 12px 14px', gap: 12 }}>
            <button className="row grow" style={{ border: 0, background: 'none', padding: 0, textAlign: 'left', gap: 12 }} onClick={() => open({ kind: 'item', id: night.id })}>
              <TypeBubble type="hotel" />
              <span className="stack grow" style={{ gap: 2 }}>
                <span className="row-title">{night.title}</span>
                {night.place && <span className="small muted">{night.place}</span>}
              </span>
            </button>
            <button className="iconbtn" style={{ background: '#F4E2EA', color: '#7A3566' }} onClick={() => open({ kind: 'driver', id: night.id })}
              aria-label={t('Show the driver')}><Icon d="car" size={20} stroke={1.9} /></button>
            <a className="iconbtn" style={{ background: '#F4E2EA', color: '#7A3566' }} href={mapsUrl(night.q || night.place || night.title)}
              target="_blank" rel="noopener noreferrer" aria-label={t('Directions to tonight\u2019s stay')}><Icon d="pin" size={20} stroke={2} /></a>
          </div>
        ) : (
          <button className="empty" style={{ textAlign: 'left', background: 'none' }} onClick={() => open({ kind: 'itemForm', date: showDate, type: 'hotel' })}>
            {t('No stay added for tonight. Tap to add one.')}
          </button>
        )}
      </section>
    </main>
    <button className="fab ext" onClick={() => open({ kind: 'expForm' })} aria-label={t('Add an expense')}>
      <Icon d="plus" size={20} stroke={2.4} />{t('Expense')}
    </button>
    </>
  );
}
