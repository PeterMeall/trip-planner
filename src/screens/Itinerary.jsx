import { useEffect, useMemo, useRef } from 'react';
import { Icon, Fab } from '../components/ui.jsx';
import { t } from '../lib/i18n.js';
import { TYPES, dWeekday, dNum, dShort, dLong, tm, fromMin } from '../lib/util.js';
import { dayItems, bandText, staysFor, segment, segmentLabel } from '../lib/trip.js';

const H = 52;

// Places overlapping items side by side.
function layout(list, date) {
  const timed = list.filter((it) => !it.allDay).map((it) => {
    const seg = segment(it, date);
    return { it, st: seg.st, en: Math.max(seg.en, Math.min(seg.st + 30, 1440)), seg };
  }).sort((a, b) => a.st - b.st);
  const out = [];
  let cluster = [];
  let clusterEnd = -1;
  const flush = () => {
    const lanes = [];
    cluster.forEach((c) => {
      let lane = lanes.findIndex((end) => end <= c.st);
      if (lane < 0) { lane = lanes.length; lanes.push(0); }
      lanes[lane] = c.en;
      c.lane = lane;
    });
    cluster.forEach((c) => { c.lanes = lanes.length; out.push(c); });
    cluster = [];
  };
  timed.forEach((c) => {
    if (c.st >= clusterEnd && cluster.length) flush();
    cluster.push(c);
    clusterEnd = Math.max(clusterEnd, c.en);
  });
  if (cluster.length) flush();
  return out;
}

export default function Itinerary({ ctx }) {
  const { trip, items, days, now, dayIdx, setDayIdx, open } = ctx;
  const date = days[dayIdx] || days[0];
  const list = dayItems(items, date);
  const placed = useMemo(() => layout(list, date), [list, date]);
  const allDay = list.filter((it) => it.allDay);
  const startHour = Math.min(6, ...placed.map((p) => Math.floor(p.st / 60)));
  const hours = [];
  for (let h = startHour; h <= 24; h++) hours.push(h);
  const top = (m) => (m - startHour * 60) / 60 * H;

  const wrap = useRef(null);
  const swipe = useRef({ x: null, y: null, swiped: false });

  useEffect(() => {
    if (!wrap.current) return;
    const first = placed.length ? placed[0].st : 8 * 60;
    const target = date === now.date ? Math.min(now.min, first) : first;
    wrap.current.scrollTop = Math.max(0, top(target) - 40);
  }, [date, placed.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (n) => setDayIdx(Math.max(0, Math.min(days.length - 1, n)));
  const guard = (fn) => () => { if (swipe.current.swiped) { swipe.current.swiped = false; return; } fn(); };
  const night = staysFor(items, date).night;

  return (
    <>
    <main className="screen flat" style={{ display: 'flex', flexDirection: 'column' }}>
      <div className="it-head">
        <div className="between">
          <h1 className="h1" style={{ fontSize: 28 }}>{t('Itinerary')}</h1>
          <span className="small muted">{t('Times in local time')}</span>
        </div>
        <div className="pills" role="tablist" aria-label={t('Days')}>
          {days.map((d, i) => {
            const seen = [];
            dayItems(items, d).forEach((it) => { const c = (TYPES[it.type] || TYPES.activity).fg; if (seen.indexOf(c) < 0 && seen.length < 3) seen.push(c); });
            const on = i === dayIdx;
            return (
              <button key={d} role="tab" aria-selected={on} className={'dpill' + (on ? ' on' : '') + (d === now.date ? ' today' : '')}
                aria-label={t('Day {n}', { n: i + 1 }) + ', ' + dLong(d) + (d === now.date ? ', ' + t('today') : '')} onClick={() => go(i)}>
                <span className="wd">{dWeekday(d)}</span>
                <span className="dn">{dNum(d)}</span>
                <span className="dots">{seen.map((c) => <span key={c} style={{ background: on ? '#FFFBF5' : c }} />)}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="row" style={{ padding: '2px 10px 8px', gap: 8 }}>
        <button className="iconbtn clear" aria-label={t('Previous day')} disabled={dayIdx === 0} onClick={() => go(dayIdx - 1)}><Icon d="chevL" size={22} stroke={2} /></button>
        <div className="stack grow" style={{ alignItems: 'center', gap: 1 }}>
          <span style={{ fontSize: 17, fontWeight: 700 }}>{t('Day {n}', { n: dayIdx + 1 })} · {dShort(date)}</span>
          <span className="small muted">{list.length ? (list.length === 1 ? t('1 plan') : t('{n} plans', { n: list.length })) : t('Nothing planned yet')}</span>
        </div>
        <button className="iconbtn clear" aria-label={t('Next day')} disabled={dayIdx === days.length - 1} onClick={() => go(dayIdx + 1)}><Icon d="chevR" size={22} stroke={2} /></button>
      </div>

      <button className="band" style={{ border: 0, textAlign: 'left' }}
        onClick={() => (night ? open({ kind: 'item', id: night.id }) : open({ kind: 'itemForm', date, type: 'hotel' }))}>
        <Icon d={TYPES.hotel.icon} size={18} />
        <span className="grow">{bandText(items, date)}</span>
        {!night && <Icon d="plus" size={16} stroke={2} />}
      </button>

      {allDay.length > 0 && (
        <div className="chips" style={{ padding: '0 16px 10px' }}>
          {allDay.map((it) => {
            const ty = TYPES[it.type] || TYPES.activity;
            return <button key={it.id} className="chip" style={{ background: ty.bg, color: ty.fg, border: 0 }} onClick={() => open({ kind: 'item', id: it.id })}>{t('All day')} · {it.title}</button>;
          })}
        </div>
      )}

      <div ref={wrap} className="grid-wrap" style={{ position: 'relative', flex: 1, minHeight: 0 }}
        onPointerDown={(e) => { swipe.current.x = e.clientX; swipe.current.y = e.clientY; }}
        onPointerUp={(e) => {
          const s = swipe.current;
          if (s.x == null) return;
          const dx = e.clientX - s.x;
          const dy = e.clientY - s.y;
          s.x = null;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            s.swiped = true;
            setTimeout(() => { s.swiped = false; }, 350);
            go(dayIdx + (dx < 0 ? 1 : -1));
          }
        }}>
        <div className="grid" style={{ height: (24 - startHour) * H }}>
          {hours.map((h) => (
            <div key={h} className="hour" style={{ top: (h - startHour) * H }}>
              <span>{String(h).padStart(2, '0')}:00</span><span />
            </div>
          ))}
          {hours.slice(0, -1).map((h) => (
            <button key={'s' + h} className="slot" style={{ top: (h - startHour) * H, height: H }}
              aria-label={t('Add something at {time}', { time: fromMin(h * 60) })} onClick={guard(() => open({ kind: 'itemForm', date, start: fromMin(h * 60) }))} />
          ))}
          {placed.map(({ it, st, en, lane, lanes }) => {
            const ty = TYPES[it.type] || TYPES.activity;
            const h = Math.max((en - st) / 60 * H - 3, 26);
            const w = 'calc((100% - 74px) / ' + lanes + ')';
            return (
              <button key={it.id} className="ev" onClick={guard(() => open({ kind: 'item', id: it.id }))}
                style={{ top: top(st), height: h, background: ty.bg, color: ty.fg, left: 'calc(60px + ' + w + ' * ' + lane + ')', width: 'calc(' + w + ' - 4px)', right: 'auto' }}>
                <Icon d={ty.icon} size={16} stroke={2} style={{ flexShrink: 0, marginTop: 2 }} />
                <span className="stack grow" style={{ gap: 1, minWidth: 0 }}>
                  <span className="t">{it.title}</span>
                  {h >= 44 && <span className="s">{segmentLabel(it, date, trip)}</span>}
                </span>
                {h < 44 && lanes === 1 && <span className="s" style={{ fontWeight: 600, flexShrink: 1, maxWidth: '55%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{segmentLabel(it, date, trip)}</span>}
              </button>
            );
          })}
          {date === now.date && <div className="nowline" style={{ top: top(now.min) }} />}
        </div>
      </div>
    </main>
    <Fab label={t('Add to this day')} onClick={() => open({ kind: 'itemForm', date })} />
    </>
  );
}
