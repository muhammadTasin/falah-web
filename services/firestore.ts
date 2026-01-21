import { db } from './firebase';
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { DailyLog } from '../types';
function removeUndefinedDeep(value: any): any {
  if (Array.isArray(value)) return value.map(removeUndefinedDeep);
  if (value && typeof value === "object") {
    const out: any = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      out[k] = removeUndefinedDeep(v);
    }
    return out;
  }
  return value;
}

/**
 * Saves the daily log to Firestore.
 * Merges data to preserve existing fields.
 * Adds a server-side timestamp.
 */
export const saveDay = async (uid: string, dateKey: string, log: DailyLog) => {
if (!uid || !dateKey || !log) return;
    
    try {
        const docRef = doc(db, 'users', uid, 'days', dateKey);
        const safeLog = removeUndefinedDeep(log);

await setDoc(
  docRef,
  {
    ...safeLog,
    updatedAt: serverTimestamp(),
  },
  { merge: true }
);

    } catch (error) {
        console.error("Firestore Save Error:", error);
    }
};

/**
 * One-time fetch of the day's log.
 */
export const loadDay = async (uid: string, dateKey: string): Promise<DailyLog | null> => {
    try {
        const docRef = doc(db, 'users', uid, 'days', dateKey);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
            return snapshot.data() as DailyLog;
        }
        return null;
    } catch (error) {
        console.error("Firestore Load Error:", error);
        return null;
    }
};

/**
 * Realtime listener for the day's log.
 * Returns an unsubscribe function.
 */
export const listenDay = (uid: string, dateKey: string, onUpdate: (data: DailyLog | null) => void) => {
    const docRef = doc(db, 'users', uid, 'days', dateKey);
    
    // onSnapshot fires immediately with current contents, then on every change
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
            onUpdate(snapshot.data() as DailyLog);
        } else {
            onUpdate(null);
        }
    }, (error) => {
        console.error("Firestore Listen Error:", error);
    });

    return unsubscribe;
};
