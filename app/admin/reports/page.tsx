'use client';

import React, { useEffect, useState } from 'react';
import { collection, doc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createLog } from '@/lib/logs';
import { now } from '@/lib/format';
import type { Report } from '@/types';

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadReports() {
    try {
      setLoading(true);
      const snap = await getDocs(collection(db, 'reports'));
      setReports(snap.docs.map((item) => ({ id: item.id, ...item.data() } as Report)));
    } catch (error) {
      console.error(error);
      alert('Raporlar çekilemedi.');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: Report['status']) {
    await updateDoc(doc(db, 'reports', id), { status, updatedAt: now() });
    await createLog({ event: 'report_status_updated', detail: `${id} → ${status}` });
    await loadReports();
  }

  useEffect(() => {
    loadReports();
  }, []);

  return (
    <div>
      <div style={top}>
        <div>
          <h1 style={title}>Rapor / Şikayet Yönetimi</h1>
          <p style={muted}>Kullanıcı şikayetlerini incele.</p>
        </div>
        <button onClick={loadReports} style={refresh}>Yenile</button>
      </div>

      {loading && <p style={muted}>Raporlar yükleniyor...</p>}
      {!loading && reports.length === 0 && <div style={empty}>Bekleyen rapor yok.</div>}

      <div style={grid}>
        {reports.map((report) => (
          <article key={report.id} style={card}>
            <span style={badge(report.status)}>{report.status || 'pending'}</span>
            <h3>{report.reason || 'Sebep yok'}</h3>
            <p style={muted}>Hedef: {report.targetType || 'general'}</p>
            <p style={muted}>Hedef ID: {report.targetId || 'Yok'}</p>
            <p>{report.details || 'Detay yok'}</p>

            <div style={actions}>
              <button onClick={() => updateStatus(report.id, 'reviewed')} style={pendingBtn}>İncelendi</button>
              <button onClick={() => updateStatus(report.id, 'resolved')} style={approveBtn}>Çözüldü</button>
              <button onClick={() => updateStatus(report.id, 'rejected')} style={rejectBtn}>Reddet</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function badge(status?: string): React.CSSProperties {
  const base: React.CSSProperties = { width: 'fit-content', padding: '7px 11px', borderRadius: 999, fontWeight: 900, fontSize: 13 };
  if (status === 'resolved') return { ...base, background: 'rgba(34,197,94,0.12)', color: '#22c55e' };
  if (status === 'rejected') return { ...base, background: 'rgba(239,68,68,0.12)', color: '#ef4444' };
  return { ...base, background: 'rgba(255,212,0,0.12)', color: '#ffd400' };
}

const top: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 };
const title: React.CSSProperties = { fontSize: 34, margin: 0 };
const muted: React.CSSProperties = { color: '#94a3b8' };
const refresh: React.CSSProperties = { padding: '12px 18px', borderRadius: 12, border: '1px solid rgba(255,212,0,0.35)', background: 'rgba(255,212,0,0.09)', color: '#ffd400', fontWeight: 900, cursor: 'pointer' };
const empty: React.CSSProperties = { padding: 20, borderRadius: 16, background: '#101827', color: '#94a3b8' };
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 18 };
const card: React.CSSProperties = { padding: 22, borderRadius: 18, background: '#101827', border: '1px solid #263244', display: 'grid', gap: 12 };
const actions: React.CSSProperties = { display: 'flex', gap: 10, flexWrap: 'wrap' };
const approveBtn: React.CSSProperties = { padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(34,197,94,0.35)', background: 'rgba(34,197,94,0.1)', color: '#22c55e', fontWeight: 900, cursor: 'pointer' };
const pendingBtn: React.CSSProperties = { padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(255,212,0,0.35)', background: 'rgba(255,212,0,0.1)', color: '#ffd400', fontWeight: 900, cursor: 'pointer' };
const rejectBtn: React.CSSProperties = { padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: 900, cursor: 'pointer' };
