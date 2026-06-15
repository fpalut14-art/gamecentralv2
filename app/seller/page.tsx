'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { money } from '@/lib/format';
import type { AppUser, Order, Product } from '@/types';

export default function SellerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadSellerData(uid: string) {
    const pq = query(collection(db, 'products'), where('sellerId', '==', uid));
    const oq = query(collection(db, 'orders'), where('sellerId', '==', uid));
    const [ps, os] = await Promise.all([getDocs(pq), getDocs(oq)]);
    setProducts(ps.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
    setOrders(os.docs.map((d) => ({ id: d.id, ...d.data() } as Order)));
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }

      const snap = await getDoc(doc(db, 'users', currentUser.uid));
      const data = snap.exists() ? ({ id: snap.id, ...snap.data() } as AppUser) : null;

      if (!data || data.banned || !(data.role === 'seller' || data.role === 'admin')) {
        router.push('/profile');
        return;
      }

      setUser(currentUser);
      setProfile(data);
      await loadSellerData(currentUser.uid);
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  if (loading) return <main style={loadingPage}>Satıcı paneli yükleniyor...</main>;

  const acceptedOrders = orders.filter((o) => o.status === 'accepted' || o.status === 'in_delivery' || o.status === 'completed');
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const betaRevenue = completedOrders.reduce((sum, order) => sum + Number(order.amount || 0), 0);

  const cards = [
    ['Toplam İlan', products.length],
    ['Aktif İlan', products.filter((p) => p.status === 'active').length],
    ['Bekleyen İlan', products.filter((p) => p.status === 'pending').length],
    ['Sipariş Talebi', orders.length],
    ['Devam Eden İşlem', acceptedOrders.length],
    ['Bilgi Amaçlı Gelir', money(betaRevenue)],
  ];

  return (
    <main style={page}>
      <div style={wrap}>
        <div style={top}>
          <div>
            <h1 style={title}>Satıcı Paneli</h1>
            <p style={muted}>{profile?.email || user?.email}</p>
          </div>
          <div style={topActions}>
            <Link href="/" style={outlineBtn}>Ana Sayfa</Link>
            <Link href="/create" style={primaryBtn}>Yeni İlan</Link>
          </div>
        </div>

        <section style={statsGrid}>
          {cards.map(([label, value]) => (
            <div key={String(label)} style={statCard}>
              <span style={muted}>{label}</span>
              <strong style={statNumber}>{String(value)}</strong>
            </div>
          ))}
        </section>

        <section style={section}>
          <h2 style={sectionTitle}>İlanlarım</h2>
          {products.length === 0 && <div style={empty}>Henüz ilan oluşturmadın.</div>}
          <div style={grid}>
            {products.map((product) => (
              <article key={product.id} style={card}>
                <span style={statusBadge(product.status)}>{product.status || 'status yok'}</span>
                <h3>{product.title || 'Başlıksız ilan'}</h3>
                <p style={muted}>Kategori: {product.category || 'Yok'}</p>
                <strong style={price}>{money(product.price)}</strong>
              </article>
            ))}
          </div>
        </section>

        <section style={section}>
          <h2 style={sectionTitle}>Sipariş Talepleri</h2>
          {orders.length === 0 && <div style={empty}>Henüz sipariş talebi yok.</div>}
          <div style={grid}>
            {orders.map((order) => (
              <article key={order.id} style={card}>
                <span style={statusBadge(order.status)}>{order.status || 'status yok'}</span>
                <h3>{order.productTitle || 'Ürün yok'}</h3>
                <p style={muted}>Alıcı: {order.buyerEmail || 'Yok'}</p>
                <strong style={price}>{money(order.amount)}</strong>
                {order.chatId && <Link href={`/chat/${order.chatId}`} style={outlineBtn}>Sohbeti Aç</Link>}
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function statusBadge(status?: string): React.CSSProperties {
  const base: React.CSSProperties = { width: 'fit-content', padding: '7px 11px', borderRadius: 999, fontWeight: 900, fontSize: 13 };
  if (status === 'active' || status === 'accepted' || status === 'completed') return { ...base, background: 'rgba(34,197,94,0.12)', color: '#22c55e' };
  if (status === 'rejected' || status === 'cancelled') return { ...base, background: 'rgba(239,68,68,0.12)', color: '#ef4444' };
  if (status === 'in_delivery') return { ...base, background: 'rgba(56,189,248,0.12)', color: '#38bdf8' };
  return { ...base, background: 'rgba(255,212,0,0.12)', color: '#ffd400' };
}

const loadingPage: React.CSSProperties = { minHeight: '100vh', background: '#05060f', color: 'white', display: 'grid', placeItems: 'center' };
const page: React.CSSProperties = { minHeight: '100vh', background: '#05060f', color: 'white', padding: 40 };
const wrap: React.CSSProperties = { maxWidth: 1300, margin: '0 auto' };
const top: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 };
const topActions: React.CSSProperties = { display: 'flex', gap: 12 };
const title: React.CSSProperties = { fontSize: 38, color: '#ffd400', margin: 0 };
const muted: React.CSSProperties = { color: '#94a3b8' };
const primaryBtn: React.CSSProperties = { padding: '12px 18px', borderRadius: 12, background: '#ffd400', color: '#05060f', textDecoration: 'none', fontWeight: 900 };
const outlineBtn: React.CSSProperties = { padding: '12px 18px', borderRadius: 12, border: '1px solid rgba(255,212,0,0.35)', color: '#ffd400', textDecoration: 'none', fontWeight: 900 };
const statsGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18, marginBottom: 30 };
const statCard: React.CSSProperties = { padding: 22, borderRadius: 18, background: '#101827', border: '1px solid #263244', display: 'grid', gap: 10 };
const statNumber: React.CSSProperties = { color: '#ffd400', fontSize: 34 };
const section: React.CSSProperties = { marginBottom: 30 };
const sectionTitle: React.CSSProperties = { color: '#ffd400', marginBottom: 16 };
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 };
const card: React.CSSProperties = { padding: 22, borderRadius: 18, background: '#101827', border: '1px solid #263244', display: 'grid', gap: 12 };
const empty: React.CSSProperties = { padding: 18, borderRadius: 16, background: '#101827', color: '#94a3b8' };
const price: React.CSSProperties = { color: '#ffd400', fontSize: 28 };
