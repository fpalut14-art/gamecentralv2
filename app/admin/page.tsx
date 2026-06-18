"use client";

import React, { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { money } from "@/lib/format";

type Stats = {
  users: number;
  activeProducts: number;
  pendingProducts: number;
  orders: number;
  support: number;
  reports: number;
  sellerRequests: number;
  ads: number;
  betaVolume: number;
};

type LoadErrors = Record<string, string>;

const emptyStats: Stats = {
  users: 0,
  activeProducts: 0,
  pendingProducts: 0,
  orders: 0,
  support: 0,
  reports: 0,
  sellerRequests: 0,
  ads: 0,
  betaVolume: 0,
};

function normalize(value: unknown) {
  return String(value || "").toLocaleLowerCase("tr-TR").trim();
}

function isActiveProduct(product: any) {
  const status = normalize(product.status || product["durum"]);
  return status === "active" || status === "aktif";
}

function isPendingProduct(product: any) {
  const status = normalize(product.status || product["durum"]);
  return status === "pending" || status === "beklemede";
}

function getOrderAmount(order: any) {
  return Number(order.amount ?? order["tutar"] ?? 0);
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>(emptyStats);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<LoadErrors>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth <= 900);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  async function safeGet(label: string, getter: () => Promise<any>) {
    try {
      return await getter();
    } catch (error: any) {
      console.error(`${label} verisi çekilemedi:`, error);

      setErrors((prev) => ({
        ...prev,
        [label]: error?.code || error?.message || "Bilinmeyen hata",
      }));

      return null;
    }
  }

  async function load() {
    setLoading(true);
    setErrors({});

    const usersSnap = await safeGet("users", () =>
      getDocs(collection(db, "users"))
    );

    const productsSnap = await safeGet("products", () =>
      getDocs(collection(db, "products"))
    );

    const ordersSnap = await safeGet("orders", () =>
      getDocs(collection(db, "orders"))
    );

    const adsSnap = await safeGet("ads", () => getDocs(collection(db, "ads")));

    const reportsSnap = await safeGet("reports", () =>
      getDocs(query(collection(db, "reports"), where("status", "==", "pending")))
    );

    const supportSnap = await safeGet("support_tickets", () =>
      getDocs(
        query(collection(db, "support_tickets"), where("status", "==", "open"))
      )
    );

    const sellerRequestsSnap = await safeGet("sellerRequests", () =>
      getDocs(
        query(collection(db, "users"), where("sellerStatus", "==", "pending"))
      )
    );

    const productData = productsSnap?.docs.map((d: any) => d.data()) || [];
    const orderData = ordersSnap?.docs.map((d: any) => d.data()) || [];

    setStats({
      users: usersSnap?.size || 0,
      activeProducts: productData.filter(isActiveProduct).length,
      pendingProducts: productData.filter(isPendingProduct).length,
      orders: ordersSnap?.size || 0,
      ads: adsSnap?.size || 0,
      reports: reportsSnap?.size || 0,
      support: supportSnap?.size || 0,
      sellerRequests: sellerRequestsSnap?.size || 0,
      betaVolume: orderData.reduce(
        (sum: number, order: any) => sum + getOrderAmount(order),
        0
      ),
    });

    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const s = getStyles(isMobile);

  const cards = [
    ["Toplam Kullanıcı", stats.users],
    ["Aktif İlan", stats.activeProducts],
    ["Bekleyen İlan", stats.pendingProducts],
    ["Sipariş Talebi", stats.orders],
    ["Açık Destek", stats.support],
    ["Bekleyen Rapor", stats.reports],
    ["Satıcı Başvurusu", stats.sellerRequests],
    ["Reklam Başvurusu", stats.ads],
    ["Beta İşlem Hacmi", money(stats.betaVolume)],
  ];

  return (
    <div style={s.page}>
      <div style={s.top}>
        <div>
          <span style={s.eyebrow}>GAMECENTRAL ADMIN</span>
          <h1 style={s.title}>Admin Dashboard</h1>
          <p style={s.muted}>GameCentral Faz 1 Beta sistem merkezi.</p>
        </div>

        <button type="button" onClick={load} style={s.refresh}>
          {loading ? "Yükleniyor..." : "Yenile"}
        </button>
      </div>

      {Object.keys(errors).length > 0 && (
        <div style={s.errorBox}>
          <strong>Eksik yüklenen alanlar:</strong>

          {Object.entries(errors).map(([key, value]) => (
            <p key={key} style={{ margin: "8px 0 0" }}>
              {key}: {value}
            </p>
          ))}
        </div>
      )}

      <div style={s.grid}>
        {cards.map(([label, value]) => (
          <div key={String(label)} style={s.card}>
            <span style={s.muted}>{label}</span>
            <strong style={s.number}>{String(value)}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function getStyles(isMobile: boolean) {
  const page: React.CSSProperties = {
    width: "100%",
  };

  const top: React.CSSProperties = {
    display: isMobile ? "grid" : "flex",
    justifyContent: "space-between",
    alignItems: isMobile ? "stretch" : "center",
    marginBottom: 28,
    gap: 16,
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

  const grid: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile
      ? "repeat(2, minmax(0, 1fr))"
      : "repeat(auto-fit, minmax(220px, 1fr))",
    gap: isMobile ? 12 : 18,
  };

  const card: React.CSSProperties = {
    padding: isMobile ? 16 : 22,
    borderRadius: 18,
    background: "#101827",
    border: "1px solid #263244",
    display: "grid",
    gap: 10,
    minWidth: 0,
  };

  const number: React.CSSProperties = {
    color: "#ffd400",
    fontSize: isMobile ? 24 : 34,
    overflowWrap: "anywhere",
  };

  const errorBox: React.CSSProperties = {
    marginBottom: 18,
    padding: 16,
    borderRadius: 14,
    background: "rgba(239,68,68,0.1)",
    border: "1px solid rgba(239,68,68,0.3)",
    color: "#fca5a5",
    overflowWrap: "anywhere",
  };

  return {
    page,
    top,
    eyebrow,
    title,
    muted,
    refresh,
    grid,
    card,
    number,
    errorBox,
  };
}