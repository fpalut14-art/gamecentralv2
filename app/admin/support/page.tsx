'use client';

import React, { useEffect, useState } from 'react';
import { addDoc, collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createNotification } from '@/lib/notifications';
import { createLog } from '@/lib/logs';
import { now } from '@/lib/format';
import type { SupportTicket } from '@/types';

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  async function loadTickets() {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'support_tickets'));
      setTickets(snap.docs.map((item) => ({ id: item.id, ...item.data() } as SupportTicket)));
    } catch (error) {
      console.error(error);
      alert('Destek talepleri çekilemedi.');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: SupportTicket['status']) {
    await updateDoc(doc(db, 'support_tickets', id), { status, updatedAt: now() });
    await createLog({ event: 'support_status_updated', detail: `${id} → ${status}` });
    await loadTickets();
  }

  async function sendReply(ticket: SupportTicket) {
    const reply = replyMap[ticket.id];
    if (!reply || !reply.trim()) {
      alert('Cevap boş olamaz.');
      return;
    }

    await addDoc(collection(db, 'support_messages'), {
      ticketId: ticket.id,
      senderId: 'admin',
      senderEmail: 'admin',
      text: reply,
      createdAt: now(),
    });

    await updateDoc(doc(db, 'support_tickets', ticket.id), { status: 'answered', updatedAt: now() });

    if (ticket.userId) {
      await createNotification({
        userId: ticket.userId,
        title: 'Destek talebin cevaplandı',
        message: ticket.subject || 'Destek talebine cevap verildi.',
        type: 'support',
      });
    }

    await createLog({ event: 'support_reply_sent', detail: ticket.id });
    setReplyMap((prev) => ({ ...prev, [ticket.id]: '' }));
    await loadTickets();
  }

  useEffect(() => {
    loadTickets();
  }, []);

  return (
    <div>
      <div style={top}>
        <div>
          <h1 style={title}>Canlı Destek Yönetimi</h1>
          <p style={muted}>Destek taleplerini cevapla ve kapat.</p>
        </div>
        <button onClick={loadTickets} style={refresh}>Yenile</button>
      </div>

      {loading && <p style={muted}>Talepler yükleniyor...</p>}

      <div style={grid}>
        {tickets.map((ticket) => (
          <article key={ticket.id} style={card}>
            <span style={badge(ticket.status)}>{ticket.status || 'open'}</span>
            <h3>{ticket.subject || 'Konu yok'}</h3>
            <p style={muted}>Email: {ticket.email || 'Yok'}</p>
            <p>{ticket.message || 'Mesaj yok'}</p>

            <textarea
              style={textarea}
              placeholder="Admin cevabı..."
              value={replyMap[ticket.id] || ''}
              onChange={(e) => setReplyMap((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
            />

            <div style={actions}>
              <button onClick={() => sendReply(ticket)} style={approveBtn}>Cevapla</button>
              <button onClick={() => updateStatus(ticket.id, 'open')} style={pendingBtn}>Açık</button>
              <button onClick={() => updateStatus(ticket.id, 'closed')} style={deleteBtn}>Kapat</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function badge(status?: string): React.CSSProperties {
  const base: React.CSSProperties = { width: 'fit-content', padding: '7px 11px', borderRadius: 999, fontWeight: 900, fontSize: 13 };
  if (status === 'answered') return { ...base, background: 'rgba(34,197,94,0.12)', color: '#22c55e' };
  if (status === 'closed') return { ...base, background: 'rgba(239,68,68,0.12)', color: '#ef4444' };
  return { ...base, background: 'rgba(255,212,0,0.12)', color: '#ffd400' };
}

const top: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 };
const title: React.CSSProperties = { fontSize: 34, margin: 0 };
const muted: React.CSSProperties = { color: '#94a3b8' };
const refresh: React.CSSProperties = { padding: '12px 18px', borderRadius: 12, border: '1px solid rgba(255,212,0,0.35)', background: 'rgba(255,212,0,0.09)', color: '#ffd400', fontWeight: 900, cursor: 'pointer' };
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 };
const card: React.CSSProperties = { padding: 22, borderRadius: 18, background: '#101827', border: '1px solid #263244', display: 'grid', gap: 12 };
const textarea: React.CSSProperties = { minHeight: 110, borderRadius: 12, background: '#111827', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: 12 };
const actions: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' };
const approveBtn: React.CSSProperties = { padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontWeight: 900, cursor: 'pointer' };
const pendingBtn: React.CSSProperties = { padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,212,0,0.35)', background: 'rgba(255,212,0,0.1)', color: '#ffd400', fontWeight: 900, cursor: 'pointer' };
const deleteBtn: React.CSSProperties = { padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 900, cursor: 'pointer' };
