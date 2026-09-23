import { useEffect, useState } from 'react';
import { ICONS, TYPES } from '../lib/util.js';

export function Icon({ d, size = 20, stroke = 1.8, fill = 'none', color = 'currentColor', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>
      <path d={ICONS[d] || d} />
    </svg>
  );
}

export function TypeBubble({ type, look, size = 'md' }) {
  const t = look || TYPES[type] || TYPES.activity;
  const px = size === 'lg' ? 22 : 18;
  return (
    <span className={'bubble' + (size === 'lg' ? ' lg' : '')} style={{ background: t.bg, color: t.fg }}>
      <Icon d={t.icon} size={px} />
    </span>
  );
}

export function Sheet({ onClose, children, full, label }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <>
      {!full && <button className="backdrop" aria-label="Close" onClick={onClose} />}
      <div className={'sheet' + (full ? ' full' : '')} role="dialog" aria-modal="true" aria-label={label}>
        {!full && <span className="grabber" />}
        {children}
      </div>
    </>
  );
}

export function SheetHead({ title, sub, onClose }) {
  return (
    <div className="row" style={{ alignItems: 'center' }}>
      <div className="stack grow">
        <span className="sheet-title">{title}</span>
        {sub && <span className="small muted">{sub}</span>}
      </div>
      <button className="iconbtn" aria-label="Close" onClick={onClose}><Icon d="close" size={18} stroke={2} /></button>
    </div>
  );
}

export function Field({ label, id, children, style }) {
  return (
    <div className="field" style={style}>
      <label htmlFor={id}>{label}</label>
      {children}
    </div>
  );
}

export function Chips({ options, value, onChange, label }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className={'chip' + (o.value === value ? ' on' : '')}
          aria-pressed={o.value === value} onClick={() => onChange(o.value)} style={o.style && o.value === value ? o.style : undefined}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Seg({ options, value, onChange, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" className={o.value === value ? 'on' : ''} aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function TypePicker({ types, value, onChange }) {
  return (
    <div className="typegrid" role="group" aria-label="Type">
      {types.map((k) => {
        const t = TYPES[k];
        const on = value === k;
        return (
          <button key={k} type="button" className="typebtn" aria-pressed={on} onClick={() => onChange(k)}
            style={on ? { background: t.bg, color: t.fg, border: '2px solid ' + t.fg } : undefined}>
            <Icon d={t.icon} size={16} stroke={2} />{t.label}
          </button>
        );
      })}
    </div>
  );
}

export function Fab({ onClick, label }) {
  return (
    <button className="fab" aria-label={label} onClick={onClick}><Icon d="plus" size={26} stroke={2.2} /></button>
  );
}

export function TimeSelect({ id, value, onChange }) {
  return (
    <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {TIMESLIST.map((t) => <option key={t} value={t}>{t}</option>)}
    </select>
  );
}
const TIMESLIST = (() => { const o = []; for (let m = 0; m < 1440; m += 15) o.push(String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0')); return o; })();

// Two-tap delete, so nothing is removed by accident (and no browser pop-ups).
export function ConfirmButton({ onConfirm, children = 'Delete', confirmText = 'Tap again to delete' }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => { if (!armed) return undefined; const t = setTimeout(() => setArmed(false), 3000); return () => clearTimeout(t); }, [armed]);
  return (
    <button type="button" className="btn danger" style={armed ? { background: 'var(--danger)', color: '#FFFBF5', borderColor: 'var(--danger)' } : undefined}
      onClick={() => (armed ? onConfirm() : setArmed(true))}>{armed ? confirmText : children}</button>
  );
}
