import { collection, doc, setDoc, getDocs, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { MaintenanceTicket } from '../types';

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

const COLLECTION_PATH = 'maintenance_tickets';

export const INITIAL_TICKETS: MaintenanceTicket[] = [
  {
    id: 'TICK-PROP101-PLUMB-75',
    propertyId: 'PROP-101',
    propertyTitle: 'Downtown Luxury 2-BHK',
    issueCategory: 'PLUMBING',
    issue: 'High-Severity Plumbing Pipe Leak under Kitchen Sink',
    urgency: 'HIGH',
    severity: 'High',
    estimatedCostUsd: 75.00,
    status: 'OPEN',
    reportedDate: 'Today, 08:44 AM',
    reportedBy: 'tenant.john@example.com',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'TICK-7940',
    propertyId: 'PROP-102',
    propertyTitle: 'Modern Suburban Villa',
    issueCategory: 'HVAC',
    issue: 'HVAC Air Filter Replacement & Smart Thermostat Sync',
    urgency: 'MEDIUM',
    severity: 'Medium',
    estimatedCostUsd: 85.00,
    status: 'IN_PROGRESS',
    reportedDate: 'Yesterday',
    reportedBy: 'owner@estatemind.ai',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'TICK-7815',
    propertyId: 'PROP-103',
    propertyTitle: 'Commercial Studio Space',
    issueCategory: 'STRUCTURAL',
    issue: 'Commercial Studio Glass Partition Hinge Calibration',
    urgency: 'LOW',
    severity: 'Low',
    estimatedCostUsd: 60.00,
    status: 'RESOLVED',
    reportedDate: '3 days ago',
    reportedBy: 'facility@techpark.com',
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
];

export async function createMaintenanceTicketInFirestore(ticket: MaintenanceTicket): Promise<void> {
  const path = `${COLLECTION_PATH}/${ticket.id}`;
  try {
    const ticketDoc = doc(collection(db, COLLECTION_PATH), ticket.id);
    await setDoc(ticketDoc, {
      ...ticket,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateMaintenanceTicketStatusInFirestore(
  ticketId: string,
  newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'
): Promise<void> {
  const path = `${COLLECTION_PATH}/${ticketId}`;
  try {
    const ticketDoc = doc(collection(db, COLLECTION_PATH), ticketId);
    await updateDoc(ticketDoc, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToMaintenanceTickets(
  onUpdate: (tickets: MaintenanceTicket[]) => void,
  onError?: (err: any) => void
): () => void {
  const collectionRef = collection(db, COLLECTION_PATH);
  return onSnapshot(
    collectionRef,
    (snapshot) => {
      if (snapshot.empty) {
        // If Firestore collection has no documents yet, return INITIAL_TICKETS
        onUpdate(INITIAL_TICKETS);
      } else {
        const loaded: MaintenanceTicket[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as MaintenanceTicket;
          loaded.push({ ...data, id: docSnap.id });
        });
        // Sort with newest open tickets first
        loaded.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        onUpdate(loaded);
      }
    },
    (error) => {
      console.warn('Firestore snapshot subscription note:', error);
      handleFirestoreError(error, OperationType.GET, COLLECTION_PATH);
      if (onError) onError(error);
    }
  );
}
