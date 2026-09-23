import { useRef, useState } from 'react';
import { Icon } from './ui.jsx';
import { t } from '../lib/i18n.js';
import { addAttachment, fileToDataUrl, loadFile, removeAttachment } from '../lib/data.js';

// Tickets, boarding passes and receipts. Photos are shrunk before upload; PDFs must be small.
export default function Attachments({ ctx, parentId, label, pending, onPending }) {
  const { trip, attachments } = ctx;
  const input = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const list = parentId ? attachments.filter((a) => a.parentId === parentId) : [];

  const pick = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setError(''); setBusy(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      const meta = { parentId, name: file.name, mime: file.type.startsWith('image/') ? 'image/jpeg' : file.type };
      if (parentId) addAttachment(trip.id, meta, dataUrl);
      else if (onPending) onPending({ meta, dataUrl });
    } catch (err) { setError(err.message); }
    setBusy(false);
  };

  const view = async (a) => {
    const w = a.mime === 'application/pdf' ? window.open('', '_blank') : null;
    const url = await loadFile(trip.id, a.id);
    if (!url) { setError(t('That file could not be loaded. Check your connection.')); if (w) w.close(); return; }
    if (a.mime === 'application/pdf') {
      const blob = await (await fetch(url)).blob();
      w.location = URL.createObjectURL(blob);
    } else setPreview(url);
  };

  return (
    <div className="stack" style={{ gap: 8 }}>
      {list.map((a) => (
        <div key={a.id} className="row card" style={{ padding: '4px 4px 4px 12px', gap: 8, borderRadius: 12 }}>
          <Icon d="file" size={18} color="var(--muted)" />
          <button className="grow" style={{ border: 0, background: 'none', textAlign: 'left', padding: '10px 0', fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            onClick={() => view(a)}>{a.name}</button>
          <button className="iconbtn clear" aria-label={t('Remove {name}', { name: a.name })} onClick={() => removeAttachment(trip.id, a.id)}><Icon d="trash" size={16} /></button>
        </div>
      ))}
      {pending && (
        <div className="row card" style={{ padding: '12px', gap: 8, borderRadius: 12 }}>
          <Icon d="file" size={18} color="var(--muted)" /><span className="grow small" style={{ fontWeight: 600 }}>{t('{name} (saved with the expense)', { name: pending.meta.name })}</span>
        </div>
      )}
      <input ref={input} type="file" accept="image/*,application/pdf" className="sr" onChange={pick} tabIndex={-1} aria-hidden="true" />
      <button type="button" className="btn sm dashed" onClick={() => input.current.click()} disabled={busy} style={{ alignSelf: 'flex-start' }}>
        <Icon d="clip" size={15} stroke={2} />{busy ? t('Uploading…') : (label || t('Add ticket or photo'))}
      </button>
      {error && <p className="error" role="alert">{error}</p>}
      {preview && (
        <>
          <button className="backdrop" style={{ position: 'fixed', zIndex: 40, background: 'rgba(0,0,0,0.85)' }} aria-label={t('Close preview')} onClick={() => setPreview(null)} />
          <img src={preview} alt={t('Attachment')} style={{ position: 'fixed', zIndex: 41, left: 12, right: 12, top: '50%', transform: 'translateY(-50%)', maxWidth: 'calc(100% - 24px)', maxHeight: '80%', objectFit: 'contain', margin: '0 auto', borderRadius: 12 }}
            onClick={() => setPreview(null)} />
        </>
      )}
    </div>
  );
}
