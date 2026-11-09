import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Property, AuthUser, UserFavoriteItem } from '../types';

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

const COLLECTION_NAME = 'user_favorites';
const LOCAL_FAVORITES_KEY = 'estatemind_local_favorites';

export function getLocalFavorites(): UserFavoriteItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalFavorites(items: UserFavoriteItem[]) {
  try {
    localStorage.setItem(LOCAL_FAVORITES_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota/private mode errors
  }
}

export function getFavoriteDocId(userId: string, propertyId: string): string {
  // Safe sanitized composite key for Firestore document ID
  const cleanUser = userId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const cleanProp = propertyId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${cleanUser}_${cleanProp}`;
}

/**
 * Saves or updates a property in the dedicated 'user_favorites' collection in Firestore.
 */
export async function saveUserFavorite(
  user: AuthUser,
  property: Property,
  notes: string = ''
): Promise<UserFavoriteItem> {
  const docId = getFavoriteDocId(user.uid, property.id);
  const docPath = `${COLLECTION_NAME}/${docId}`;

  const priceDisplay =
    property.type === 'Rent'
      ? `$${property.rent?.toLocaleString() || '0'}/mo`
      : `$${property.price?.toLocaleString() || '0'}`;

  const favoriteItem: UserFavoriteItem = {
    id: docId,
    userId: user.uid,
    userEmail: user.email || 'authenticated-user@estatemind.ai',
    propertyId: property.id,
    propertyTitle: property.title,
    propertyType: property.type,
    propertyCategory: property.category,
    location: property.location,
    priceDisplay,
    image: property.image,
    notes: notes || '',
    savedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Always save to local cache
  const local = getLocalFavorites();
  const existingIdx = local.findIndex((item) => item.propertyId === property.id);
  if (existingIdx >= 0) {
    local[existingIdx] = favoriteItem;
  } else {
    local.unshift(favoriteItem);
  }
  saveLocalFavorites(local);

  // If user is authentically signed into Firebase Auth, persist to Firestore
  if (auth.currentUser && auth.currentUser.uid === user.uid) {
    try {
      const docRef = doc(db, COLLECTION_NAME, docId);
      await setDoc(docRef, favoriteItem);
    } catch (error) {
      console.warn('Firestore favorites write note (saved locally):', error);
    }
  }

  return favoriteItem;
}

/**
 * Removes a property from the user's Firestore 'user_favorites' collection.
 */
export async function removeUserFavorite(userId: string, propertyId: string): Promise<void> {
  const docId = getFavoriteDocId(userId, propertyId);

  // Remove from local cache
  const local = getLocalFavorites().filter((item) => item.propertyId !== propertyId);
  saveLocalFavorites(local);

  // If authenticated in Firebase Auth, remove from Firestore
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      const docRef = doc(db, COLLECTION_NAME, docId);
      await deleteDoc(docRef);
    } catch (error) {
      console.warn('Firestore favorites delete note:', error);
    }
  }
}

/**
 * Updates personal notes on an already favorited property in Firestore.
 */
export async function updateFavoriteNotes(
  userId: string,
  propertyId: string,
  notes: string
): Promise<void> {
  const docId = getFavoriteDocId(userId, propertyId);

  // Update local cache
  const local = getLocalFavorites();
  const target = local.find((item) => item.propertyId === propertyId);
  if (target) {
    target.notes = notes.trim();
    target.updatedAt = new Date().toISOString();
    saveLocalFavorites(local);
  }

  // If authenticated in Firebase Auth, update Firestore
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      const docRef = doc(db, COLLECTION_NAME, docId);
      await updateDoc(docRef, {
        notes: notes.trim(),
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Firestore favorites update note:', error);
    }
  }
}

/**
 * Subscribes to real-time changes in the user_favorites collection for the current user.
 */
export function subscribeToUserFavorites(
  userId: string,
  onUpdate: (favorites: UserFavoriteItem[]) => void,
  onError?: (error: any) => void
): () => void {
  // If not authenticated in Firebase Auth, fallback immediately to local cache
  if (!auth.currentUser || auth.currentUser.uid !== userId) {
    onUpdate(getLocalFavorites());
    return () => {};
  }

  const collectionRef = collection(db, COLLECTION_NAME);
  const userQuery = query(collectionRef, where('userId', '==', userId));

  const unsubscribe = onSnapshot(
    userQuery,
    (snapshot) => {
      const items: UserFavoriteItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserFavoriteItem;
        items.push({
          ...data,
          id: docSnap.id,
        });
      });
      // Sort newest saved first
      items.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
      saveLocalFavorites(items);
      onUpdate(items);
    },
    (error) => {
      console.warn('Real-time favorites subscription note (using local cache):', error.message);
      onUpdate(getLocalFavorites());
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Batch-imports temporary session watchlist items into permanent Firestore user_favorites.
 */
export async function importWatchlistToFavorites(
  user: AuthUser,
  properties: Property[],
  watchlistIds: string[]
): Promise<number> {
  let importedCount = 0;
  const toImport = properties.filter((p) => watchlistIds.includes(p.id));

  for (const prop of toImport) {
    try {
      await saveUserFavorite(user, prop, 'Imported from session Watchlist');
      importedCount++;
    } catch (err) {
      console.warn(`Failed to import ${prop.id} to favorites:`, err);
    }
  }

  return importedCount;
}
