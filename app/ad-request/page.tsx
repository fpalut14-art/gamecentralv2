"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdRequestPage() {
  const [brand, setBrand] = useState("");
  const [title, setTitle] = useState("");
  const [slot, setSlot] = useState("premium");
  const [link, setLink] = useState("");
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

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!brand.trim()) {
      setNoticeType("error");
      setNotice("Marka adı gerekli.");
      return;
    }

    if (!title.trim()) {
      setNoticeType("error");
      setNotice("Reklam başlığı gerekli.");
      return;
    }

    try {
      setLoading(true);
      setNotice("");

      await addDoc(collection(db, "ads"), {
        brand: brand.trim(),
        title: title.trim(),
        slot,
        link: link.trim(),
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      setNoticeType("success");
      setNotice("Reklam başvurusu admin onayına gönderildi.");

      setBrand("");
      setTitle("");
      setSlot("premium");
      setLink("");
    } catch (error) {
      console.error("Reklam başvurusu gönderilemedi:", error);
      setNoticeType("error");
      setNotice("Reklam başvurusu gönderilemedi. Lütfen tekrar dene.");
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
          <span style={s.eyebrow}>GAMECENTRAL PARTNER</span>
          <h1 style={s.title}>Reklam Başvurusu</h1>
          <p style={s.muted}>
            Markanızı GameCentral vitrininde, kategori alanlarında veya partner
            slotlarında göstermek için başvuru oluşturun.
          </p>
        </div>

        <div style={s.slotGrid}>
          <div style={s.infoCard}>
            <strong>Premium Slider</strong>
            <span>Ana vitrinde yüksek görünürlük.</span>
          </div>

          <div style={s.infoCard}>
            <strong>Sağ Banner</strong>
            <span>Ana sayfa sağ reklam alanı.</span>
          </div>

          <div style={s.infoCard}>
            <strong>Partner Slot</strong>
            <span>Partner marka vitrini.</span>
          </div>
        </div>

        {notice && <div style={s.noticeBox}>{notice}</div>}

        <form onSubmit={submit} style={s.form}>
          <label style={s.field}>
            <span style={s.label}>Marka</span>
            <input
              placeholder="Örn: Game Garaj"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              style={s.input}
              required
            />
          </label>

          <label style={s.field}>
            <span style={s.label}>Reklam başlığı</span>
            <input
              placeholder="Örn: Oyunculara özel kampanya"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={s.input}
              required
            />
          </label>

          <label style={s.field}>
            <span style={s.label}>Reklam alanı</span>
            <select
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              style={s.input}
              required
            >
              <option value="premium">Premium Slider</option>
              <option value="right-banner">Sağ Banner</option>
              <option value="partner-slot">Partner Slot</option>
            </select>
          </label>

          <label style={s.field}>
            <span style={s.label}>Link</span>
            <input
              placeholder="https://marka.com/kampanya"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              style={s.input}
            />
          </label>

          <button type="submit" style={s.button} disabled={loading}>
            {loading ? "GÖNDERİLİYOR..." : "BAŞVURU GÖNDER"}
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
    maxWidth: 760,
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

  const slotGrid: React.CSSProperties = {
    marginTop: 20,
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
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
    marginTop: 24,
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

  const button: React.CSSProperties = {
    width: "100%",
    height: 56,
    border: "none",
    borderRadius: 14,
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
    slotGrid,
    infoCard,
    noticeBox,
    form,
    field,
    label,
    input,
    button,
  };
}