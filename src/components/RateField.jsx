import { useEffect } from 'react';
import { t } from '../lib/i18n.js';
import { useDayRate } from '../lib/rates.js';
import { rateFor, dShort } from '../lib/util.js';

// "1 EUR = [38.03] THB · rate of Tue 22 Sep". Fills in the day's rate automatically;
// once someone types their own rate, that one is kept (until the currency or date changes).
export default function RateField({ trip, cur, date, value, touched, onChange }) {
  const home = trip.homeCurrency || 'EUR';
  const live = useDayRate(home, cur, date);

  useEffect(() => {
    if (touched || cur === home || live.loading) return;
    const fallback = rateFor(cur, trip);
    const next = live.rate || fallback;
    if (next && String(next) !== String(value)) onChange(String(next), false);
  }, [live.rate, live.loading, cur, touched]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!cur || cur === home) return null;
  let note = '';
  if (touched) note = t('your own rate');
  else if (live.loading) note = t('looking up the rate…');
  else if (live.rate) note = t('rate of {date}', { date: dShort(live.date || date) });
  else note = t('offline: trip rate used');

  return (
    <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
      <label htmlFor="rate" className="small muted" style={{ fontWeight: 600 }}>1 {home} =</label>
      <input id="rate" className="input" inputMode="decimal" style={{ width: 110, height: 40 }} value={value}
        onChange={(e) => onChange(e.target.value, true)} aria-label={t('Exchange rate')} />
      <span className="small muted" style={{ fontWeight: 600 }}>{cur}</span>
      <span className="small muted">· {note}</span>
    </div>
  );
}
