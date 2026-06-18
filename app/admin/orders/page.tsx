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
import { createNotification } from "@/lib/notifications";
import { createLog } from "@/lib/logs";
import { money, now } from "@/lib/format";
import type { Order, OrderStatus } from "@/types";

export default function AdminOrdersPage() {
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

  async function loadOrders() {
    try {
      setLoading(true);
      setErrorMessage("");

      const snap = await getDocs(collection(db, "orders"));

      const data = snap.docs
        .map((item) => ({ id: item.id, ...item.data() } as Order))
        .sort((a, b) =>
          String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
        );

      setOrders(data);
    } catch (error) {
      console.error("Siparişler çekilemedi:", error);
      setErrorMessage("Siparişler yüklenemedi. Firestore izinlerini kontrol et.");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(order: Order, status: OrderStatus) {
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status,
        updatedAt: now(),
      });

      if (order.buyerId) {
        await createNotification({
          userId: order.buyerId,
          title: "Sipariş durumu güncellendi",
          message: `${order.productTitle || "Sipariş"}: ${label(status)}`,
          type: "order",
        });
      }

      if (order.sellerId) {
        await createNotification({
          userId: order.sellerId,
          title: "Sipariş durumu güncellendi",
          message: `${order.productTitle || "Sipariş"}: ${label(status)}`,
          type: "order",
        });
      }

      await createLog({
        event: "order_status_updated",
        detail: `${order.id} → ${status}`,
      });

      await loadOrders();
    } catch (error) {
      console.error("Sipariş durumu güncellenemedi:", error);
      setErrorMessage("Sipariş durumu güncellenemedi.");
    }
  }

  async function removeOrder(order: Order) {
    if (!confirm("Bu siparişi silmek istiyor musun?")) return;

    try {
      await deleteDoc(doc(db, "orders", order.id));

      await createLog({
        event: "order_deleted",
        detail: order.id,
      });

      await loadOrders();
    } catch (error) {
      console.error("Sipariş silinemedi:", error);
      setErrorMessage("Sipariş silinemedi.");
    }
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const s = getStyles(isMobile);

  return (
    <div>
      <div style={s.top}>
        <div>
          <span style={s.eyebrow}>ADMIN ORDERS</span>
          <h1 style={s.title}>Sipariş Yönetimi</h1>
          <p style={s.muted}>
            Faz 1 beta işlem taleplerini yönet. Gerçek ödeme yoktur.
          </p>
        </div>

        <button type="button" onClick={loadOrders} style={s.refresh}>
          {loading ? "Yükleniyor..." : "Yenile"}
        </button>
      </div>

      {errorMessage && <div style={s.errorBox}>{errorMessage}</div>}

      {loading && <p style={s.muted}>Siparişler yükleniyor...</p>}

      {!loading && orders.length === 0 && (
        <div style={s.empty}>Sipariş bulunamadı.</div>
      )}

      <div style={s.grid}>
        {orders.map((order) => (
          <article key={order.id} style={s.card}>
            <span style={badge(order.status)}>{label(order.status)}</span>

            <h3 style={s.cardTitle}>{order.productTitle || "Ürün yok"}</h3>

            <div style={s.infoBox}>
              <span>Alıcı</span>
              <strong>{order.buyerEmail || "Yok"}</strong>
            </div>

            <div style={s.infoBox}>
              <span>Satıcı</span>
              <strong>{order.sellerEmail || "Yok"}</strong>
            </div>

            <div style={s.infoBox}>
              <span>Sipariş ID</span>
              <strong>{order.id}</strong>
            </div>

            <strong style={s.price}>{money(order.amount)}</strong>

            <div style={s.actions}>
              <button
                type="button"
                onClick={() => updateStatus(order, "accepted")}
                style={s.approveBtn}
              >
                Kabul Et
              </button>

              <button
                type="button"
                onClick={() => updateStatus(order, "in_delivery")}
                style={s.deliverBtn}
              >
                Teslimatta
              </button>

              <button
                type="button"
                onClick={() => updateStatus(order, "completed")}
                style={s.completeBtn}
              >
                Tamamlandı
              </button>

              <button
                type="button"
                onClick={() => updateStatus(order, "cancelled")}
                style={s.cancelBtn}
              >
                İptal
              </button>

              <button
                type="button"
                onClick={() => removeOrder(order)}
                style={s.deleteBtn}
              >
                Sil
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
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

  const price: React.CSSProperties = {
    color: "#ffd400",
    fontSize: isMobile ? 24 : 30,
  };

  const actions: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)",
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

  const deliverBtn: React.CSSProperties = {
    ...baseBtn,
    border: "1px solid rgba(56,189,248,0.35)",
    background: "rgba(56,189,248,0.1)",
    color: "#38bdf8",
  };

  const completeBtn: React.CSSProperties = {
    ...baseBtn,
    border: "1px solid rgba(34,197,94,0.35)",
    background: "rgba(34,197,94,0.12)",
    color: "#22c55e",
  };

  const cancelBtn: React.CSSProperties = {
    ...baseBtn,
    border: "1px solid rgba(239,68,68,0.35)",
    background: "rgba(239,68,68,0.1)",
    color: "#ef4444",
  };

  const deleteBtn: React.CSSProperties = {
    ...baseBtn,
    border: "1px solid rgba(148,163,184,0.35)",
    background: "rgba(148,163,184,0.08)",
    color: "#cbd5e1",
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
    price,
    actions,
    approveBtn,
    deliverBtn,
    completeBtn,
    cancelBtn,
    deleteBtn,
  };
}