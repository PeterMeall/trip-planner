import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  connectFirestoreEmulator
} from 'firebase/firestore';
import { firebaseConfig } from '../firebase-config.js';

export const isConfigured = !String(firebaseConfig.apiKey).includes('PASTE');

const app = initializeApp(isConfigured ? firebaseConfig : { apiKey: 'demo', projectId: 'demo-trip', appId: 'demo' });

export const auth = getAuth(app);

// Offline-first: data is cached on the phone and syncs when there is signal.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

// Local testing only: run with ?emulator in the URL against the Firebase emulators.
if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('emulator')) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
