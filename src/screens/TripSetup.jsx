import { useState } from 'react';
import { createTrip, updateTrip } from '../lib/data.js';
import { Field } from '../components/ui.jsx';

export const TIMEZONES = [
  ['Asia/Bangkok', 'Thailand (Bangkok)'], ['Europe/Amsterdam', 'Netherlands'], ['Europe/London', 'United Kingdom'],
  ['Asia/Singapore', 'Singapore / Malaysia'], ['Asia/Ho_Chi_Minh', 'Vietnam'], ['Asia/Makassar', 'Bali'],
  ['Asia/Tokyo', 'Japan'], ['Australia/Sydney', 'Sydney'], ['America/New_York', 'New York'], ['America/Los_Angeles', 'Los Angeles']
];
export const CURRENCIES = ['THB', 'EUR', 'GBP', 'USD', 'IDR', 'VND', 'JPY', 'SGD', 'AUD'];

// Used both to create a trip and (with `trip`) to edit its settings.
export function TripForm({ user, trip, onSaved, onCancel, submitLabel }) {
  const me = (user.email || '').toLowerCase();
  const other = trip ? (trip.members || []).find((m) => m !== me) || '' : '';
  const [f, setF] = useState(() => ({
    name: trip ? trip.name : 'Thailand',
    startDate: trip ? trip.startDate : '',
    endDate: trip ? trip.endDate : '',
    timezone: trip ? trip.timezone : 'Asia/Bangkok',
    localCurrency: trip ? trip.localCurrency : 'THB',
    homeCurrency: trip ? trip.homeCurrency : 'EUR',
    rate: trip ? String(trip.rate) : '38',
    myName: trip ? (trip.names || {})[me] || '' : '',
    partnerEmail: other,
    partnerName: trip ? (trip.names || {})[other] || '' : ''
  }));
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!f.startDate || !f.endDate || f.endDate < f.startDate) { setError('Check the dates: the last day has to be on or after the first day.'); return; }
    const partner = f.partnerEmail.trim().toLowerCase();
    const members = [me].concat(partner && partner !== me ? [partner] : []);
    const names = { [me]: f.myName.trim() || me.split('@')[0] };
    if (partner) names[partner] = f.partnerName.trim() || partner.split('@')[0];
    const data = {
      name: f.name.trim() || 'Trip', startDate: f.startDate, endDate: f.endDate, timezone: f.timezone,
      localCurrency: f.localCurrency, homeCurrency: f.homeCurrency, rate: Number(String(f.rate).replace(',', '.')) || 1,
      members, names
    };
    if (trip) { updateTrip(trip.id, data); onSaved(trip.id); }
    else onSaved(createTrip(data));
  };

  return (
    <form onSubmit={submit} className="stack" style={{ gap: 14 }}>
      <Field label="Trip name" id="t-name"><input id="t-name" className="input" value={f.name} onChange={set('name')} /></Field>
      <div className="grid2">
        <Field label="First day" id="t-start"><input id="t-start" className="input" type="date" value={f.startDate} onChange={set('startDate')} required /></Field>
        <Field label="Last day" id="t-end"><input id="t-end" className="input" type="date" value={f.endDate} onChange={set('endDate')} required /></Field>
      </div>
      <Field label="Time zone for the itinerary" id="t-tz">
        <select id="t-tz" className="input" value={f.timezone} onChange={set('timezone')}>
          {TIMEZONES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </Field>
      <div className="grid3">
        <Field label="Local money" id="t-lc">
          <select id="t-lc" className="input" value={f.localCurrency} onChange={set('localCurrency')}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        <Field label="Home money" id="t-hc">
          <select id="t-hc" className="input" value={f.homeCurrency} onChange={set('homeCurrency')}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        <Field label={'1 ' + f.homeCurrency + ' ='} id="t-rate"><input id="t-rate" className="input" inputMode="decimal" value={f.rate} onChange={set('rate')} /></Field>
      </div>
      <div className="grid2">
        <Field label="Your name" id="t-me"><input id="t-me" className="input" value={f.myName} onChange={set('myName')} placeholder="e.g. Sam" /></Field>
        <Field label="Partner's name" id="t-pn"><input id="t-pn" className="input" value={f.partnerName} onChange={set('partnerName')} placeholder="e.g. Alex" /></Field>
      </div>
      <Field label="Partner's email (their login)" id="t-pe">
        <input id="t-pe" className="input" type="email" value={f.partnerEmail} onChange={set('partnerEmail')} placeholder="So they can see and edit the trip" />
      </Field>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn primary" >{submitLabel}</button>
      {onCancel && <button type="button" className="btn quiet" onClick={onCancel}>Cancel</button>}
    </form>
  );
}

export default function TripSetup({ user, first, onCreated, onCancel }) {
  return (
    <div className="auth">
      <div className="stack" style={{ gap: 8 }}>
        <span className="eyebrow">{first ? 'First things first' : 'New trip'}</span>
        <h1 className="h1 big">Set up your trip</h1>
        <p className="sub">You can change all of this later in Settings.</p>
      </div>
      <TripForm user={user} onSaved={onCreated} onCancel={onCancel} submitLabel="Create trip" />
    </div>
  );
}
