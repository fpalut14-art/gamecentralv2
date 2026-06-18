"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

type LogItem = {
  id: string;
  event?: string;
  detail?: string;
  userId?: string;
  createdAt?: string;
  [key: string]: any;
};

export default function Logs() {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth <= 900);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  async function loadLogs() {
    try {
      setLoading(true);
      setErrorMessage("");

      const snap = await getDocs(collection(db, "logs"));

      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as LogItem))
        .sort((a, b) =>
          String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
        );

      setLogs(data);
    } catch (error) {
      console.error("Loglar çekilemedi:", error);
      setErrorMessage("Loglar yüklenemedi. Firestore izinlerini kontrol et.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, []);

  const s = getStyles(isMobile);

  return (
    <div>
      <div style={s.top}>
        <div>
          <span style={s.eyebrow}>ADMIN LOGS</span>
          <h1 style={s.title}>Sistem Logları</h1>
          <p style={s.muted}>Admin işlemleri ve sistem olaylarını takip et.</p>
        </div>

        <button type="button" onClick={loadLogs} style={s.refreshBtn}>
          {loading ? "Yükleniyor..." : "Yenile"}
        </button>
      </div>

      {errorMessage && <div style={s.errorBox}>{errorMessage}</div>}

      {loading && <p style={s.muted}>Loglar yükleniyor...</p>}

      {!loading && logs.length === 0 && <div style={s.empty}>Log yok.</div>}

      <div style={s.grid}>
        {logs.map((log) => (
          <article key={log.id} style={s.card}>
            <span style={s.badge}>{log.event || "event yok"}</span>

            <h3 style={s.cardTitle}>{log.detail || "Detay yok"}</h3>

            <div style={s.infoBox}>
              <span>Log ID</span>
              <strong>{log.id}</strong>
            </div>

            <div style={s.infoBox}>
              <span>Kullanıcı</span>
              <strong>{log.userId || "Yok"}</strong>
            </div>

            <div style={s.infoBox}>
              <span>Tarih</span>
              <strong>{log.createdAt || "Yok"}</strong>
            </div>

            <details style={s.details}>
              <summary style={s.summary}>Ham veriyi göster</summary>
              <pre style={s.pre}>{JSON.stringify(log, null, 2)}</pre>
            </details>
          </article>
        ))}
      </div>
    </div>
  );
}

function getStyles(isMobile: boolean) {
  const top: React.CSSProperties = {
    display: isMobile ? "grid" : "flex",
    justifyContent: "space-between",
    alignItems: isMobile ? "stretch" : "center",
    gap: 16,
    marginBottom: 24,
  };

  const eyebrow: React.CSSProperties = {
    color: "#ffd400",
    fontWeight: 900,
    letterSpacing: 1,
    fontSize: 12,
  };

  const title: React.CSSProperties = {
    color: "#ffd400",
    margin: "8px 0 0",
    fontSize: isMobile ? 30 : 34,
    lineHeight: 1.05,
  };

  const muted: React.CSSProperties = {
    color: "#94a3b8",
    overflowWrap: "anywhere",
  };

  const refreshBtn: React.CSSProperties = {
    width: isMobile ? "100%" : "auto",
    minHeight: 46,
    padding: "0 18px",
    borderRadius: 12,
    border: "1px solid rgba(255,212,0,0.35)",
    background: "rgba(255,212,0,0.09)",
    color: "#ffd400",
    fontWeight: 900,
    cursor: "pointer",
  };

  const errorBox: React.CSSProperties = {
    marginBottom: 18,
    padding: 16,
    borderRadius: 14,
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "#fca5a5",
    fontWeight: 800,
  };

  const empty: React.CSSProperties = {
    padding: 20,
    borderRadius: 16,
    background: "#101827",
    color: "#94a3b8",
    border: "1px solid #263244",
  };

  const grid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(320px, 1fr))",
    gap: isMobile ? 14 : 18,
  };

  const card: React.CSSProperties = {
    padding: isMobile ? 18 : 22,
    borderRadius: 18,
    background: "#101827",
    border: "1px solid #263244",
    display: "grid",
    gap: 12,
    overflowWrap: "anywhere",
  };

  const badge: React.CSSProperties = {
    width: "fit-content",
    padding: "7px 11px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 13,
    background: "rgba(255,212,0,0.12)",
    color: "#ffd400",
  };

  const cardTitle: React.CSSProperties = {
    margin: 0,
    color: "white",
    fontSize: isMobile ? 20 : 22,
    lineHeight: 1.25,
  };

  const infoBox: React.CSSProperties = {
    display: "grid",
    gap: 5,
    padding: 12,
    borderRadius: 14,
    background: "rgba(255,255,255,0.035)",
  };

  const details: React.CSSProperties = {
    borderRadius: 14,
    background: "rgba(255,255,255,0.035)",
    padding: 12,
  };

  const summary: React.CSSProperties = {
    cursor: "pointer",
    color: "#ffd400",
    fontWeight: 900,
  };

  const pre: React.CSSProperties = {
    marginTop: 12,
    padding: 12,
    background: "#05060f",
    borderRadius: 12,
    whiteSpace: "pre-wrap",
    overflowX: "auto",
    color: "#cbd5e1",
    fontSize: isMobile ? 12 : 13,
  };

  return {
    top,
    eyebrow,
    title,
    muted,
    refreshBtn,
    errorBox,
    empty,
    grid,
    card,
    badge,
    cardTitle,
    infoBox,
    details,
    summary,
    pre,
  };
}