import { Sheet, Icon, TypeBubble } from '../components/ui.jsx';
import { t } from '../lib/i18n.js';
import Attachments from '../components/Attachments.jsx';
import { TYPES, mapsUrl, nameOf } from '../lib/util.js';
import { costText, dayLabel, timeLabel, isStay } from '../lib/trip.js';

export default function ItemDetail({ ctx, id }) {
  const { trip, items, days, close, open, flash } = ctx;
  const it = items.find((x) => x.id === id);
  if (!it) return null;
  const ty = TYPES[it.type] || TYPES.activity;

  const copy = async () => {
    try { await navigator.clipboard.writeText(it.ref); flash(t('Copied')); } catch (e) { flash(t('Couldn’t copy')); }
  };

  return (
    <Sheet onClose={close} label={it.title}>
      <div className="row" style={{ gap: 12 }}>
        <TypeBubble type={it.type} size="lg" />
        <div className="stack grow" style={{ gap: 2 }}>
          <span className="tag" style={{ padding: 0, color: ty.fg }}>{ty.label}{it.by ? ' · ' + t('added by {name}', { name: nameOf(trip, it.by) }) : ''}</span>
          <span className="sheet-title" style={{ fontSize: 23 }}>{it.title}</span>
        </div>
        <button className="iconbtn" aria-label={t('Close')} onClick={close}><Icon d="close" size={18} stroke={2} /></button>
      </div>

      <div className="card list details" style={{ borderColor: 'var(--divider)', borderRadius: 14 }}>
        <div><span className="label">{t('When')}</span><span className="v">{isStay(it) ? timeLabel(it) + (it.start ? ' · ' + t('check-in from {time}', { time: it.start }) : '') + (it.end ? ', ' + t('check-out by {time}', { time: it.end }) : '') : dayLabel(days, it.date) + ' · ' + timeLabel(it)}</span></div>
        {it.place && <div><span className="label">{t('Where')}</span><span className="v">{it.place}</span></div>}
        <div><span className="label">{t('Cost')}</span><span className="v">{costText(it, trip)}</span></div>
        {it.ref && (
          <div style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: '8px 8px 8px 14px' }}>
            <span className="stack grow" style={{ gap: 2 }}><span className="label">{t('Booking reference')}</span><span className="v" style={{ fontWeight: 700, letterSpacing: '0.04em' }}>{it.ref}</span></span>
            <button className="btn sm" style={{ border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--primary)' }} onClick={copy}><Icon d="copy" size={15} stroke={2} />{t('Copy')}</button>
          </div>
        )}
        {it.note && <div><span className="label">{t('Notes')}</span><span className="v" style={{ fontWeight: 400 }}>{it.note}</span></div>}
      </div>

      <Attachments ctx={ctx} parentId={'item:' + it.id} />

      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <button className="btn sm" style={{ border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--primary)' }}
          onClick={() => open({ kind: 'remForm', itemId: it.id })}><Icon d="bell" size={15} stroke={2} />{t('Add reminder')}</button>
        <button className="btn sm" style={{ border: '1px solid var(--line)', background: 'var(--surface)', color: 'var(--ink)' }}
          onClick={() => open({ kind: 'itemForm', item: it })}><Icon d="edit" size={15} stroke={2} />{t('Edit')}</button>
      </div>

      <a className="btn primary" href={mapsUrl(it.q || it.place || it.title)} target="_blank" rel="noopener noreferrer">
        <Icon d="pin" size={18} stroke={2} />{t('Directions in Google Maps')}
      </a>
    </Sheet>
  );
}
