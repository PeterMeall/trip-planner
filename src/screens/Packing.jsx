import { useState } from 'react';
import { Icon, Seg } from '../components/ui.jsx';
import { nameOf } from '../lib/util.js';
import { addRow, addRows, updateRow, deleteRow } from '../lib/data.js';

const CATS = ['Documents', 'Clothes', 'Toiletries', 'Health', 'Electronics', 'Beach', 'Extras'];

const TEMPLATE = [
  ['Passports', 'Documents'], ['Travel insurance details', 'Documents'], ['Bank cards and some cash', 'Documents'],
  ['Booking confirmations (offline copy)', 'Documents'], ['Driving licence', 'Documents'],
  ['Light shirts and tops', 'Clothes'], ['Shorts', 'Clothes'], ['Swimwear', 'Clothes'], ['Cover-up for temple visits (shoulders and knees)', 'Clothes'],
  ['Sandals', 'Clothes'], ['Light rain jacket', 'Clothes'], ['Sun hat and sunglasses', 'Clothes'],
  ['Reef-safe sun cream', 'Toiletries'], ['Mosquito repellent', 'Toiletries'], ['Toothbrushes and toothpaste', 'Toiletries'], ['After-sun', 'Toiletries'],
  ['Basic first aid kit', 'Health'], ['Rehydration sachets', 'Health'], ['Any regular medication', 'Health'],
  ['Phone chargers and power bank', 'Electronics'], ['Plug adapter', 'Electronics'], ['Headphones', 'Electronics'],
  ['Dry bag', 'Beach'], ['Snorkel mask', 'Beach'], ['Quick-dry towel', 'Beach']
];

export default function Packing({ ctx }) {
  const { trip, packing, flash } = ctx;
  const [filter, setFilter] = useState('all');
  const [name, setName] = useState('');
  const [who, setWho] = useState('shared');
  const [cat, setCat] = useState('Extras');

  const shown = packing.filter((p) => filter === 'all' || p.who === filter);
  const done = shown.filter((p) => p.done).length;
  const pct = shown.length ? Math.round(done / shown.length * 100) : 0;
  const whoOpts = [{ value: 'all', label: 'Everyone' }].concat(trip.members.map((m) => ({ value: m, label: nameOf(trip, m) })), [{ value: 'shared', label: 'Shared' }]);
  const whoStyle = (w) => {
    const i = trip.members.indexOf(w);
    if (i === 0) return { background: '#E6ECF4', color: '#2C5282' };
    if (i === 1) return { background: '#F4E2EA', color: '#7A3566' };
    return { background: 'var(--divider)', color: 'var(--ink-2)' };
  };

  const add = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addRow(trip.id, 'packing', { name: name.trim(), cat, who, done: false });
    setName('');
  };
  const useTemplate = () => {
    addRows(trip.id, 'packing', TEMPLATE.map(([n, c]) => ({ name: n, cat: c, who: 'shared', done: false })));
    flash('Template added');
  };

  return (
    <main className="screen">
      <div className="stack" style={{ gap: 10 }}>
        <div className="between">
          <h1 className="h1">Packing</h1>
          {shown.length > 0 && <span style={{ fontSize: 14, fontWeight: 700 }}>{done} of {shown.length} packed</span>}
        </div>
        {shown.length > 0 && (
          <div className="progress" role="progressbar" aria-label="Packing progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <div style={{ width: pct + '%' }} />
          </div>
        )}
      </div>

      {packing.length > 0 && <Seg options={whoOpts} value={filter} onChange={setFilter} label="Whose items" />}

      <form className="stack" style={{ gap: 8 }} onSubmit={add}>
        <div className="row" style={{ gap: 8 }}>
          <input className="input grow" aria-label="New packing item" placeholder="Add something to pack" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="iconbtn" style={{ width: 48, height: 48, background: 'var(--primary)', color: 'var(--surface)' }} aria-label="Add item"><Icon d="plus" size={22} stroke={2.2} /></button>
        </div>
        <div className="grid2">
          <select className="input" aria-label="Category" value={cat} onChange={(e) => setCat(e.target.value)}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
          <select className="input" aria-label="Whose item" value={who} onChange={(e) => setWho(e.target.value)}>
            <option value="shared">Shared</option>
            {trip.members.map((m) => <option key={m} value={m}>{nameOf(trip, m)}</option>)}
          </select>
        </div>
      </form>

      {!packing.length && (
        <div className="empty">
          Your list is empty. Start from a tropical trip template and tweak it, or add things one by one.
          <div style={{ marginTop: 12 }}><button className="btn sm outline" onClick={useTemplate}>Use the tropical template</button></div>
        </div>
      )}

      {CATS.map((c) => {
        const list = shown.filter((p) => (p.cat || 'Extras') === c).sort((a, b) => String(a.name).localeCompare(String(b.name)));
        if (!list.length) return null;
        return (
          <section key={c} className="section" style={{ gap: 8 }}>
            <div className="between">
              <h2 className="eyebrow">{c}</h2>
              <span className="small muted" style={{ fontWeight: 600 }}>{list.filter((p) => p.done).length}/{list.length}</span>
            </div>
            <div className="card list">
              {list.map((p) => (
                <div key={p.id} className="row" style={{ gap: 0, background: 'var(--surface)' }}>
                  <button className="row-btn grow" style={{ minHeight: 52, padding: '6px 8px 6px 12px' }} aria-pressed={!!p.done}
                    onClick={() => updateRow(trip.id, 'packing', p.id, { done: !p.done })}>
                    <span className={'check sq' + (p.done ? ' done' : '')}>{p.done && <Icon d="check" size={13} stroke={3} color="#FFFBF5" />}</span>
                    <span className={'row-title grow' + (p.done ? ' strike' : '')}>{p.name}</span>
                    <span className="pill" style={whoStyle(p.who)}>{nameOf(trip, p.who)}</span>
                  </button>
                  <button className="iconbtn clear" aria-label={'Remove ' + p.name} style={{ color: '#A08C7B' }}
                    onClick={() => deleteRow(trip.id, 'packing', p.id)}><Icon d="close" size={16} stroke={2} /></button>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
