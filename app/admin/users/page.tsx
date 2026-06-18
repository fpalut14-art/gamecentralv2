"use client";

import React, { useEffect, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AppUser, Role } from "@/types";

export default function AdminUsers() {
  const [users, setUsers] = useState<AppUser[]>([]);
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

      const snap = await getDocs(collection(db, "users"));

      const data = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as AppUser[];

      setUsers(data);
    } catch (error) {
      console.error("Kullanıcılar çekilemedi:", error);
      setErrorMessage("Kullanıcılar yüklenemedi. Firestore izinlerini kontrol et.");
    } finally {
      setLoading(false);
    }
  }

  async function changeRole(id: string, nextRole: Role) {
    try {
      await updateDoc(doc(db, "users", id), {
        role: nextRole,
        updatedAt: new Date().toISOString(),
      });

      await load();
    } catch (error) {
      console.error("Rol güncellenemedi:", error);
      setErrorMessage("Rol güncellenemedi.");
    }
  }

  async function toggleBan(user: AppUser) {
    if (!user.id) return;

    try {
      await updateDoc(doc(db, "users", user.id), {
        banned: !user.banned,
        updatedAt: new Date().toISOString(),
      });

      await load();
    } catch (error) {
      console.error("Ban durumu güncellenemedi:", error);
      setErrorMessage("Ban durumu güncellenemedi.");
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
          <span style={s.eyebrow}>ADMIN USERS</span>
          <h1 style={s.title}>Kullanıcılar</h1>
          <p style={s.muted}>
            Kullanıcı rolleri, satıcı yetkileri ve ban durumu.
          </p>
        </div>

        <button type="button" onClick={load} style={s.refreshBtn}>
          {loading ? "Yükleniyor..." : "Yenile"}
        </button>
      </div>

      {errorMessage && <div style={s.errorBox}>{errorMessage}</div>}

      {loading && <p style={s.muted}>Kullanıcılar yükleniyor...</p>}

      {!loading && users.length === 0 && (
        <div style={s.empty}>Kullanıcı bulunamadı.</div>
      )}

      <div style={s.grid}>
        {users.map((user) => (
          <article key={user.id} style={s.card}>
            <div style={s.cardHead}>
              <div style={s.avatar}>
                {String(user.name || user.email || "U").charAt(0).toUpperCase()}
              </div>

              <div style={{ minWidth: 0 }}>
                <h3 style={s.userName}>
                  {user.name || user.email || "İsimsiz"}
                </h3>
                <p style={s.muted}>{user.email || "Email yok"}</p>
              </div>
            </div>

            <div style={s.infoBox}>
              <span>UID</span>
              <strong>{user.id}</strong>
            </div>

            <div style={s.infoGrid}>
              <div style={s.infoBox}>
                <span>Rol</span>
                <strong>{user.role || "user"}</strong>
              </div>

              <div style={s.infoBox}>
                <span>Durum</span>
                <strong style={{ color: user.banned ? "#ef4444" : "#22c55e" }}>
                  {user.banned ? "Banlı" : "Aktif"}
                </strong>
              </div>

              <div style={s.infoBox}>
                <span>Satıcı</span>
                <strong>{user.sellerStatus || "none"}</strong>
              </div>
            </div>

            <div style={s.actions}>
              <button
                type="button"
                onClick={() => user.id && changeRole(user.id, "user")}
                style={s.secondaryBtn}
              >
                User
              </button>

              <button
                type="button"
                onClick={() => user.id && changeRole(user.id, "seller")}
                style={s.secondaryBtn}
              >
                Seller
              </button>

              <button
                type="button"
                onClick={() => user.id && changeRole(user.id, "admin")}
                style={s.adminBtn}
              >
                Admin
              </button>

              <button
                type="button"
                onClick={() => toggleBan(user)}
                style={user.banned ? s.unbanBtn : s.banBtn}
              >
                {user.banned ? "Ban Kaldır" : "Banla"}
              </button>
            </div>
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
    gap: 14,
    overflowWrap: "anywhere",
  };

  const cardHead: React.CSSProperties = {
    display: "flex",
    gap: 12,
    alignItems: "center",
    minWidth: 0,
  };

  const avatar: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: "50%",
    background: "#ffd400",
    color: "#05060f",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    flex: "0 0 auto",
  };

  const userName: React.CSSProperties = {
    margin: 0,
    color: "white",
    fontSize: 20,
    overflowWrap: "anywhere",
  };

  const infoGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
    gap: 10,
  };

  const infoBox: React.CSSProperties = {
    padding: 12,
    borderRadius: 14,
    background: "rgba(255,255,255,0.035)",
    display: "grid",
    gap: 6,
    color: "#cbd5e1",
    minWidth: 0,
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

  const secondaryBtn: React.CSSProperties = {
    ...baseBtn,
    background: "rgba(255,255,255,0.05)",
    color: "white",
  };

  const adminBtn: React.CSSProperties = {
    ...baseBtn,
    background: "rgba(56,189,248,0.12)",
    color: "#38bdf8",
    border: "1px solid rgba(56,189,248,0.3)",
  };

  const banBtn: React.CSSProperties = {
    ...baseBtn,
    background: "rgba(239,68,68,0.12)",
    color: "#ef4444",
    border: "1px solid rgba(239,68,68,0.3)",
  };

  const unbanBtn: React.CSSProperties = {
    ...baseBtn,
    background: "rgba(34,197,94,0.12)",
    color: "#22c55e",
    border: "1px solid rgba(34,197,94,0.3)",
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
    cardHead,
    avatar,
    userName,
    infoGrid,
    infoBox,
    actions,
    secondaryBtn,
    adminBtn,
    banBtn,
    unbanBtn,
  };
}