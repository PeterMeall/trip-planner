import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase.js';
import { Sheet, SheetHead, Icon } from '../components/ui.jsx';
import { TripForm } from '../screens/TripSetup.jsx';
import { downloadIcs } from '../lib/ics.js';
import { dShort } from '../lib/util.js';

export default function Settings({ ctx }) {
  const { trip, trips, user, items, close, flash, onSwitch, onNewTrip } = ctx;
  return (
    <Sheet onClose={close} full label="Settings">
      <SheetHead title="Settings" sub={'Signed in as ' + user.email} onClose={close} />

      <section className="section">
        <h2 className="eyebrow">Calendar</h2>
        <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p className="small muted" style={{ lineHeight: 1.5 }}>
            Download the itinerary as a calendar file, then open it (or import it at calendar.google.com, Settings, Import). Re-export after big changes.
          </p>
          <button className="btn outline" onClick={() => { downloadIcs(trip, items); flash('Calendar file downloaded'); }}>
            <Icon d="calendar" size={18} />Export to Google Calendar (.ics)
          </button>
        </div>
      </section>

      {trips.length > 1 && (
        <section className="section">
          <h2 className="eyebrow">Your trips</h2>
          <div className="card list">
            {trips.map((t) => (
              <button key={t.id} className="row-btn" onClick={() => { onSwitch(t.id); close(); }}>
                <span className="stack grow" style={{ gap: 2 }}>
                  <span className="row-title">{t.name}</span>
                  <span className="row-meta">{dShort(t.startDate)} to {dShort(t.endDate)}</span>
                </span>
                {t.id === trip.id && <Icon d="check" size={18} stroke={2.4} color="var(--primary)" />}
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="eyebrow">This trip</h2>
        <TripForm user={user} trip={trip} submitLabel="Save trip settings" onSaved={() => { flash('Saved'); close(); }} />
      </section>

      <button className="btn quiet" onClick={() => { close(); onNewTrip(); }}><Icon d="plus" size={18} stroke={2} />Plan another trip</button>
      <button className="btn danger" onClick={() => signOut(auth)}>Sign out</button>
    </Sheet>
  );
}
