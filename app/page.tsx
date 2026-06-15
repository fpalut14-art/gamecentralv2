"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import ListingModal from "@/components/ListingModal";
import "./home.css";

type Product = {
  id: string;
  title?: string;
  price?: number;
  category?: string;
  status?: string;
  seller?: string;
  sellerId?: string;
  imageUrl?: string;
  imageBase64?: string;
  description?: string;
};

type AdItem = {
  id: string;
  brand?: string;
  title?: string;
  slot?: "premium" | "right-banner" | "partner-slot";
  link?: string;
  status?: string;
};

const categories = [
  "TÜMÜ",
  "SİSTEMLER",
  "OYUN DÜNYASI",
  "EKİPMANLAR",
  "YAŞAM ALANI",
  "DİJİTAL VARLIKLAR",
  "OYUN MARKETİ",
  "DONANIMLAR",
  "PC KASA",
  "FARE",
  "KLAVYE",
  "KULAKLIK",
  "OYUNCU MOBİLYALARI",
  "KOLTUKLAR",
  "MONSTER SERİSİ",
  "METİN2 MARKET",
  "VALORANT VP",
];

const ecosystems = [
  { icon: "🖥️", title: "Sistemler", value: "SİSTEMLER" },
  { icon: "🎮", title: "Oyun Dünyası", value: "OYUN DÜNYASI" },
  { icon: "⌨️", title: "Ekipmanlar", value: "EKİPMANLAR" },
  { icon: "🪑", title: "Yaşam Alanı", value: "YAŞAM ALANI" },
  { icon: "💎", title: "Dijital Varlıklar", value: "DİJİTAL VARLIKLAR" },
  { icon: "🏪", title: "Oyun Marketi", value: "OYUN MARKETİ" },
];

function withTimeout<T>(promise: Promise<T>, ms = 12000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () => reject(new Error("Firebase sorgusu zaman aşımına uğradı.")),
        ms
      )
    ),
  ]);
}

export default function HomePage() {
  return (
    <Suspense fallback={<main className="gc-page">Yükleniyor...</main>}>
      <HomePageContent />
    </Suspense>
  );
}

function HomePageContent() {
  const searchParams = useSearchParams();
  const urlQuery = searchParams.get("q") || "";

  const [products, setProducts] = useState<Product[]>([]);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("TÜMÜ");
  const [search, setSearch] = useState(urlQuery);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  async function loadHomeData() {
    try {
      setLoading(true);
      setErrorMessage("");

      const productQuery = query(
        collection(db, "products"),
        where("status", "==", "active"),
        limit(24)
      );

      const adsQuery = query(
        collection(db, "ads"),
        where("status", "==", "active"),
        limit(24)
      );

      const [productSnap, adsSnap] = await withTimeout(
        Promise.all([getDocs(productQuery), getDocs(adsQuery)]),
        12000
      );

      const productData = productSnap.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<Product, "id">),
      }));

      const adsData = adsSnap.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<AdItem, "id">),
      }));

      setProducts(productData);
      setAds(adsData);
    } catch (error) {
      console.error("Ana sayfa veri çekme hatası:", error);
      setProducts([]);
      setAds([]);
      setErrorMessage(
        "İlanlar yüklenemedi. Firebase bağlantısı, Firestore izinleri veya mobil bağlantı kontrol edilmeli."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadHomeData();
  }, []);

  useEffect(() => {
    setSearch(urlQuery);
  }, [urlQuery]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const q = search.toLowerCase().trim();

      const productCategory = String(product.category || "").toLowerCase();
      const productTitle = String(product.title || "").toLowerCase();
      const productSeller = String(product.seller || "").toLowerCase();

      const categoryMatch =
        selectedCategory === "TÜMÜ" ||
        productCategory === selectedCategory.toLowerCase();

      const searchMatch =
        q === "" ||
        productTitle.includes(q) ||
        productCategory.includes(q) ||
        productSeller.includes(q);

      return categoryMatch && searchMatch;
    });
  }, [products, selectedCategory, search]);

  const premiumAd = ads.find((ad) => ad.slot === "premium");
  const rightAds = ads.filter((ad) => ad.slot === "right-banner").slice(0, 3);
  const partnerAds = ads.filter((ad) => ad.slot === "partner-slot");

  return (
    <main className="gc-page">
      <div className="gc-layout">
        <aside className="gc-sidebar">
          <Link href="/create" className="gc-create-btn">
            + YENİ İLAN VER
          </Link>

          <div className="gc-sidebar-box">
            <Link href="/" className="gc-menu active">
              ANA SAYFA
            </Link>

            <small>EKOSİSTEMLER</small>

            {categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={
                  selectedCategory === category
                    ? "gc-category selected"
                    : "gc-category"
                }
              >
                {category}
              </button>
            ))}
          </div>
        </aside>

        <section className="gc-content">
          <section className="gc-mobile-ecosystems">
            <div
  style={{
    background: "red",
    color: "white",
    padding: "20px",
    fontSize: "30px",
    fontWeight: "bold",
  }}
>
  MOBİL TEST KUTUSU
</div>
            <div className="gc-mobile-section-label">EKOSİSTEMLER</div>

            <div className="gc-mobile-ecosystem-grid">
              {ecosystems.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSelectedCategory(item.value)}
                  className={
                    selectedCategory === item.value
                      ? "gc-mobile-ecosystem-card selected"
                      : "gc-mobile-ecosystem-card"
                  }
                >
                  <span>{item.icon}</span>
                  <strong>{item.title}</strong>
                </button>
              ))}
            </div>
          </section>

          <section className="gc-hero-area">
            <Link href={premiumAd?.link || "/ad-request"} className="gc-hero">
              <div className="gc-hero-overlay">
                <span className="gc-badge">PREMIUM SLOT</span>

                <h1>{premiumAd?.title || "PREMİUM REKLAM ALANI"}</h1>

                <p>
                  {premiumAd?.brand
                    ? `${premiumAd.brand} sponsorlu reklam alanı.`
                    : "Markanı GameCentral vitrininde göster."}
                </p>

                <span className="gc-hero-btn">
                  {premiumAd ? "REKLAMI GÖR" : "REKLAM BAŞVURUSU YAP"}
                </span>
              </div>
            </Link>

            <div className="gc-right-banners">
              {[0, 1, 2].map((i) => {
                const ad = rightAds[i];

                return (
                  <Link
                    key={i}
                    href={ad?.link || "/ad-request"}
                    className="gc-right-ad"
                  >
                    <strong>{ad?.title || "+ REKLAM VER"}</strong>
                    <span>{ad?.brand || "Sağ Banner Slot"}</span>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="gc-products">
            <div className="gc-section-head">
              <div>
                <div className="gc-section-title">AKTİF İLANLAR</div>

                {search && (
                  <p style={{ color: "#94a3b8", marginTop: 8 }}>
                    Arama sonucu:{" "}
                    <b style={{ color: "#ffd400" }}>{search}</b>{" "}
                    <Link
                      href="/"
                      style={{
                        marginLeft: 12,
                        color: "#ffd400",
                        fontWeight: 900,
                        textDecoration: "none",
                      }}
                    >
                      Temizle
                    </Link>
                  </p>
                )}
              </div>

              <button type="button" onClick={loadHomeData} className="gc-refresh">
                ↻ YENİLE
              </button>
            </div>

            {loading && <div className="gc-empty">İlanlar yükleniyor...</div>}

            {!loading && errorMessage && (
              <div className="gc-empty">{errorMessage}</div>
            )}

            {!loading && !errorMessage && filteredProducts.length === 0 && (
              <div className="gc-empty">Aktif ilan bulunamadı.</div>
            )}

            {!loading && !errorMessage && filteredProducts.length > 0 && (
              <div className="gc-product-grid">
                {filteredProducts.map((product) => {
                  const productImage =
                    product.imageUrl || product.imageBase64 || "";

                  return (
                    <article className="gc-card" key={product.id}>
                      <div className="gc-card-image">
                        {productImage ? (
                          <img src={productImage} alt={product.title || "İlan"} />
                        ) : (
                          <span>GAMECENTRAL</span>
                        )}
                      </div>

                      <div className="gc-card-body">
                        <span className="gc-card-category">
                          {product.category || "Kategori Yok"}
                        </span>

                        <h3>{product.title || "Başlıksız İlan"}</h3>

                        <p className="gc-seller">
                          Satıcı: {product.seller || "Doğrulanmamış Satıcı"}
                        </p>

                        <div className="gc-price">₺{product.price || 0}</div>

                        <button
                          type="button"
                          className="gc-card-btn"
                          onClick={() => {
                            setSelectedProduct(product);
                            setModalOpen(true);
                          }}
                        >
                          İNCELE
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          <section className="gc-partners">
            <div className="gc-section-title">PARTNER SLOTLARI</div>

            <div className="gc-slot-grid">
              {Array.from({ length: 18 }).map((_, i) => {
                const ad = partnerAds[i];

                return (
                  <Link
                    href={ad?.link || "/ad-request"}
                    className="gc-slot"
                    key={i}
                  >
                    <strong>{ad?.title || "+"}</strong>
                    <span>{ad?.brand || "REKLAM VER"}</span>
                    <small>SLOT #{String(i + 1).padStart(2, "0")}</small>
                  </Link>
                );
              })}
            </div>
          </section>
        </section>
      </div>

      <ListingModal
        product={selectedProduct}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </main>
  );
}