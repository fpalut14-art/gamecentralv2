'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { now } from '@/lib/format';

function ReportContent() {
  const searchParams = useSearchParams();
  const targetType = searchParams.get('type') || 'general';
  const targetId = searchParams.get('id') || '';

  const [user, setUser] = useState<User | null>(null);
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  async function submitReport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);
      await addDoc(collection(db, 'reports'), {
        reporterId: user?.uid || '',
        reporterEmail: user?.email || '',
        targetType,
        targetId,
        reason,
        details,
        status: 'pending',
        createdAt: now(),
      });

      alert('Rapor admin incelemesine gönderildi.');
      setReason('');
      setDetails('');
    } catch (error) {
      console.error('Rapor gönderilemedi:', error);
      alert('Rapor gönderilemedi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={page}>
      <section style={box}>
        <Link href="/" style={backBtn}>← Ana Sayfa</Link>
        <h1 style={title}>Şikayet / Rapor Gönder</h1>
        <p style={muted}>Hedef: {targetType} {targetId ? `#${targetId}` : ''}</p>

        <form onSubmit={submitReport} style={form}>
          <select value={reason} onChange={(e) => setReason(e.target.value)} style={input} required>
            <option value="">Sebep seç</option>
            <option value="fraud">Dolandırıcılık şüphesi</option>
            <option value="spam">Spam</option>
            <option value="fake_product">Sahte ürün</option>
            <option value="abuse">Kötüye kullanım</option>
            <option value="other">Diğer</option>
          </select>

          <textarea placeholder="Detayları yaz..." value={details} onChange={(e) => setDetails(e.target.value)} style={textarea} required />
          <button type="submit" style={button} disabled={loading}>{loading ? 'Gönderiliyor...' : 'Rapor Gönder'}</button>
        </form>
      </section>
    </main>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<main style={page}>Rapor sayfası yükleniyor...</main>}>
      <ReportContent />
    </Suspense>
  );
}

const page: React.CSSProperties = { minHeight: '100vh', background: '#05060f', color: 'white', padding: 40, display: 'grid', placeItems: 'center' };
const box: React.CSSProperties = { width: '100%', maxWidth: 620, padding: 34, borderRadius: 24, background: '#0f172a', border: '1px solid rgba(255,255,255,0.08)' };
const backBtn: React.CSSProperties = { color: '#ffd400', textDecoration: 'none', fontWeight: 900 };
const title: React.CSSProperties = { color: '#ffd400', marginTop: 24, fontSize: 34 };
const muted: React.CSSProperties = { color: '#94a3b8', marginTop: 10 };
const form: React.CSSProperties = { marginTop: 26, display: 'grid', gap: 16 };
const input: React.CSSProperties = { height: 54, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: '#111827', color: 'white', padding: '0 16px' };
const textarea: React.CSSProperties = { minHeight: 150, borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: '#111827', color: 'white', padding: 16, resize: 'vertical' };
const button: React.CSSProperties = { height: 56, borderRadius: 14, border: 'none', background: '#ffd400', color: '#05060f', fontWeight: 900, cursor: 'pointer' };
