'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { money } from '@/lib/format';
import type { Order } from '@/types';

export default function MyOrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      const q = query(collection(db, 'orders'), where('buyerId', '==', currentUser.uid));
      const snap = await getDocs(q);
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  return (
    <main style={page}>
      <div style={wrap}>
        <div style={top}>
          <div>
            <h1 style={title}>Siparişlerim</h1>
            <p style={muted}>{user?.email}</p>
          </div>
          <Link href="/" style={backBtn}>Ana Sayfa</Link>
        </div>

        {loading && <p style={muted}>Siparişler yükleniyor...</p>}
        {!loading && orders.length === 0 && <div style={empty}>Henüz siparişin yok.</div>}

        <div style={grid}>
          {orders.map((order) => (
            <article key={order.id} style={card}>
              <span style={badge(order.status)}>{label(order.status)}</span>
              <h3>{order.productTitle || 'Ürün yok'}</h3>
              <p style={muted}>Satıcı: {order.sellerEmail || 'Yok'}</p>
              <strong style={price}>{money(order.amount)}</strong>

              {order.productId && <Link href={`/listing/${order.productId}`} style={detailBtn}>İlanı Gör</Link>}
              {order.chatId && <Link href={`/chat/${order.chatId}`} style={detailBtn}>Sohbeti Aç</Link>}
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

function label(status?: string) {
  if (status === 'pending_seller') return 'Satıcı Onayı Bekliyor';
  if (status === 'accepted') return 'Satıcı Kabul Etti';
  if (status === 'in_delivery') return 'Teslimatta';
  if (status === 'completed') return 'Tamamlandı';
  if (status === 'cancelled') return 'İptal Edildi';
  return 'Durum Yok';
}

function badge(status?: string): React.CSSProperties {
  const base: React.CSSProperties = { width: 'fit-content', padding: '7px 11px', borderRadius: 999, fontWeight: 900, fontSize: 13 };
  if (status === 'accepted' || status === 'completed') return { ...base, background: 'rgba(34,197,94,0.12)', color: '#22c55e' };
  if (status === 'in_delivery') return { ...base, background: 'rgba(56,189,248,0.12)', color: '#38bdf8' };
  if (status === 'cancelled') return { ...base, background: 'rgba(239,68,68,0.12)', color: '#ef4444' };
  return { ...base, background: 'rgba(255,212,0,0.12)', color: '#ffd400' };
}

const page: React.CSSProperties = { minHeight: '100vh', background: '#05060f', color: 'white', padding: 40 };
const wrap: React.CSSProperties = { maxWidth: 1200, margin: '0 auto' };
const top: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 };
const title: React.CSSProperties = { color: '#ffd400', margin: 0 };
const muted: React.CSSProperties = { color: '#94a3b8' };
const backBtn: React.CSSProperties = { color: '#05060f', background: '#ffd400', padding: '12px 18px', borderRadius: 12, fontWeight: 900, textDecoration: 'none' };
const empty: React.CSSProperties = { padding: 20, background: '#101827', borderRadius: 16, marginTop: 20 };
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18, marginTop: 24 };
const card: React.CSSProperties = { padding: 22, borderRadius: 18, background: '#101827', border: '1px solid #263244', display: 'grid', gap: 12 };
const price: React.CSSProperties = { fontSize: 28, color: '#ffd400' };
const detailBtn: React.CSSProperties = { display: 'grid', placeItems: 'center', height: 44, border: '1px solid rgba(255,212,0,.35)', borderRadius: 12, color: '#ffd400', textDecoration: 'none', fontWeight: 900 };
