'use client';

import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { money } from '@/lib/format';

type Stats = {
  users: number;
  activeProducts: number;
  pendingProducts: number;
  orders: number;
  support: number;
  reports: number;
  sellerRequests: number;
  ads: number;
  betaVolume: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    activeProducts: 0,
    pendingProducts: 0,
    orders: 0,
    support: 0,
    reports: 0,
    sellerRequests: 0,
    ads: 0,
    betaVolume: 0,
  });
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setLoading(true);
      const [users, products, orders, ads, reports, support, sellerRequests] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'ads')),
        getDocs(query(collection(db, 'reports'), where('status', '==', 'pending'))),
        getDocs(query(collection(db, 'support_tickets'), where('status', '==', 'open'))),
        getDocs(query(collection(db, 'users'), where('sellerStatus', '==', 'pending'))),
      ]);

      const productData = products.docs.map((d) => d.data());
      const orderData = orders.docs.map((d) => d.data());

      setStats({
        users: users.size,
        activeProducts: productData.filter((p) => p.status === 'active').length,
        pendingProducts: productData.filter((p) => p.status === 'pending').length,
        orders: orders.size,
        ads: ads.size,
        reports: reports.size,
        support: support.size,
        sellerRequests: sellerRequests.size,
        betaVolume: orderData.reduce((sum, order) => sum + Number(order.amount || 0), 0),
      });
    } catch (error) {
      console.error('Dashboard verileri çekilemedi:', error);
      alert('Dashboard verileri çekilemedi.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const cards = [
    ['Toplam Kullanıcı', stats.users],
    ['Aktif İlan', stats.activeProducts],
    ['Bekleyen İlan', stats.pendingProducts],
    ['Sipariş Talebi', stats.orders],
    ['Açık Destek', stats.support],
    ['Bekleyen Rapor', stats.reports],
    ['Satıcı Başvurusu', stats.sellerRequests],
    ['Reklam Başvurusu', stats.ads],
    ['Beta İşlem Hacmi', money(stats.betaVolume)],
  ];

  return (
    <div>
      <div style={top}>
        <div>
          <h1 style={title}>Admin Dashboard</h1>
          <p style={muted}>GameCentral Faz 1 Beta sistem merkezi.</p>
        </div>
        <button onClick={load} style={refresh}>Yenile</button>
      </div>

      {loading && <p style={muted}>Veriler yükleniyor...</p>}

      <div style={grid}>
        {cards.map(([label, value]) => (
          <div key={String(label)} style={card}>
            <span style={muted}>{label}</span>
            <strong style={number}>{String(value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

const top: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 };
const title: React.CSSProperties = { fontSize: 34, margin: 0, color: '#ffd400' };
const muted: React.CSSProperties = { color: '#94a3b8' };
const refresh: React.CSSProperties = { padding: '12px 18px', borderRadius: 12, border: '1px solid rgba(255,212,0,0.35)', background: 'rgba(255,212,0,0.09)', color: '#ffd400', fontWeight: 900, cursor: 'pointer' };
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 };
const card: React.CSSProperties = { padding: 22, borderRadius: 18, background: '#101827', border: '1px solid #263244', display: 'grid', gap: 10 };
const number: React.CSSProperties = { color: '#ffd400', fontSize: 34 };
