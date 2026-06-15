"use client";

import Link from "next/link";
import React from "react";

type Product = {
  id: string;
  title?: string;
  price?: number;
  category?: string;
  seller?: string;
  sellerId?: string;
  imageUrl?: string;
  imageBase64?: string;
  description?: string;
};

type Props = {
  product: Product | null;
  open: boolean;
  onClose: () => void;
};

export default function ListingModal({ product, open, onClose }: Props) {
  if (!open || !product) return null;

  const productImage = product.imageUrl || product.imageBase64 || "";

  return (
    <div style={overlay} onClick={onClose}>
      <section style={modal} onClick={(e) => e.stopPropagation()}>
        <button type="button" style={closeBtn} onClick={onClose}>
          ✕
        </button>

        <div style={content}>
          <div style={left}>
            {productImage ? (
              <img
                src={productImage}
                alt={product.title || "İlan görseli"}
                style={image}
              />
            ) : (
              <div style={placeholder}>
                <strong>GAMECENTRAL</strong>
                <span>ÜRÜN GÖRSELİ</span>
              </div>
            )}
          </div>

          <div style={right}>
            <span style={category}>{product.category || "Kategori Yok"}</span>

            <h2 style={title}>{product.title || "Başlıksız İlan"}</h2>

            <div style={price}>₺{product.price || 0}</div>

            <div style={sellerCard}>
              <div style={sellerAvatar}>
                {(product.seller || "S").charAt(0).toUpperCase()}
              </div>

              <div>
                <strong style={sellerName}>
                  {product.seller || "Bilinmeyen Satıcı"}
                </strong>
                <p style={sellerMeta}>
                  {product.sellerId
                    ? "🟢 Satıcı bilgisi kayıtlı"
                    : "⚠️ Satıcı ID eksik"}
                </p>
              </div>
            </div>

            <div style={descriptionBox}>
              <strong>Açıklama</strong>
              <p>
                {product.description ||
                  "Bu ilan için açıklama girilmemiş."}
              </p>
            </div>

            <div style={betaBox}>
              <strong>Beta Güvenli İşlem</strong>
              <span>
                Bu modal önizleme alanıdır. Satın alma ve mesajlaşma işlemleri
                detay sayfasında başlatılır.
              </span>
            </div>

            <div style={actions}>
              <Link href={`/listing/${product.id}`} style={buyBtn}>
                🛒 SATIN AL / İŞLEM BAŞLAT
              </Link>

              <Link href={`/listing/${product.id}`} style={messageBtn}>
                💬 SATICIYA MESAJ GÖNDER
              </Link>

              <Link
                href={`/report?type=product&id=${product.id}`}
                style={reportBtn}
              >
                ⚠️ RAPOR ET
              </Link>

              <Link href={`/listing/${product.id}`} style={detailBtn}>
                DETAY VE İŞLEM SAYFASI
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.78)",
  backdropFilter: "blur(8px)",
  display: "grid",
  placeItems: "center",
  zIndex: 99999,
};

const modal: React.CSSProperties = {
  width: "min(1180px, 94vw)",
  maxHeight: "92vh",
  overflow: "hidden",
  borderRadius: 26,
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.1)",
  position: "relative",
  boxShadow: "0 40px 120px rgba(0,0,0,0.65)",
};

const closeBtn: React.CSSProperties = {
  position: "absolute",
  right: 18,
  top: 18,
  width: 42,
  height: 42,
  borderRadius: "50%",
  border: "none",
  background: "rgba(15,23,42,0.9)",
  color: "white",
  cursor: "pointer",
  zIndex: 5,
  fontWeight: 900,
};

const content: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "55% 45%",
  minHeight: 650,
};

const left: React.CSSProperties = {
  background:
    "radial-gradient(circle at center, rgba(255,212,0,0.14), transparent 55%), #05060f",
  minHeight: 650,
  overflow: "hidden",
};

const image: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const placeholder: React.CSSProperties = {
  height: "100%",
  minHeight: 650,
  display: "grid",
  placeItems: "center",
  alignContent: "center",
  gap: 14,
  color: "#ffd400",
  fontWeight: 900,
  letterSpacing: 1,
};

const right: React.CSSProperties = {
  padding: 36,
  color: "white",
  overflowY: "auto",
};

const category: React.CSSProperties = {
  color: "#38bdf8",
  fontWeight: 900,
  fontSize: 14,
  textTransform: "uppercase",
};

const title: React.CSSProperties = {
  fontSize: 38,
  margin: "16px 0 0",
  lineHeight: 1,
};

const price: React.CSSProperties = {
  color: "#ffd400",
  fontSize: 48,
  fontWeight: 900,
  marginTop: 20,
};

const sellerCard: React.CSSProperties = {
  marginTop: 22,
  padding: 16,
  borderRadius: 18,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  alignItems: "center",
  gap: 14,
};

const sellerAvatar: React.CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: "50%",
  background: "#ffd400",
  color: "#05060f",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  fontSize: 22,
};

const sellerName: React.CSSProperties = {
  color: "white",
};

const sellerMeta: React.CSSProperties = {
  margin: "5px 0 0",
  color: "#94a3b8",
  fontWeight: 700,
};

const descriptionBox: React.CSSProperties = {
  marginTop: 20,
  padding: 16,
  borderRadius: 18,
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "#cbd5e1",
  lineHeight: 1.6,
};

const betaBox: React.CSSProperties = {
  marginTop: 20,
  padding: 16,
  borderRadius: 18,
  background: "rgba(255,212,0,0.09)",
  border: "1px solid rgba(255,212,0,0.18)",
  color: "#ffd400",
  display: "grid",
  gap: 6,
  fontWeight: 800,
};

const actions: React.CSSProperties = {
  marginTop: 24,
  display: "grid",
  gap: 12,
};

const baseAction: React.CSSProperties = {
  minHeight: 56,
  borderRadius: 14,
  display: "grid",
  placeItems: "center",
  textDecoration: "none",
  fontWeight: 900,
};

const buyBtn: React.CSSProperties = {
  ...baseAction,
  background: "#ffd400",
  color: "#05060f",
};

const messageBtn: React.CSSProperties = {
  ...baseAction,
  background: "#22c55e",
  color: "white",
};

const reportBtn: React.CSSProperties = {
  ...baseAction,
  background: "#ef4444",
  color: "white",
};

const detailBtn: React.CSSProperties = {
  ...baseAction,
  background: "#1e293b",
  color: "white",
};