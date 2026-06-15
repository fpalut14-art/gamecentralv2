'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { onAuthStateChanged, User } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { now } from '@/lib/format';

export default function SupportPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  async function submitTicket(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);
      await addDoc(collection(db, 'support_tickets'), {
        userId: user?.uid || '',
        email: user?.email || '',
        subject,
        message,
        status: 'open',
        createdAt: now(),
      });

      alert('Destek talebin oluşturuldu.');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error(error);
      alert('Destek talebi oluşturulamadı.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={page}>
      <section style={box}>
        <Link href="/" style={backBtn}>← Ana Sayfa</Link>
        <h1 style={title}>Canlı Destek / Talep Oluştur</h1>
        <p style={muted}>Ödeme, ilan, hesap veya teknik sorunlar için destek talebi aç.</p>

        <form onSubmit={submitTicket} style={form}>
          <input style={input} placeholder="Konu" value={subject} onChange={(e) => setSubject(e.target.value)} required />
          <textarea style={textarea} placeholder="Mesajını yaz..." value={message} onChange={(e) => setMessage(e.target.value)} required />
          <button style={button} disabled={loading}>{loading ? 'Gönderiliyor...' : 'Destek Talebi Oluştur'}</button>
        </form>
      </section>
    </main>
  );
}

const page: React.CSSProperties = { minHeight: '100vh', background: '#05060f', color: 'white', display: 'grid', placeItems: 'center', padding: 40 };
const box: React.CSSProperties = { width: '100%', maxWidth: 680, padding: 34, borderRadius: 24, background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' };
const backBtn: React.CSSProperties = { color: '#ffd400', textDecoration: 'none', fontWeight: 900 };
const title: React.CSSProperties = { color: '#ffd400', marginTop: 24 };
const muted: React.CSSProperties = { color: '#94a3b8' };
const form: React.CSSProperties = { display: 'grid', gap: 16, marginTop: 24 };
const input: React.CSSProperties = { height: 54, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: '#111827', color: 'white', padding: '0 16px' };
const textarea: React.CSSProperties = { minHeight: 150, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: '#111827', color: 'white', padding: 16 };
const button: React.CSSProperties = { height: 56, border: 'none', borderRadius: 14, background: '#ffd400', color: '#05060f', fontWeight: 900, cursor: 'pointer' };
