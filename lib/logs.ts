import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';
import { now } from './format';

export async function createLog(params: { event: string; detail?: string; userId?: string }) {
  return addDoc(collection(db, 'logs'), {
    event: params.event,
    detail: params.detail || '',
    userId: params.userId || '',
    createdAt: now(),
  });
}
