import { useState } from 'react';
import { Icon } from './ui.jsx';
import { t } from '../lib/i18n.js';
import { loadFile } from '../lib/data.js';

// Opens an attached ticket straight from a card. One attachment opens directly;
// with several, a small list appears first. Shows nothing when there are none.
export default function TicketButton({ ctx, item, className = 'btn ghost', style, label }) {
  const { trip, attachments, flash } = ctx;
  const list = attachments.filter((a) => a.parentId === 'item:' + item.id);
  const [preview, setPreview] = useState(null);
  const [choose, setChoose] = useState(false);
  if (!list.length) return null;

  const view = async (a) => {
    setChoose(false);
    const pdf = a.mime === 'application/pdf';
    const w = pdf ? window.open('', '_blank') : null;
    const url = await loadFile(trip.id, a.id).catch(() => null);
    if (!url) { if (w) w.close(); flash(t('That file could not be loaded. Check your connection.')); return; }
    if (pdf) w.location = URL.createObjectURL(await (await fetch(url)).blob());
    else setPreview(url);
  };

  return (
    <>
      <button className={className} style={{ flex: '0 0 auto', padding: '0 14px', ...style }}
        aria-label={list.length === 1 ? t('Show ticket') : t('Show tickets ({n})', { n: list.length })}
        onClick={() => (list.length === 1 ? view(list[0]) : setChoose(true))}>
        <Icon d="ticket" size={20} stroke={2} />{label}{list.length > 1 && <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.8 }}>{label ? '(' + list.length + ')' : list.length}</span>}
      </button>
      {choose && (
        <>
          <button className="backdrop" style={{ position: 'fixed', zIndex: 40 }} aria-label={t('Close')} onClick={() => setChoose(false)} />
          <div className="sheet" style={{ position: 'fixed', zIndex: 41 }} role="dialog" aria-label={t('Tickets')}>
            <span className="grabber" />
            <span className="sheet-title">{item.title}</span>
            <div className="card list">
              {list.map((a) => (
                <button key={a.id} className="row-btn" onClick={() => view(a)}>
                  <Icon d="file" size={18} color="var(--muted)" />
                  <span className="row-title grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
      {preview && (
        <>
          <button className="backdrop" style={{ position: 'fixed', zIndex: 40, background: 'rgba(0,0,0,0.9)' }} aria-label={t('Close preview')} onClick={() => setPreview(null)} />
          <img src={preview} alt={t('Attachment')} onClick={() => setPreview(null)}
            style={{ position: 'fixed', zIndex: 41, left: 8, right: 8, top: '50%', transform: 'translateY(-50%)', maxWidth: 'calc(100% - 16px)', maxHeight: '88%', objectFit: 'contain', margin: '0 auto', borderRadius: 10, background: '#fff' }} />
        </>
      )}
    </>
  );
}
