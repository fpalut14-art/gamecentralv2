"use client";

import React, { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Product, ProductStatus } from "@/types";
import { money } from "@/lib/format";

export default function AdminListings() {
  const [products, setProducts] = useState<Product[]>([]);
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

      const snap = await getDocs(collection(db, "products"));

      const data = snap.docs
        .map((d) => mapProduct(d.id, d.data()))
        .sort((a, b) =>
          String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
        );

      setProducts(data);
    } catch (error) {
      console.error("İlanlar çekilemedi:", error);
      setErrorMessage("İlanlar yüklenemedi. Firestore izinlerini kontrol et.");
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(product: Product, nextStatus: ProductStatus) {
    try {
      await updateDoc(doc(db, "products", product.id), {
        status: nextStatus,
        durum:
          nextStatus === "active"
            ? "aktif"
            : nextStatus === "pending"
            ? "beklemede"
            : nextStatus === "rejected"
            ? "reddedildi"
            : nextStatus,
        updatedAt: new Date().toISOString(),
        "güncellendi": new Date().toISOString(),
      });

      if (product.sellerId) {
        await addDoc(collection(db, "notifications"), {
          userId: product.sellerId,
          title:
            nextStatus === "active"
              ? "İlanın onaylandı"
              : nextStatus === "rejected"
              ? "İlanın reddedildi"
              : "İlanın askıya alındı",
          message: `${product.title || "İlan"} durumu: ${nextStatus}`,
          read: false,
          type: "listing",
          createdAt: new Date().toISOString(),
        });
      }

      await load();
    } catch (error) {
      console.error("İlan durumu güncellenemedi:", error);
      setErrorMessage("İlan durumu güncellenemedi.");
    }
  }

  async function remove(product: Product) {
    if (!confirm("Bu ilan silinsin mi?")) return;

    try {
      await deleteDoc(doc(db, "products", product.id));
      await load();
    } catch (error) {
      console.error("İlan silinemedi:", error);
      setErrorMessage("İlan silinemedi.");
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
          <span style={s.eyebrow}>ADMIN LISTINGS</span>
          <h1 style={s.title}>İlan Yönetimi</h1>
          <p style={s.muted}>
            Bekleyen ilanları onayla, reddet, askıya al veya sil.
          </p>
        </div>

        <button type="button" onClick={load} style={s.refreshBtn}>
          {loading ? "Yükleniyor..." : "Yenile"}
        </button>
      </div>

      {errorMessage && <div style={s.errorBox}>{errorMessage}</div>}

      {loading && <p style={s.muted}>İlanlar yükleniyor...</p>}

      {!loading && products.length === 0 && (
        <div style={s.empty}>İlan bulunamadı.</div>
      )}

      <div style={s.grid}>
        {products.map((product) => {
          const productImage = product.imageUrl || product.imageBase64 || "";

          return (
            <article key={product.id} style={s.card}>
              <div style={s.imageBox}>
                {productImage ? (
                  <img
                    src={productImage}
                    alt={product.title || "İlan"}
                    style={s.image}
                  />
                ) : (
                  "GAMECENTRAL"
                )}
              </div>

              <span style={statusBadge(product.status)}>
                {statusLabel(product.status)}
              </span>

              <h3 style={s.cardTitle}>{product.title || "Başlıksız ilan"}</h3>

              <div style={s.infoBox}>
                <span>Kategori</span>
                <strong>{product.category || "Yok"}</strong>
              </div>

              <div style={s.infoBox}>
                <span>Satıcı</span>
                <strong>{product.seller || product.sellerId || "Yok"}</strong>
              </div>

              <strong style={s.price}>{money(product.price)}</strong>

              <div style={s.actions}>
                <button
                  type="button"
                  onClick={() => changeStatus(product, "active")}
                  style={s.approveBtn}
                >
                  Onayla
                </button>

                <button
                  type="button"
                  onClick={() => changeStatus(product, "rejected")}
                  style={s.rejectBtn}
                >
                  Reddet
                </button>

                <button
                  type="button"
                  onClick={() => changeStatus(product, "pending")}
                  style={s.pendingBtn}
                >
                  Askıya Al
                </button>

                <button
                  type="button"
                  onClick={() => remove(product)}
                  style={s.deleteBtn}
                >
                  Sil
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function mapProduct(id: string, data: any): Product {
  return {
    id,
    title: data.title || data["başlık"] || data["baslik"],
    price: Number(data.price ?? data["fiyat"] ?? 0),
    category: data.category || data["kategori"],
    status: data.status || data["durum"],
    seller: data.seller || data["satıcı"] || data["satici"],
    sellerId:
      data.sellerId ||
      data["satıcı kimliği"] ||
      data["satici kimligi"] ||
      data.sellerUid,
    imageUrl: data.imageUrl || data["görsel"] || data["gorsel"],
    imageBase64: data.imageBase64 || "",
    description: data.description || data["açıklama"] || data["aciklama"],
    createdAt: data.createdAt || data["oluşturulma tarihi"],
    updatedAt: data.updatedAt || data["güncellendi"],
  };
}

function statusLabel(status?: string) {
  if (status === "active" || status === "aktif") return "Aktif";
  if (status === "pending" || status === "beklemede") return "Onay Bekliyor";
  if (status === "rejected" || status === "reddedildi") return "Reddedildi";
  if (status === "sold") return "Satıldı";
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

  if (status === "active" || status === "aktif") {
    return {
      ...base,
      background: "rgba(34,197,94,0.12)",
      color: "#22c55e",
    };
  }

  if (status === "rejected" || status === "reddedildi") {
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

  const imageBox: React.CSSProperties = {
    height: isMobile ? 190 : 210,
    background:
      "radial-gradient(circle, rgba(255,212,0,0.14), transparent 60%), #090b11",
    borderRadius: 14,
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
    color: "#ffd400",
    fontWeight: 900,
  };

  const image: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
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

  const price: React.CSSProperties = {
    color: "#ffd400",
    fontSize: isMobile ? 24 : 28,
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
    imageBox,
    image,
    cardTitle,
    infoBox,
    price,
    actions,
    approveBtn,
    rejectBtn,
    pendingBtn,
    deleteBtn,
  };
}