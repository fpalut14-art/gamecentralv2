'use client';

import React, { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createNotification } from '@/lib/notifications';
import { createLog } from '@/lib/logs';
import { money, now } from '@/lib/format';
import type { Order, OrderStatus } from '@/types';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadOrders() {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'orders'));
      setOrders(snap.docs.map((item) => ({ id: item.id, ...item.data() } as Order)));
    } catch (error) {
      console.error(error);
      alert('Siparişler çekilemedi.');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(order: Order, status: OrderStatus) {
    await updateDoc(doc(db, 'orders', order.id), { status, updatedAt: now() });

    if (order.buyerId) {
      await createNotification({
        userId: order.buyerId,
        title: 'Sipariş durumu güncellendi',
        message: `${order.productTitle || 'Sipariş'}: ${status}`,
        type: 'order',
      });
    }

    await createLog({ event: 'order_status_updated', detail: `${order.id} → ${status}` });
    await loadOrders();
  }

  async function removeOrder(order: Order) {
    if (!confirm('Bu siparişi silmek istiyor musun?')) return;
    await deleteDoc(doc(db, 'orders', order.id));
    await createLog({ event: 'order_deleted', detail: order.id });
    await loadOrders();
  }

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div>
      <div style={top}>
        <div>
          <h1 style={title}>Sipariş Yönetimi</h1>
          <p style={muted}>Faz 1 beta işlem taleplerini yönet. Gerçek ödeme yoktur.</p>
        </div>
        <button onClick={loadOrders} style={refresh}>Yenile</button>
      </div>

      {loading && <p style={muted}>Siparişler yükleniyor...</p>}

      <div style={grid}>
        {orders.map((order) => (
          <article key={order.id} style={card}>
            <span style={badge(order.status)}>{label(order.status)}</span>
            <h3>{order.productTitle || 'Ürün yok'}</h3>
            <p style={muted}>Alıcı: {order.buyerEmail || 'Yok'}</p>
            <p style={muted}>Satıcı: {order.sellerEmail || 'Yok'}</p>
            <strong style={price}>{money(order.amount)}</strong>

            <div style={actions}>
              <button onClick={() => updateStatus(order, 'accepted')} style={approveBtn}>Kabul Et</button>
              <button onClick={() => updateStatus(order, 'in_delivery')} style={deliverBtn}>Teslimatta</button>
              <button onClick={() => updateStatus(order, 'completed')} style={deliverBtn}>Tamamlandı</button>
              <button onClick={() => updateStatus(order, 'cancelled')} style={cancelBtn}>İptal</button>
              <button onClick={() => removeOrder(order)} style={deleteBtn}>Sil</button>
            </div>
          </article>
        ))}
      </div>
    </div>
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

const top: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 };
const title: React.CSSProperties = { fontSize: 34, margin: 0 };
const muted: React.CSSProperties = { color: '#94a3b8' };
const refresh: React.CSSProperties = { padding: '12px 18px', borderRadius: 12, border: '1px solid rgba(255,212,0,0.35)', background: 'rgba(255,212,0,0.09)', color: '#ffd400', fontWeight: 900, cursor: 'pointer' };
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 };
const card: React.CSSProperties = { padding: 22, borderRadius: 18, background: '#101827', border: '1px solid #263244', display: 'grid', gap: 12 };
const price: React.CSSProperties = { color: '#ffd400', fontSize: 30 };
const actions: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' };
const approveBtn: React.CSSProperties = { padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontWeight: 900, cursor: 'pointer' };
const deliverBtn: React.CSSProperties = { padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(56,189,248,0.35)', background: 'rgba(56,189,248,0.1)', color: '#38bdf8', fontWeight: 900, cursor: 'pointer' };
const cancelBtn: React.CSSProperties = { padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 900, cursor: 'pointer' };
const deleteBtn: React.CSSProperties = { padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(148,163,184,0.35)', background: 'rgba(148,163,184,0.08)', color: '#cbd5e1', fontWeight: 900, cursor: 'pointer' };
