import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const LOCAL_STORAGE_KEY = 'estatemind_watchlist';

export function getLocalWatchlist(): string[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalWatchlist(ids: string[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // Ignore storage quota/private mode errors
  }
}

/**
 * Toggles a property in the user's Firestore favorites collection and local storage.
 */
export async function toggleWatchlistProperty(
  userId: string | null | undefined,
  propertyId: string,
  shouldSave: boolean
): Promise<string[]> {
  // Update local storage
  const current = getLocalWatchlist();
  let updated: string[];
  if (shouldSave) {
    updated = current.includes(propertyId) ? current : [...current, propertyId];
  } else {
    updated = current.filter((id) => id !== propertyId);
  }
  saveLocalWatchlist(updated);

  // If user is truly authenticated with Firebase Auth, sync with Firestore
  if (userId && auth.currentUser && auth.currentUser.uid === userId) {
    const docPath = `users/${userId}/favorites/${propertyId}`;
    try {
      const favRef = doc(db, 'users', userId, 'favorites', propertyId);
      if (shouldSave) {
        await setDoc(favRef, {
          propertyId,
          userId,
          savedAt: new Date().toISOString(),
        });
      } else {
        await deleteDoc(favRef);
      }
    } catch (error) {
      console.warn('Firestore Watchlist write note:', error);
    }
  }

  return updated;
}

/**
 * Subscribe to real-time watchlist changes in Firestore for an authenticated user.
 */
export function subscribeToUserWatchlist(
  userId: string,
  onUpdate: (starredIds: string[]) => void
): () => void {
  // Guard: only listen if user is legitimately authenticated in Firebase Auth
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    onUpdate(getLocalWatchlist());
    return () => {};
  }

  const collectionPath = `users/${userId}/favorites`;
  const favCollection = collection(db, 'users', userId, 'favorites');

  const unsubscribe = onSnapshot(
    favCollection,
    (snapshot) => {
      const ids: string[] = [];
      snapshot.forEach((docSnapshot) => {
        ids.push(docSnapshot.id);
      });
      // Synchronize with local storage
      saveLocalWatchlist(ids);
      onUpdate(ids);
    },
    (error) => {
      // Gracefully handle permission/network changes without throwing uncaught errors in async listeners
      console.warn('Watchlist Firestore sync note (using local cache):', error.message);
      onUpdate(getLocalWatchlist());
    }
  );

  return unsubscribe;
}

