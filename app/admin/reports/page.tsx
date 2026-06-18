"use client";

import React, { useEffect, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createLog } from "@/lib/logs";
import { now } from "@/lib/format";
import type { Report } from "@/types";

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
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

  async function loadReports() {
    try {
      setLoading(true);
      setErrorMessage("");

      const snap = await getDocs(collection(db, "reports"));

      const data = snap.docs
        .map((item) => ({ id: item.id, ...item.data() } as Report))
        .sort((a, b) =>
          String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
        );

      setReports(data);
    } catch (error) {
      console.error("Raporlar çekilemedi:", error);
      setErrorMessage("Raporlar yüklenemedi. Firestore izinlerini kontrol et.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, status: Report["status"]) {
    try {
      await updateDoc(doc(db, "reports", id), {
        status,
        updatedAt: now(),
      });

      await createLog({
        event: "report_status_updated",
        detail: `${id} → ${status}`,
      });

      await loadReports();
    } catch (error) {
      console.error("Rapor durumu güncellenemedi:", error);
      setErrorMessage("Rapor durumu güncellenemedi.");
    }
  }

  useEffect(() => {
    loadReports();
  }, []);

  const s = getStyles(isMobile);

  return (
    <div>
      <div style={s.top}>
        <div>
          <span style={s.eyebrow}>ADMIN REPORTS</span>
          <h1 style={s.title}>Rapor / Şikayet Yönetimi</h1>
          <p style={s.muted}>Kullanıcı şikayetlerini incele ve sonuçlandır.</p>
        </div>

        <button type="button" onClick={loadReports} style={s.refresh}>
          {loading ? "Yükleniyor..." : "Yenile"}
        </button>
      </div>

      {errorMessage && <div style={s.errorBox}>{errorMessage}</div>}

      {loading && <p style={s.muted}>Raporlar yükleniyor...</p>}

      {!loading && reports.length === 0 && (
        <div style={s.empty}>Bekleyen rapor yok.</div>
      )}

      <div style={s.grid}>
        {reports.map((report) => (
          <article key={report.id} style={s.card}>
            <span style={badge(report.status)}>
              {statusLabel(report.status)}
            </span>

            <h3 style={s.cardTitle}>{reasonLabel(report.reason)}</h3>

            <div style={s.infoBox}>
              <span>Rapor ID</span>
              <strong>{report.id}</strong>
            </div>

            <div style={s.infoBox}>
              <span>Hedef</span>
              <strong>
                {report.targetType || "general"}
                {report.targetId ? ` / ${report.targetId}` : ""}
              </strong>
            </div>

            <div style={s.infoBox}>
              <span>Raporlayan</span>
              <strong>{report.reporterEmail || report.reporterId || "Yok"}</strong>
            </div>

            <div style={s.detailBox}>
              <strong>Detay</strong>
              <p>{report.details || "Detay yok"}</p>
            </div>

            <div style={s.actions}>
              <button
                type="button"
                onClick={() => updateStatus(report.id, "reviewed")}
                style={s.pendingBtn}
              >
                İncelendi
              </button>

              <button
                type="button"
                onClick={() => updateStatus(report.id, "resolved")}
                style={s.approveBtn}
              >
                Çözüldü
              </button>

              <button
                type="button"
                onClick={() => updateStatus(report.id, "rejected")}
                style={s.rejectBtn}
              >
                Reddet
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function statusLabel(status?: string) {
  if (status === "pending") return "Bekliyor";
  if (status === "reviewed") return "İncelendi";
  if (status === "resolved") return "Çözüldü";
  if (status === "rejected") return "Reddedildi";
  return status || "Bekliyor";
}

function reasonLabel(reason?: string) {
  if (reason === "fraud") return "Dolandırıcılık şüphesi";
  if (reason === "spam") return "Spam";
  if (reason === "fake_product") return "Sahte ürün";
  if (reason === "abuse") return "Kötüye kullanım";
  if (reason === "other") return "Diğer";
  return reason || "Sebep yok";
}

function badge(status?: string): React.CSSProperties {
  const base: React.CSSProperties = {
    width: "fit-content",
    padding: "7px 11px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 13,
  };

  if (status === "resolved") {
    return {
      ...base,
      background: "rgba(34,197,94,0.12)",
      color: "#22c55e",
    };
  }

  if (status === "reviewed") {
    return {
      ...base,
      background: "rgba(56,189,248,0.12)",
      color: "#38bdf8",
    };
  }

  if (status === "rejected") {
    return {
      ...base,
      background: "rgba(239,68,68,0.12)",
      color: "#ef4444",
    };
  }

  return {
    ...base,
    background: "rgba(255,212,0,0.12)",
    color: "#ffd400",
  };
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
    fontSize: isMobile ? 30 : 34,
    margin: "8px 0 0",
    color: "#ffd400",
    lineHeight: 1.05,
  };

  const muted: React.CSSProperties = {
    color: "#94a3b8",
    overflowWrap: "anywhere",
  };

  const refresh: React.CSSProperties = {
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

  const cardTitle: React.CSSProperties = {
    margin: 0,
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

  const detailBox: React.CSSProperties = {
    padding: 14,
    borderRadius: 14,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    color: "#cbd5e1",
    lineHeight: 1.6,
  };

  const actions: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
    gap: 10,
  };

  const baseBtn: React.CSSProperties = {
    minHeight: 44,
    borderRadius: 12,
    fontWeight: 900,
    cursor: "pointer",
  };

  const approveBtn: React.CSSProperties = {
    ...baseBtn,
    border: "1px solid rgba(34,197,94,0.35)",
    background: "rgba(34,197,94,0.1)",
    color: "#22c55e",
  };

  const pendingBtn: React.CSSProperties = {
    ...baseBtn,
    border: "1px solid rgba(255,212,0,0.35)",
    background: "rgba(255,212,0,0.1)",
    color: "#ffd400",
  };

  const rejectBtn: React.CSSProperties = {
    ...baseBtn,
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.1)",
    color: "#ef4444",
  };

  return {
    top,
    eyebrow,
    title,
    muted,
    refresh,
    errorBox,
    empty,
    grid,
    card,
    cardTitle,
    infoBox,
    detailBox,
    actions,
    approveBtn,
    pendingBtn,
    rejectBtn,
  };
}