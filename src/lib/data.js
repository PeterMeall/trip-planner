import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection, doc, onSnapshot, query, where, updateDoc, deleteDoc, setDoc, getDoc, getDocFromCache, serverTimestamp, writeBatch
} from 'firebase/firestore';
import { auth, db } from './firebase.js';

export function useAuthUser() {
  const [state, setState] = useState({ loading: true, user: null });
  useEffect(() => onAuthStateChanged(auth, (user) => setState({ loading: false, user })), []);
  return state;
}

export function useTrips(email) {
  const [state, setState] = useState({ loading: true, trips: [], error: null });
  useEffect(() => {
    if (!email) return undefined;
    const q = query(collection(db, 'trips'), where('members', 'array-contains', email.toLowerCase()));
    return onSnapshot(q, (snap) => {
      const trips = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      trips.sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));
      setState({ loading: false, trips, error: null });
    }, (error) => setState({ loading: false, trips: [], error }));
  }, [email]);
  return state;
}

export function useSub(tripId, name) {
  const [rows, setRows] = useState([]);
  useEffect(() => {
    if (!tripId) return undefined;
    // A brand-new trip may not have reached the server yet, so the security rules can refuse the
    // first subscription. Listeners stop after an error, so keep retrying until it works.
    let unsub = () => {};
    let timer = null;
    let stopped = false;
    let attempt = 0;
    const listen = () => {
      unsub = onSnapshot(collection(db, 'trips', tripId, name), (snap) => {
        attempt = 0;
        setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      }, (err) => {
        console.warn('Retrying ' + name + ' after: ' + err.code);
        if (stopped) return;
        attempt += 1;
        timer = setTimeout(listen, Math.min(1000 * attempt, 10000));
      });
    };
    listen();
    return () => { stopped = true; clearTimeout(timer); unsub(); };
  }, [tripId, name]);
  return rows;
}

const clean = (obj) => {
  const out = {};
  Object.keys(obj).forEach((k) => { if (obj[k] !== undefined && k !== 'id') out[k] = obj[k]; });
  return out;
};

// Writes are "fire and forget": Firestore applies them to the local cache straight away and syncs
// when there is signal, so the app never waits on the network (ferries, islands, planes).
const report = (err) => {
  console.error(err);
  window.dispatchEvent(new CustomEvent('write-error', { detail: err && err.message ? err.message : String(err) }));
};

export const addRow = (tripId, name, data) => {
  const ref = doc(collection(db, 'trips', tripId, name));
  setDoc(ref, { ...clean(data), createdAt: serverTimestamp() }).catch(report);
  return ref.id;
};
export const updateRow = (tripId, name, id, data) => { updateDoc(doc(db, 'trips', tripId, name, id), clean(data)).catch(report); };
export const deleteRow = (tripId, name, id) => { deleteDoc(doc(db, 'trips', tripId, name, id)).catch(report); };

export const addRows = (tripId, name, list) => {
  const batch = writeBatch(db);
  list.forEach((data) => batch.set(doc(collection(db, 'trips', tripId, name)), { ...clean(data), createdAt: serverTimestamp() }));
  batch.commit().catch(report);
};

export const createTrip = (data) => {
  const ref = doc(collection(db, 'trips'));
  setDoc(ref, { ...clean(data), createdAt: serverTimestamp() }).catch(report);
  return ref.id;
};
export const updateTrip = (tripId, data) => { updateDoc(doc(db, 'trips', tripId), clean(data)).catch(report); };

// Attachments (tickets, receipts) are stored as compressed files in their own documents,
// so the free Firebase plan is enough (Cloud Storage would need the paid plan).
// Metadata lives in "attachments" (small, synced with the lists); the file itself in "files/{same id}",
// loaded only when someone opens it.
export const addAttachment = (tripId, meta, dataUrl) => {
  const ref = doc(collection(db, 'trips', tripId, 'attachments'));
  setDoc(doc(db, 'trips', tripId, 'files', ref.id), { dataUrl }).catch(report);
  setDoc(ref, { ...clean(meta), createdAt: serverTimestamp() }).catch(report);
  return ref.id;
};
export const loadFile = async (tripId, id) => {
  const ref = doc(db, 'trips', tripId, 'files', id);
  let s = null;
  try { s = await getDocFromCache(ref); } catch (e) { s = null; }
  if (!s || !s.exists()) s = await getDoc(ref);
  return s.exists() ? s.data().dataUrl : null;
};
export const removeAttachment = (tripId, id) => {
  deleteDoc(doc(db, 'trips', tripId, 'attachments', id)).catch(report);
  deleteDoc(doc(db, 'trips', tripId, 'files', id)).catch(report);
};

// Shrinks photos to a sensible size so they fit comfortably in a Firestore document (max 1 MB).
export const fileToDataUrl = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Could not read the file'));
  reader.onload = () => {
    const url = reader.result;
    if (!file.type.startsWith('image/')) {
      if (url.length > 950000) reject(new Error('That file is too big. PDFs need to be under about 700 KB.'));
      else resolve(url);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const max = 1400;
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      let q = 0.8;
      let out = c.toDataURL('image/jpeg', q);
      while (out.length > 900000 && q > 0.3) { q -= 0.15; out = c.toDataURL('image/jpeg', q); }
      resolve(out);
    };
    img.onerror = () => reject(new Error('Could not read that image'));
    img.src = url;
  };
  reader.readAsDataURL(file);
});
