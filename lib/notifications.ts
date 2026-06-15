import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';
import { now } from './format';

export async function notify(userId: string, title: string, message: string, type = 'system') {
  if (!userId) return null;
  return addDoc(collection(db, 'notifications'), {
    userId,
    title,
    message,
    type,
    read: false,
    createdAt: now(),
  });
}

export async function createNotification(params: { userId: string; title: string; message: string; type?: string }) {
  return notify(params.userId, params.title, params.message, params.type || 'system');
}
