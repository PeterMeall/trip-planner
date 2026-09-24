import { useEffect, useState } from 'react';
import { Sheet, Icon } from '../components/ui.jsx';
import { t, getLang } from '../lib/i18n.js';
import { updateRow } from '../lib/data.js';
import { mapsUrl } from '../lib/util.js';
import { findLocal, placeQuery, PLEASE } from '../lib/places.js';

// Full-screen card to show a taxi or tuk-tuk driver: the address in the local script, big,
// with the app-language version underneath.
export default function DriverCard({ ctx, id }) {
  const { trip, items, close, flash } = ctx;
  const it = items.find((x) => x.id === id);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const q = it ? placeQuery(it) : '';
  const drv = it && it.drv && (it.drv.q === q || it.drv.src === 'own') ? it.drv : null;

  const look = async () => {
    if (!it || !q) return;
    setBusy(true); setFailed(false);
    const r = await findLocal(it, trip, getLang());
    setBusy(false);
    if (r) updateRow(trip.id, 'items', it.id, { drv: r });
    else setFailed(true);
  };
  useEffect(() => { if (it && !drv && q) look(); }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep the screen on while the card is shown (where the phone allows it).
  useEffect(() => {
    let lock = null;
    try { if (navigator.wakeLock) navigator.wakeLock.request('screen').then((l) => { lock = l; }).catch(() => {}); } catch (e) { /* not supported */ }
    return () => { try { if (lock) lock.release(); } catch (e) { /* already released */ } };
  }, []);

  if (!it) return null;
  const saveOwn = () => {
    const text = draft.trim();
    updateRow(trip.id, 'items', it.id, { drv: text ? { q, lang: (drv && drv.lang) || '', localName: '', localAddr: text, appAddr: (drv && drv.appAddr) || '', src: 'own' } : null });
    setEditing(false);
    flash(t('Saved'));
  };
  const note = !drv ? '' : drv.src === 'own' ? t('Your own text')
    : drv.src === 'map' ? t('Address from OpenStreetMap')
    : drv.src === 'mixed' ? t('Name machine-translated, area from OpenStreetMap')
    : t('Machine-translated: check it looks right');
  const please = drv && PLEASE[drv.lang];
  const sameLang = drv && drv.lang === getLang();

  return (
    <Sheet onClose={close} full label={t('Show the driver')}>
      <div className="row" style={{ alignItems: 'center' }}>
        <span className="eyebrow grow">{t('Show this to your driver')}</span>
        <button className="iconbtn" aria-label={t('Close')} onClick={close}><Icon d="close" size={18} stroke={2} /></button>
      </div>

      <div className="driver-card">
        {busy && <p className="muted" style={{ fontSize: 18 }}>{t('Looking up the local address…')}</p>}
        {!busy && drv && !editing && (
          <>
            {please && !sameLang && <p className="driver-please" lang={drv.lang}>{please}</p>}
            {drv.localName && <p className="driver-name" lang={drv.lang}>{drv.localName}</p>}
            <p className={drv.localName ? 'driver-addr' : 'driver-name'} lang={drv.lang}>{drv.localAddr}</p>
          </>
        )}
        {!busy && !drv && !editing && (
          <p className="muted" style={{ fontSize: 17, lineHeight: 1.5 }}>
            {!q ? t('Add a place or address to this item first.') : failed ? t('Couldn’t find a local address (no internet, or the place isn’t on the map). You can paste one yourself, e.g. from the booking confirmation or Google Maps.') : ''}
          </p>
        )}
        {editing && (
          <div className="stack" style={{ gap: 10 }}>
            <label htmlFor="drv-own" className="small muted" style={{ fontWeight: 600 }}>{t('Address in the local language (paste from the booking or Google Maps)')}</label>
            <textarea id="drv-own" className="input" style={{ minHeight: 120, fontSize: 18 }} value={draft} onChange={(e) => setDraft(e.target.value)} />
            <div className="row" style={{ gap: 8 }}>
              <button className="btn primary grow" onClick={saveOwn}>{t('Save')}</button>
              <button className="btn outline" onClick={() => setEditing(false)}>{t('Cancel')}</button>
            </div>
          </div>
        )}

        <div className="driver-app">
          <span className="driver-app-title">{it.title}</span>
          {it.place && it.place !== it.title && <span>{it.place}</span>}
          {drv && drv.appAddr && drv.appAddr !== it.place && drv.src !== 'translated' && <span className="small muted">{drv.appAddr}</span>}
        </div>
      </div>

      {note && !editing && <p className="small muted" style={{ textAlign: 'center' }}>{note}</p>}

      {!editing && (
        <div className="row" style={{ gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn sm outline" onClick={() => { setDraft((drv && drv.localAddr) || ''); setEditing(true); }}><Icon d="edit" size={15} stroke={2} />{drv ? t('Edit') : t('Paste an address')}</button>
          {q && <button className="btn sm outline" disabled={busy} onClick={look}>{t('Look up again')}</button>}
          <a className="btn sm outline" href={mapsUrl(it.q || it.place || it.title)} target="_blank" rel="noopener noreferrer"><Icon d="pin" size={15} stroke={2} />{t('Maps')}</a>
        </div>
      )}
    </Sheet>
  );
}
