import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { AppUser } from '@/types';
export async function getUserProfile(user: User | null): Promise<AppUser | null> {
  if (!user) return null;
  const snap = await getDoc(doc(db,'users',user.uid));
  if (!snap.exists()) return { id:user.uid, email:user.email || '', role:'user', sellerStatus:'none', banned:false };
  return { id:snap.id, ...(snap.data() as Omit<AppUser,'id'>) };
}
export function canSell(profile?: AppUser | null) { return !!profile && !profile.banned && (profile.role === 'seller' || profile.role === 'admin'); }
export function isAdmin(profile?: AppUser | null) { return !!profile && !profile.banned && profile.role === 'admin'; }
