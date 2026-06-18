"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AdItem, AdStatus } from "@/types";

export default function AdminAds() {
  const [ads, setAds] = useState<AdItem[]>([]);
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

  async function load() {
    try {
      setLoading(true);
      setErrorMessage("");

      const snap = await getDocs(collection(db, "ads"));

      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as AdItem))
        .sort((a, b) =>
          String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
        );

      setAds(data);
    } catch (error) {
      console.error("Reklamlar çekilemedi:", error);
      setErrorMessage("Reklamlar yüklenemedi. Firestore izinlerini kontrol et.");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(ad: AdItem, nextStatus: AdStatus) {
    try {
      await updateDoc(doc(db, "ads", ad.id), {
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });

      await load();
    } catch (error) {
      console.error("Reklam durumu güncellenemedi:", error);
      setErrorMessage("Reklam durumu güncellenemedi.");
    }
  }

  async function remove(ad: AdItem) {
    if (!confirm("Bu reklam başvurusu silinsin mi?")) return;

    try {
      await deleteDoc(doc(db, "ads", ad.id));
      await load();
    } catch (error) {
      console.error("Reklam silinemedi:", error);
      setErrorMessage("Reklam silinemedi.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  const s = getStyles(isMobile);

  return (
    <div>
      <div style={s.top}>
        <div>
          <span style={s.eyebrow}>ADMIN ADS</span>
          <h1 style={s.title}>Reklam Yönetimi</h1>
          <p style={s.muted}>
            Sponsor, banner ve partner slot başvurularını yönet.
          </p>
        </div>

        <button type="button" onClick={load} style={s.refreshBtn}>
          {loading ? "Yükleniyor..." : "Yenile"}
        </button>
      </div>

      {errorMessage && <div style={s.errorBox}>{errorMessage}</div>}

      {loading && <p style={s.muted}>Reklam başvuruları yükleniyor...</p>}

      {!loading && ads.length === 0 && (
        <div style={s.empty}>Reklam başvurusu bulunamadı.</div>
      )}

      <div style={s.grid}>
        {ads.map((ad) => (
          <article key={ad.id} style={s.card}>
            <span style={statusBadge(ad.status)}>{statusLabel(ad.status)}</span>

            <h3 style={s.cardTitle}>{ad.title || "Başlıksız reklam"}</h3>

            <div style={s.infoBox}>
              <span>Marka</span>
              <strong>{ad.brand || "Yok"}</strong>
            </div>

            <div style={s.infoBox}>
              <span>Slot</span>
              <strong>{slotLabel(ad.slot)}</strong>
            </div>

            <div style={s.infoBox}>
              <span>Link</span>
              {ad.link ? (
                <a
                  href={ad.link}
                  target="_blank"
                  rel="noreferrer"
                  style={s.link}
                >
                  {ad.link}
                </a>
              ) : (
                <strong>Yok</strong>
              )}
            </div>

            <div style={s.infoBox}>
              <span>Başvuru ID</span>
              <strong>{ad.id}</strong>
            </div>

            <div style={s.actions}>
              <button
                type="button"
                onClick={() => changeStatus(ad, "active")}
                style={s.approveBtn}
              >
                Onayla
              </button>

              <button
                type="button"
                onClick={() => changeStatus(ad, "rejected")}
                style={s.rejectBtn}
              >
                Reddet
              </button>

              <button
                type="button"
                onClick={() => changeStatus(ad, "pending")}
                style={s.pendingBtn}
              >
                Askıya Al
              </button>

              <button type="button" onClick={() => remove(ad)} style={s.deleteBtn}>
                Sil
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function statusLabel(status?: string) {
  if (status === "active") return "Aktif";
  if (status === "pending") return "Onay Bekliyor";
  if (status === "rejected") return "Reddedildi";
  return status || "Durum Yok";
}

function slotLabel(slot?: string) {
  if (slot === "premium") return "Premium Slider";
  if (slot === "right-banner") return "Sağ Banner";
  if (slot === "partner-slot") return "Partner Slot";
  return slot || "Slot yok";
}

function statusBadge(status?: string): React.CSSProperties {
  const base: React.CSSProperties = {
    width: "fit-content",
    padding: "7px 11px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 13,
  };

  if (status === "active") {
    return {
      ...base,
      background: "rgba(34,197,94,0.12)",
      color: "#22c55e",
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
    padding: 18,
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

  const link: React.CSSProperties = {
    color: "#38bdf8",
    textDecoration: "none",
    overflowWrap: "anywhere",
    fontWeight: 800,
  };

  const actions: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
    gap: 10,
  };

  const baseBtn: React.CSSProperties = {
    minHeight: 44,
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    fontWeight: 900,
    cursor: "pointer",
  };

  const approveBtn: React.CSSProperties = {
    ...baseBtn,
    background: "rgba(34,197,94,0.12)",
    color: "#22c55e",
    border: "1px solid rgba(34,197,94,0.3)",
  };

  const rejectBtn: React.CSSProperties = {
    ...baseBtn,
    background: "rgba(239,68,68,0.12)",
    color: "#ef4444",
    border: "1px solid rgba(239,68,68,0.3)",
  };

  const pendingBtn: React.CSSProperties = {
    ...baseBtn,
    background: "rgba(255,212,0,0.12)",
    color: "#ffd400",
    border: "1px solid rgba(255,212,0,0.3)",
  };

  const deleteBtn: React.CSSProperties = {
    ...baseBtn,
    background: "#ef4444",
    color: "white",
    border: "1px solid #ef4444",
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
    cardTitle,
    infoBox,
    link,
    actions,
    approveBtn,
    rejectBtn,
    pendingBtn,
    deleteBtn,
  };
}