import { useState } from 'react';
import { createTrip, updateTrip } from '../lib/data.js';
import { Field, Icon } from '../components/ui.jsx';
import { t } from '../lib/i18n.js';

export const TIMEZONES = [
  ['Asia/Bangkok', 'Thailand / Vietnam (UTC+7)'], ['Europe/Amsterdam', 'Netherlands'], ['Europe/London', 'United Kingdom'],
  ['Asia/Singapore', 'Singapore / Malaysia'], ['Asia/Ho_Chi_Minh', 'Vietnam'], ['Asia/Makassar', 'Bali'],
  ['Asia/Tokyo', 'Japan'], ['Australia/Sydney', 'Sydney'], ['America/New_York', 'New York'], ['America/Los_Angeles', 'Los Angeles']
];
export const CURRENCIES = ['THB', 'VND', 'EUR', 'GBP', 'USD', 'KHR', 'LAK', 'MYR', 'IDR', 'SGD', 'PHP', 'JPY', 'KRW', 'AUD'];

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
    partnerName: trip ? (trip.names || {})[other] || '' : '',
    extras: trip && trip.extraCurrencies ? trip.extraCurrencies.map((c) => ({ code: c.code, rate: String(c.rate) })) : []
  }));
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!f.startDate || !f.endDate || f.endDate < f.startDate) { setError(t('Check the dates: the last day has to be on or after the first day.')); return; }
    const partner = f.partnerEmail.trim().toLowerCase();
    const members = [me].concat(partner && partner !== me ? [partner] : []);
    const names = { [me]: f.myName.trim() || me.split('@')[0] };
    if (partner) names[partner] = f.partnerName.trim() || partner.split('@')[0];
    const extraCurrencies = f.extras
      .map((c) => ({ code: c.code, rate: Number(String(c.rate).replace(/[\s,]/g, '')) || 0 }))
      .filter((c, i, arr) => c.rate > 0 && c.code !== f.localCurrency && c.code !== f.homeCurrency && arr.findIndex((x) => x.code === c.code) === i);
    if (f.extras.some((c) => !(Number(String(c.rate).replace(/[\s,]/g, '')) > 0))) { setError(t('Add a rate for each extra currency, or remove it.')); return; }
    const data = {
      extraCurrencies,
      name: f.name.trim() || t('Trip'), startDate: f.startDate, endDate: f.endDate, timezone: f.timezone,
      localCurrency: f.localCurrency, homeCurrency: f.homeCurrency, rate: Number(String(f.rate).replace(',', '.')) || 1,
      members, names
    };
    if (trip) { updateTrip(trip.id, data); onSaved(trip.id); }
    else onSaved(createTrip(data));
  };

  return (
    <form onSubmit={submit} className="stack" style={{ gap: 14 }}>
      <Field label={t('Trip name')} id="t-name"><input id="t-name" className="input" value={f.name} onChange={set('name')} /></Field>
      <div className="grid2">
        <Field label={t('First day')} id="t-start"><input id="t-start" className="input" type="date" value={f.startDate} onChange={set('startDate')} required /></Field>
        <Field label={t('Last day')} id="t-end"><input id="t-end" className="input" type="date" value={f.endDate} onChange={set('endDate')} required /></Field>
      </div>
      <Field label={t('Time zone for the itinerary')} id="t-tz">
        <select id="t-tz" className="input" value={f.timezone} onChange={set('timezone')}>
          {TIMEZONES.map(([v, l]) => <option key={v} value={v}>{t(l)}</option>)}
        </select>
      </Field>
      <div className="grid3">
        <Field label={t('Local money')} id="t-lc">
          <select id="t-lc" className="input" value={f.localCurrency} onChange={set('localCurrency')}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        <Field label={t('Home money')} id="t-hc">
          <select id="t-hc" className="input" value={f.homeCurrency} onChange={set('homeCurrency')}>{CURRENCIES.map((c) => <option key={c}>{c}</option>)}</select>
        </Field>
        <Field label={'1 ' + f.homeCurrency + ' ='} id="t-rate"><input id="t-rate" className="input" inputMode="decimal" value={f.rate} onChange={set('rate')} /></Field>
      </div>
      <div className="stack" style={{ gap: 8 }}>
        <span className="label">{t('Other currencies on this trip (e.g. VND for a few days in Vietnam)')}</span>
        {f.extras.map((c, i) => (
          <div key={i} className="row" style={{ gap: 8 }}>
            <select aria-label={t('Currency')} className="input" style={{ width: 96, flexShrink: 0 }} value={c.code}
              onChange={(e) => setF({ ...f, extras: f.extras.map((x, j) => (j === i ? { ...x, code: e.target.value } : x)) })}>
              {CURRENCIES.filter((k) => k !== f.homeCurrency && k !== f.localCurrency).map((k) => <option key={k}>{k}</option>)}
            </select>
            <span className="small muted" style={{ flexShrink: 0 }}>1 {f.homeCurrency} =</span>
            <input aria-label={t('Rate for {code}', { code: c.code })} className="input grow" inputMode="decimal" value={c.rate} placeholder={t('Rate')}
              onChange={(e) => setF({ ...f, extras: f.extras.map((x, j) => (j === i ? { ...x, rate: e.target.value } : x)) })} />
            <button type="button" className="iconbtn clear" aria-label={t('Remove {name}', { name: c.code })}
              onClick={() => setF({ ...f, extras: f.extras.filter((x, j) => j !== i) })}><Icon d="close" size={16} stroke={2} /></button>
          </div>
        ))}
        <button type="button" className="btn sm dashed" style={{ alignSelf: 'flex-start' }}
          onClick={() => setF({ ...f, extras: f.extras.concat([{ code: CURRENCIES.find((k) => k !== f.homeCurrency && k !== f.localCurrency && !f.extras.some((x) => x.code === k)) || 'USD', rate: '' }]) })}>
          <Icon d="plus" size={15} stroke={2} />{t('Add a currency')}
        </button>
      </div>
      <div className="grid2">
        <Field label={t('Your name')} id="t-me"><input id="t-me" className="input" value={f.myName} onChange={set('myName')} placeholder={t('e.g. Sam')} /></Field>
        <Field label={t('Partner\u2019s name')} id="t-pn"><input id="t-pn" className="input" value={f.partnerName} onChange={set('partnerName')} placeholder={t('e.g. Alex')} /></Field>
      </div>
      <Field label={t('Partner\u2019s email (their login)')} id="t-pe">
        <input id="t-pe" className="input" type="email" value={f.partnerEmail} onChange={set('partnerEmail')} placeholder={t('So they can see and edit the trip')} />
      </Field>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn primary" >{submitLabel}</button>
      {onCancel && <button type="button" className="btn quiet" onClick={onCancel}>{t('Cancel')}</button>}
    </form>
  );
}

export default function TripSetup({ user, first, onCreated, onCancel }) {
  return (
    <div className="auth">
      <div className="stack" style={{ gap: 8 }}>
        <span className="eyebrow">{first ? t('First things first') : t('New trip')}</span>
        <h1 className="h1 big">{t('Set up your trip')}</h1>
        <p className="sub">{t('You can change all of this later in Settings.')}</p>
      </div>
      <TripForm user={user} onSaved={onCreated} onCancel={onCancel} submitLabel={t('Create trip')} />
    </div>
  );
}
