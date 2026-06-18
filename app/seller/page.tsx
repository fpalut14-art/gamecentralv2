"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { money } from "@/lib/format";
import type { AppUser, Order, Product } from "@/types";

export default function SellerDashboard() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
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

  async function loadSellerData(uid: string) {
    try {
      setErrorMessage("");

      const pq = query(collection(db, "products"), where("sellerId", "==", uid));
      const oq = query(collection(db, "orders"), where("sellerId", "==", uid));

      const [ps, os] = await Promise.all([getDocs(pq), getDocs(oq)]);

      const productData = ps.docs
        .map((d) => ({ id: d.id, ...d.data() } as Product))
        .sort((a, b) =>
          String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
        );

      const orderData = os.docs
        .map((d) => ({ id: d.id, ...d.data() } as Order))
        .sort((a, b) =>
          String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
        );

      setProducts(productData);
      setOrders(orderData);
    } catch (error) {
      console.error("Satıcı verileri çekilemedi:", error);
      setErrorMessage("Satıcı verileri yüklenemedi. Firestore izinlerini kontrol et.");
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));
        const data = snap.exists()
          ? ({ id: snap.id, ...snap.data() } as AppUser)
          : null;

        if (
          !data ||
          data.banned ||
          !(data.role === "seller" || data.role === "admin")
        ) {
          router.push("/profile");
          return;
        }

        setUser(currentUser);
        setProfile(data);
        await loadSellerData(currentUser.uid);
      } catch (error) {
        console.error("Satıcı yetki kontrolü yapılamadı:", error);
        setErrorMessage("Satıcı yetkisi kontrol edilemedi.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  const s = getStyles(isMobile);

  if (loading) {
    return <main style={s.loadingPage}>Satıcı paneli yükleniyor...</main>;
  }

  const acceptedOrders = orders.filter(
    (o) =>
      o.status === "accepted" ||
      o.status === "in_delivery" ||
      o.status === "completed"
  );

  const completedOrders = orders.filter((o) => o.status === "completed");

  const betaRevenue = completedOrders.reduce(
    (sum, order) => sum + Number(order.amount || 0),
    0
  );

  const cards = [
    ["Toplam İlan", products.length],
    ["Aktif İlan", products.filter((p) => p.status === "active").length],
    ["Bekleyen İlan", products.filter((p) => p.status === "pending").length],
    ["Sipariş Talebi", orders.length],
    ["Devam Eden İşlem", acceptedOrders.length],
    ["Bilgi Amaçlı Gelir", money(betaRevenue)],
  ];

  return (
    <main style={s.page}>
      <div style={s.wrap}>
        <div style={s.top}>
          <div>
            <span style={s.eyebrow}>GAMECENTRAL SELLER</span>
            <h1 style={s.title}>Satıcı Paneli</h1>
            <p style={s.muted}>{profile?.email || user?.email}</p>
          </div>

          <div style={s.topActions}>
            <Link href="/" style={s.outlineBtn}>
              Ana Sayfa
            </Link>

            <Link href="/create" style={s.primaryBtn}>
              Yeni İlan
            </Link>
          </div>
        </div>

        {errorMessage && <div style={s.errorBox}>{errorMessage}</div>}

        <section style={s.statsGrid}>
          {cards.map(([label, value]) => (
            <div key={String(label)} style={s.statCard}>
              <span style={s.muted}>{label}</span>
              <strong style={s.statNumber}>{String(value)}</strong>
            </div>
          ))}
        </section>

        <section style={s.section}>
          <div style={s.sectionHead}>
            <h2 style={s.sectionTitle}>İlanlarım</h2>
            <Link href="/create" style={s.smallLink}>
              + Yeni ilan
            </Link>
          </div>

          {products.length === 0 && (
            <div style={s.empty}>Henüz ilan oluşturmadın.</div>
          )}

          <div style={s.grid}>
            {products.map((product) => (
              <article key={product.id} style={s.card}>
                <span style={statusBadge(product.status)}>
                  {statusLabel(product.status)}
                </span>

                <h3 style={s.cardTitle}>{product.title || "Başlıksız ilan"}</h3>

                <div style={s.metaBox}>
                  <span>Kategori</span>
                  <strong>{product.category || "Yok"}</strong>
                </div>

                <strong style={s.price}>{money(product.price)}</strong>

                <div style={s.cardActions}>
                  <Link href={`/listing/${product.id}`} style={s.outlineBtn}>
                    İlanı Gör
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section style={s.section}>
          <div style={s.sectionHead}>
            <h2 style={s.sectionTitle}>Sipariş Talepleri</h2>
            <Link href="/messages" style={s.smallLink}>
              Mesajlar
            </Link>
          </div>

          {orders.length === 0 && (
            <div style={s.empty}>Henüz sipariş talebi yok.</div>
          )}

          <div style={s.grid}>
            {orders.map((order) => (
              <article key={order.id} style={s.card}>
                <span style={statusBadge(order.status)}>
                  {statusLabel(order.status)}
                </span>

                <h3 style={s.cardTitle}>{order.productTitle || "Ürün yok"}</h3>

                <div style={s.metaBox}>
                  <span>Alıcı</span>
                  <strong>{order.buyerEmail || "Yok"}</strong>
                </div>

                <strong style={s.price}>{money(order.amount)}</strong>

                <div style={s.cardActions}>
                  {order.productId && (
                    <Link href={`/listing/${order.productId}`} style={s.outlineBtn}>
                      İlanı Aç
                    </Link>
                  )}

                  {order.chatId && (
                    <Link href={`/chat/${order.chatId}`} style={s.primaryBtn}>
                      Sohbeti Aç
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function statusLabel(status?: string) {
  if (status === "active") return "Aktif";
  if (status === "pending") return "Onay Bekliyor";
  if (status === "rejected") return "Reddedildi";
  if (status === "accepted") return "Kabul Edildi";
  if (status === "completed") return "Tamamlandı";
  if (status === "cancelled") return "İptal";
  if (status === "in_delivery") return "Teslimatta";
  return status || "Durum Yok";
}

function statusBadge(status?: string): React.CSSProperties {
  const base: React.CSSProperties = {
    width: "fit-content",
    padding: "7px 11px",
    borderRadius: 999,
    fontWeight: 900,
    fontSize: 13,
  };

  if (status === "active" || status === "accepted" || status === "completed") {
    return {
      ...base,
      background: "rgba(34,197,94,0.12)",
      color: "#22c55e",
    };
  }

  if (status === "rejected" || status === "cancelled") {
    return {
      ...base,
      background: "rgba(239,68,68,0.12)",
      color: "#ef4444",
    };
  }

  if (status === "in_delivery") {
    return {
      ...base,
      background: "rgba(56,189,248,0.12)",
      color: "#38bdf8",
    };
  }

  return {
    ...base,
    background: "rgba(255,212,0,0.12)",
    color: "#ffd400",
  };
}

function getStyles(isMobile: boolean) {
  const loadingPage: React.CSSProperties = {
    minHeight: "100vh",
    background: "#05060f",
    color: "white",
    display: "grid",
    placeItems: "center",
    padding: 20,
  };

  const page: React.CSSProperties = {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(255,212,0,0.08), transparent 24%), #05060f",
    color: "white",
    padding: isMobile ? "14px 12px 92px" : 40,
  };

  const wrap: React.CSSProperties = {
    maxWidth: 1300,
    margin: "0 auto",
  };

  const top: React.CSSProperties = {
    display: isMobile ? "grid" : "flex",
    justifyContent: "space-between",
    alignItems: isMobile ? "stretch" : "center",
    gap: isMobile ? 16 : 24,
    marginBottom: 30,
  };

  const topActions: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr 1fr" : "auto auto",
    gap: 12,
  };

  const eyebrow: React.CSSProperties = {
    color: "#ffd400",
    fontWeight: 900,
    letterSpacing: 1,
    fontSize: 12,
  };

  const title: React.CSSProperties = {
    fontSize: isMobile ? 32 : 38,
    color: "#ffd400",
    margin: "8px 0 0",
    lineHeight: 1.05,
  };

  const muted: React.CSSProperties = {
    color: "#94a3b8",
    overflowWrap: "anywhere",
  };

  const primaryBtn: React.CSSProperties = {
    minHeight: 46,
    padding: "0 18px",
    borderRadius: 12,
    background: "#ffd400",
    color: "#05060f",
    textDecoration: "none",
    fontWeight: 900,
    display: "grid",
    placeItems: "center",
    textAlign: "center",
  };

  const outlineBtn: React.CSSProperties = {
    minHeight: 46,
    padding: "0 18px",
    borderRadius: 12,
    border: "1px solid rgba(255,212,0,0.35)",
    color: "#ffd400",
    textDecoration: "none",
    fontWeight: 900,
    display: "grid",
    placeItems: "center",
    textAlign: "center",
  };

  const errorBox: React.CSSProperties = {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    color: "#fca5a5",
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.3)",
    fontWeight: 800,
  };

  const statsGrid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "repeat(2, minmax(0, 1fr))"
      : "repeat(auto-fit, minmax(220px, 1fr))",
    gap: isMobile ? 12 : 18,
    marginBottom: 30,
  };

  const statCard: React.CSSProperties = {
    padding: isMobile ? 16 : 22,
    borderRadius: 18,
    background: "#101827",
    border: "1px solid #263244",
    display: "grid",
    gap: 10,
    minWidth: 0,
  };

  const statNumber: React.CSSProperties = {
    color: "#ffd400",
    fontSize: isMobile ? 25 : 34,
    overflowWrap: "anywhere",
  };

  const section: React.CSSProperties = {
    marginBottom: 30,
  };

  const sectionHead: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  };

  const sectionTitle: React.CSSProperties = {
    color: "#ffd400",
    margin: 0,
    fontSize: isMobile ? 24 : 28,
  };

  const smallLink: React.CSSProperties = {
    color: "#ffd400",
    textDecoration: "none",
    fontWeight: 900,
  };

  const grid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(300px, 1fr))",
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

  const metaBox: React.CSSProperties = {
    display: "grid",
    gap: 5,
    padding: 12,
    borderRadius: 14,
    background: "rgba(255,255,255,0.035)",
  };

  const empty: React.CSSProperties = {
    padding: 18,
    borderRadius: 16,
    background: "#101827",
    color: "#94a3b8",
    border: "1px solid #263244",
    marginBottom: 16,
  };

  const price: React.CSSProperties = {
    color: "#ffd400",
    fontSize: isMobile ? 24 : 28,
  };

  const cardActions: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
    gap: 10,
  };

  return {
    loadingPage,
    page,
    wrap,
    top,
    topActions,
    eyebrow,
    title,
    muted,
    primaryBtn,
    outlineBtn,
    errorBox,
    statsGrid,
    statCard,
    statNumber,
    section,
    sectionHead,
    sectionTitle,
    smallLink,
    grid,
    card,
    cardTitle,
    metaBox,
    empty,
    price,
    cardActions,
  };
}