import { useState } from 'react';
import { isConfigured } from './lib/firebase.js';
import { useAuthUser, useTrips } from './lib/data.js';
import Login from './screens/Login.jsx';
import TripSetup from './screens/TripSetup.jsx';
import TripApp from './TripApp.jsx';

const store = {
  get: (k) => { try { return window.localStorage.getItem(k); } catch (e) { return null; } },
  set: (k, v) => { try { window.localStorage.setItem(k, v); } catch (e) { /* private mode */ } }
};

export default function App() {
  const { loading, user } = useAuthUser();

  if (!isConfigured && !new URLSearchParams(window.location.search).has('emulator')) {
    return (
      <div className="auth">
        <h1 className="h1">Almost there</h1>
        <p className="sub">This app isn't connected to Firebase yet. Paste your Firebase config into <b>src/firebase-config.js</b> (step 3 in the setup guide) and push the change.</p>
      </div>
    );
  }
  if (loading) return <div className="auth"><p className="sub">Loading…</p></div>;
  if (!user) return <Login />;
  return <Trips user={user} />;
}

function pickTrip(trips, savedId) {
  const saved = trips.find((t) => t.id === savedId);
  if (saved) return saved;
  const today = new Date().toISOString().slice(0, 10);
  return trips.find((t) => t.startDate <= today && t.endDate >= today)
    || trips.find((t) => t.startDate >= today)
    || trips[trips.length - 1];
}

function Trips({ user }) {
  const email = (user.email || '').toLowerCase();
  const { loading, trips, error } = useTrips(email);
  const [selected, setSelected] = useState(() => store.get('tripId'));
  const [creating, setCreating] = useState(false);

  if (loading) return <div className="auth"><p className="sub">Loading your trips…</p></div>;
  if (error) {
    return (
      <div className="auth">
        <h1 className="h1">Couldn't load trips</h1>
        <p className="error">{error.message}</p>
        <p className="sub">Check that the Firestore security rules from the setup guide have been published.</p>
      </div>
    );
  }
  if (!trips.length || creating) {
    return (
      <TripSetup user={user} first={!trips.length} onCancel={trips.length ? () => setCreating(false) : null}
        onCreated={(id) => { store.set('tripId', id); setSelected(id); setCreating(false); }} />
    );
  }
  const trip = pickTrip(trips, selected);
  return (
    <TripApp key={trip.id} user={user} trip={trip} trips={trips}
      onSwitch={(id) => { store.set('tripId', id); setSelected(id); }}
      onNewTrip={() => setCreating(true)} />
  );
}
