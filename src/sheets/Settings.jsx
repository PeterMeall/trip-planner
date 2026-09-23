import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { Sheet, SheetHead, Icon } from '../components/ui.jsx';
import { t, getLang, setLang } from '../lib/i18n.js';
import { Seg } from '../components/ui.jsx';
import { TripForm } from '../screens/TripSetup.jsx';
import { downloadIcs } from '../lib/ics.js';
import { dShort } from '../lib/util.js';

export default function Settings({ ctx }) {
  const { trip, trips, user, items, close, flash, onSwitch, onNewTrip } = ctx;
  return (
    <Sheet onClose={close} full label={t('Settings')}>
      <SheetHead title={t('Settings')} sub={t('Signed in as {email}', { email: user.email })} onClose={close} />

      <section className="section">
        <h2 className="eyebrow">{t('Language')}</h2>
        <Seg label={t('Language')} value={getLang()} onChange={setLang}
          options={[{ value: 'en', label: 'English' }, { value: 'nl', label: 'Nederlands' }]} />
      </section>

      <section className="section">
        <h2 className="eyebrow">{t('Calendar')}</h2>
        <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p className="small muted" style={{ lineHeight: 1.5 }}>
            {t('Download the itinerary as a calendar file, then open it (or import it at calendar.google.com, Settings, Import). Re-export after big changes.')}
          </p>
          <button className="btn outline" onClick={() => { downloadIcs(trip, items); flash(t('Calendar file downloaded')); }}>
            <Icon d="calendar" size={18} />{t('Export to Google Calendar (.ics)')}
          </button>
        </div>
      </section>

      {trips.length > 1 && (
        <section className="section">
          <h2 className="eyebrow">{t('Your trips')}</h2>
          <div className="card list">
            {trips.map((tr) => (
              <button key={tr.id} className="row-btn" onClick={() => { onSwitch(tr.id); close(); }}>
                <span className="stack grow" style={{ gap: 2 }}>
                  <span className="row-title">{tr.name}</span>
                  <span className="row-meta">{t('{from} to {to}', { from: dShort(tr.startDate), to: dShort(tr.endDate) })}</span>
                </span>
                {tr.id === trip.id && <Icon d="check" size={18} stroke={2.4} color="var(--primary)" />}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="eyebrow">{t('This trip')}</h2>
        <TripForm user={user} trip={trip} submitLabel={t('Save trip settings')} onSaved={() => { flash(t('Saved')); close(); }} />
      </section>

      <button className="btn quiet" onClick={() => { close(); onNewTrip(); }}><Icon d="plus" size={18} stroke={2} />{t('Plan another trip')}</button>
      <button className="btn danger" onClick={() => signOut(auth)}>{t('Sign out')}</button>
    </Sheet>
  );
}
