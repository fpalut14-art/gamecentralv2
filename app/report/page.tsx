"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { now } from "@/lib/format";

function ReportContent() {
  const searchParams = useSearchParams();
  const targetType = searchParams.get("type") || "general";
  const targetId = searchParams.get("id") || "";

  const [user, setUser] = useState<User | null>(null);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
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

  async function submitReport(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!reason) {
      setNoticeType("error");
      setNotice("Rapor sebebi seçmelisin.");
      return;
    }

    if (!details.trim()) {
      setNoticeType("error");
      setNotice("Detay alanı gerekli.");
      return;
    }

    try {
      setLoading(true);
      setNotice("");

      await addDoc(collection(db, "reports"), {
        reporterId: user?.uid || "",
        reporterEmail: user?.email || "",
        targetType,
        targetId,
        reason,
        details: details.trim(),
        status: "pending",
        createdAt: now(),
      });

      setNoticeType("success");
      setNotice("Rapor admin incelemesine gönderildi.");
      setReason("");
      setDetails("");
    } catch (error) {
      console.error("Rapor gönderilemedi:", error);
      setNoticeType("error");
      setNotice("Rapor gönderilemedi. Lütfen tekrar dene.");
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
          <span style={s.eyebrow}>GAMECENTRAL GÜVENLİK</span>
          <h1 style={s.title}>Şikayet / Rapor Gönder</h1>

          <p style={s.muted}>
            Şüpheli ilan, kullanıcı, sohbet veya genel sorunları admin ekibine
            bildir.
          </p>
        </div>

        <div style={s.targetBox}>
          <span>Hedef</span>
          <strong>
            {targetType}
            {targetId ? ` #${targetId}` : ""}
          </strong>
        </div>

        {notice && <div style={s.noticeBox}>{notice}</div>}

        <form onSubmit={submitReport} style={s.form}>
          <label style={s.field}>
            <span style={s.label}>Rapor sebebi</span>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={s.input}
              required
            >
              <option value="">Sebep seç</option>
              <option value="fraud">Dolandırıcılık şüphesi</option>
              <option value="spam">Spam</option>
              <option value="fake_product">Sahte ürün</option>
              <option value="abuse">Kötüye kullanım</option>
              <option value="other">Diğer</option>
            </select>
          </label>

          <label style={s.field}>
            <span style={s.label}>Detay</span>
            <textarea
              placeholder="Durumu detaylı yaz. Link, kullanıcı adı, mesaj veya ürün bilgisi varsa ekle."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              style={s.textarea}
              required
            />
          </label>

          <button type="submit" style={s.button} disabled={loading}>
            {loading ? "Gönderiliyor..." : "Rapor Gönder"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<main style={fallbackPage}>Rapor sayfası yükleniyor...</main>}>
      <ReportContent />
    </Suspense>
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
    padding: isMobile ? "14px 12px 92px" : 40,
    display: "grid",
    placeItems: isMobile ? "start stretch" : "center",
  };

  const box: React.CSSProperties = {
    width: "100%",
    maxWidth: 680,
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

  const targetBox: React.CSSProperties = {
    marginTop: 20,
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
    marginTop: 26,
    display: "grid",
    gap: 16,
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
    resize: "vertical",
    outline: "none",
    fontSize: 16,
  };

  const button: React.CSSProperties = {
    width: "100%",
    height: 56,
    borderRadius: 14,
    border: "none",
    background: "#ffd400",
    color: "#05060f",
    fontWeight: 900,
    cursor: "pointer",
  };

  return {
    page,
    box,
    backBtn,
    header,
    eyebrow,
    title,
    muted,
    targetBox,
    noticeBox,
    form,
    field,
    label,
    input,
    textarea,
    button,
  };
}

const fallbackPage: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05060f",
  color: "white",
  padding: 40,
  display: "grid",
  placeItems: "center",
};