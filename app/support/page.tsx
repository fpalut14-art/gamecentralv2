"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged, User } from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { now } from "@/lib/format";

export default function SupportPage() {
  const [user, setUser] = useState<User | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeType, setNoticeType] = useState<"success" | "error" | "info">(
    "info"
  );

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth <= 760);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  async function submitTicket(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!subject.trim()) {
      setNoticeType("error");
      setNotice("Konu alanı gerekli.");
      return;
    }

    if (!message.trim()) {
      setNoticeType("error");
      setNotice("Mesaj alanı gerekli.");
      return;
    }

    try {
      setLoading(true);
      setNotice("");

      await addDoc(collection(db, "support_tickets"), {
        userId: user?.uid || "",
        email: user?.email || "",
        subject: subject.trim(),
        message: message.trim(),
        status: "open",
        createdAt: now(),
      });

      setNoticeType("success");
      setNotice("Destek talebin oluşturuldu.");
      setSubject("");
      setMessage("");
    } catch (error) {
      console.error("Destek talebi oluşturulamadı:", error);
      setNoticeType("error");
      setNotice("Destek talebi oluşturulamadı. Lütfen tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  const s = getStyles(isMobile, noticeType);

  return (
    <main style={s.page}>
      <section style={s.box}>
        <Link href="/" style={s.backBtn}>
          ← Ana Sayfa
        </Link>

        <div style={s.header}>
          <span style={s.eyebrow}>GAMECENTRAL DESTEK</span>
          <h1 style={s.title}>Canlı Destek / Talep Oluştur</h1>
          <p style={s.muted}>
            Ödeme, ilan, hesap veya teknik sorunlar için destek talebi aç.
          </p>
        </div>

        <div style={s.infoGrid}>
          <div style={s.infoCard}>
            <strong>Hesap</strong>
            <span>{user?.email || "Giriş yapılmamış kullanıcı"}</span>
          </div>

          <div style={s.infoCard}>
            <strong>Durum</strong>
            <span>Beta destek kanalı açık</span>
          </div>
        </div>

        {notice && <div style={s.noticeBox}>{notice}</div>}

        <form onSubmit={submitTicket} style={s.form}>
          <label style={s.field}>
            <span style={s.label}>Konu</span>
            <input
              style={s.input}
              placeholder="Örn: İlanım görünmüyor"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </label>

          <label style={s.field}>
            <span style={s.label}>Mesaj</span>
            <textarea
              style={s.textarea}
              placeholder="Sorununu detaylı şekilde yaz..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </label>

          <button type="submit" style={s.button} disabled={loading}>
            {loading ? "Gönderiliyor..." : "Destek Talebi Oluştur"}
          </button>
        </form>
      </section>
    </main>
  );
}

function getStyles(
  isMobile: boolean,
  noticeType: "success" | "error" | "info"
) {
  const noticeColor =
    noticeType === "success"
      ? "#22c55e"
      : noticeType === "error"
      ? "#fca5a5"
      : "#93c5fd";

  const noticeBg =
    noticeType === "success"
      ? "rgba(34,197,94,0.1)"
      : noticeType === "error"
      ? "rgba(239,68,68,0.12)"
      : "rgba(59,130,246,0.1)";

  const page: React.CSSProperties = {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(255,212,0,0.08), transparent 24%), #05060f",
    color: "white",
    display: "grid",
    placeItems: isMobile ? "start stretch" : "center",
    padding: isMobile ? "14px 12px 92px" : 40,
  };

  const box: React.CSSProperties = {
    width: "100%",
    maxWidth: 720,
    margin: "0 auto",
    padding: isMobile ? 18 : 34,
    borderRadius: isMobile ? 20 : 24,
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    boxShadow: "0 26px 90px rgba(0,0,0,0.35)",
  };

  const backBtn: React.CSSProperties = {
    color: "#ffd400",
    textDecoration: "none",
    fontWeight: 900,
  };

  const header: React.CSSProperties = {
    marginTop: 24,
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
    fontSize: isMobile ? 30 : 38,
    lineHeight: 1.05,
  };

  const muted: React.CSSProperties = {
    color: "#94a3b8",
    lineHeight: 1.6,
  };

  const infoGrid: React.CSSProperties = {
    marginTop: 20,
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: 12,
  };

  const infoCard: React.CSSProperties = {
    padding: 14,
    borderRadius: 16,
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.07)",
    display: "grid",
    gap: 6,
    color: "#cbd5e1",
    overflowWrap: "anywhere",
  };

  const noticeBox: React.CSSProperties = {
    marginTop: 18,
    padding: 14,
    borderRadius: 14,
    color: noticeColor,
    background: noticeBg,
    border: `1px solid ${noticeColor}55`,
    fontWeight: 800,
    lineHeight: 1.4,
  };

  const form: React.CSSProperties = {
    display: "grid",
    gap: 16,
    marginTop: 24,
  };

  const field: React.CSSProperties = {
    display: "grid",
    gap: 8,
  };

  const label: React.CSSProperties = {
    color: "#cbd5e1",
    fontWeight: 900,
  };

  const input: React.CSSProperties = {
    width: "100%",
    height: 54,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#111827",
    color: "white",
    padding: "0 16px",
    outline: "none",
    fontSize: 16,
  };

  const textarea: React.CSSProperties = {
    width: "100%",
    minHeight: isMobile ? 170 : 150,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.1)",
    background: "#111827",
    color: "white",
    padding: 16,
    outline: "none",
    resize: "vertical",
    fontSize: 16,
  };

  const button: React.CSSProperties = {
    width: "100%",
    height: 56,
    border: "none",
    borderRadius: 14,
    background: "#ffd400",
    color: "#05060f",
    fontWeight: 900,
    cursor: loadingCursor(false),
  };

  return {
    page,
    box,
    backBtn,
    header,
    eyebrow,
    title,
    muted,
    infoGrid,
    infoCard,
    noticeBox,
    form,
    field,
    label,
    input,
    textarea,
    button,
  };
}

function loadingCursor(disabled: boolean) {
  return disabled ? "not-allowed" : "pointer";
}