"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { money } from "@/lib/format";
import type { Order } from "@/types";

export default function MyOrdersPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth <= 760);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  async function loadOrders(currentUser: User) {
    try {
      setLoading(true);
      setErrorMessage("");

      const q = query(
        collection(db, "orders"),
        where("buyerId", "==", currentUser.uid)
      );

      const snap = await getDocs(q);

      const data = snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as Order))
        .sort((a, b) =>
          String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
        );

      setOrders(data);
    } catch (error) {
      console.error("Siparişler çekilemedi:", error);
      setErrorMessage("Siparişler yüklenemedi. Lütfen tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);
      await loadOrders(currentUser);
    });

    return () => unsub();
  }, [router]);

  const s = getStyles(isMobile);

  return (
    <main style={s.page}>
      <div style={s.wrap}>
        <div style={s.top}>
          <div>
            <span style={s.eyebrow}>GAMECENTRAL BETA</span>
            <h1 style={s.title}>Siparişlerim</h1>
            <p style={s.muted}>{user?.email}</p>
          </div>

          <Link href="/" style={s.backBtn}>
            Ana Sayfa
          </Link>
        </div>

        {loading && <p style={s.muted}>Siparişler yükleniyor...</p>}

        {!loading && errorMessage && <div style={s.errorBox}>{errorMessage}</div>}

        {!loading && !errorMessage && orders.length === 0 && (
          <div style={s.empty}>
            Henüz siparişin yok.
            <br />
            Ana sayfadan bir ilan seçerek sipariş talebi oluşturabilirsin.
          </div>
        )}

        <div style={s.grid}>
          {orders.map((order) => (
            <article key={order.id} style={s.card}>
              <span style={badge(order.status)}>{label(order.status)}</span>

              <h3 style={s.cardTitle}>{order.productTitle || "Ürün yok"}</h3>

              <div style={s.metaBox}>
                <span>Satıcı</span>
                <strong>{order.sellerEmail || "Yok"}</strong>
              </div>

              <div style={s.metaBox}>
                <span>Tutar</span>
                <strong style={s.price}>{money(order.amount)}</strong>
              </div>

              {order.createdAt && (
                <div style={s.metaBox}>
                  <span>Tarih</span>
                  <strong>{order.createdAt}</strong>
                </div>
              )}

              <div style={s.actions}>
                {order.productId && (
                  <Link href={`/listing/${order.productId}`} style={s.detailBtn}>
                    İlanı Gör
                  </Link>
                )}

                {order.chatId && (
                  <Link href={`/chat/${order.chatId}`} style={s.chatBtn}>
                    Sohbeti Aç
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

function label(status?: string) {
  if (status === "pending_seller") return "Satıcı Onayı Bekliyor";
  if (status === "accepted") return "Satıcı Kabul Etti";
  if (status === "in_delivery") return "Teslimatta";
  if (status === "completed") return "Tamamlandı";
  if (status === "cancelled") return "İptal Edildi";
  return "Durum Yok";
}

function badge(status?: string): React.CSSProperties {
  const base: React.CSSProperties = {
    width: "fit-content",
    padding: "7px 11px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 13,
  };

  if (status === "accepted" || status === "completed") {
    return {
      ...base,
      background: "rgba(34,197,94,0.12)",
      color: "#22c55e",
    };
  }

  if (status === "in_delivery") {
    return {
      ...base,
      background: "rgba(56,189,248,0.12)",
      color: "#38bdf8",
    };
  }

  if (status === "cancelled") {
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
  const page: React.CSSProperties = {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(255,212,0,0.08), transparent 24%), #05060f",
    color: "white",
    padding: isMobile ? "14px 12px 92px" : 40,
  };

  const wrap: React.CSSProperties = {
    maxWidth: 1200,
    margin: "0 auto",
  };

  const top: React.CSSProperties = {
    display: isMobile ? "grid" : "flex",
    justifyContent: "space-between",
    alignItems: isMobile ? "stretch" : "center",
    gap: isMobile ? 16 : 24,
    marginBottom: 30,
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
    fontSize: isMobile ? 32 : 40,
  };

  const muted: React.CSSProperties = {
    color: "#94a3b8",
    overflowWrap: "anywhere",
  };

  const backBtn: React.CSSProperties = {
    width: isMobile ? "100%" : "fit-content",
    color: "#05060f",
    background: "#ffd400",
    padding: "12px 18px",
    borderRadius: 12,
    fontWeight: 900,
    textDecoration: "none",
    display: "grid",
    placeItems: "center",
  };

  const empty: React.CSSProperties = {
    padding: 20,
    background: "#101827",
    borderRadius: 16,
    marginTop: 20,
    lineHeight: 1.6,
    color: "#94a3b8",
    border: "1px solid #263244",
  };

  const errorBox: React.CSSProperties = {
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    color: "#fca5a5",
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.3)",
    fontWeight: 800,
  };

  const grid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(300px, 1fr))",
    gap: isMobile ? 14 : 18,
    marginTop: 24,
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

  const metaBox: React.CSSProperties = {
    display: "grid",
    gap: 5,
    padding: 12,
    borderRadius: 14,
    background: "rgba(255,255,255,0.035)",
  };

  const price: React.CSSProperties = {
    fontSize: isMobile ? 24 : 28,
    color: "#ffd400",
  };

  const actions: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: 10,
  };

  const detailBtn: React.CSSProperties = {
    display: "grid",
    placeItems: "center",
    minHeight: 46,
    border: "1px solid rgba(255,212,0,.35)",
    borderRadius: 12,
    color: "#ffd400",
    textDecoration: "none",
    fontWeight: 900,
    textAlign: "center",
  };

  const chatBtn: React.CSSProperties = {
    ...detailBtn,
    background: "#ffd400",
    color: "#05060f",
  };

  return {
    page,
    wrap,
    top,
    eyebrow,
    title,
    muted,
    backBtn,
    empty,
    errorBox,
    grid,
    card,
    cardTitle,
    metaBox,
    price,
    actions,
    detailBtn,
    chatBtn,
  };
}