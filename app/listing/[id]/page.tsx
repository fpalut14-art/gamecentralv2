"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { createNotification } from "@/lib/notifications";
import { createLog } from "@/lib/logs";
import { money, now } from "@/lib/format";
import type { Product } from "@/types";

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
    imageBase64: data.imageBase64 || data["imageBase64"],
    description: data.description || data["açıklama"] || data["aciklama"],
    createdAt: data.createdAt || data["oluşturulma tarihi"],
    updatedAt: data.updatedAt || data["güncellendi"],
  };
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");

  const [product, setProduct] = useState<Product | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [chatting, setChatting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth <= 900);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setCurrentUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    async function loadProduct() {
      if (!id) return;

      try {
        const snap = await getDoc(doc(db, "products", id));

        if (snap.exists()) {
          setProduct(mapProduct(snap.id, snap.data()));
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("İlan detayı çekilemedi:", error);
        setMessage("İlan detayı yüklenemedi. Lütfen tekrar dene.");
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [id]);

  async function findExistingChat() {
    if (!currentUser || !product?.sellerId) return null;

    const q = query(
      collection(db, "chats"),
      where("buyerId", "==", currentUser.uid),
      where("sellerId", "==", product.sellerId),
      where("productId", "==", id)
    );

    const snap = await getDocs(q);

    if (!snap.empty) {
      return snap.docs[0].id;
    }

    return null;
  }

  async function createChat(orderId = "") {
    if (!currentUser || !product?.sellerId) return null;

    const chatRef = await addDoc(collection(db, "chats"), {
      buyerId: currentUser.uid,
      buyerEmail: currentUser.email || "",
      sellerId: product.sellerId,
      sellerEmail: product.seller || "",
      participants: [currentUser.uid, product.sellerId],
      productId: id,
      productTitle: product.title || "Başlıksız ilan",
      orderId,
      lastMessage: orderId
        ? "Sipariş talebi oluşturuldu."
        : "Ürün hakkında sohbet başlatıldı.",
      createdAt: now(),
      updatedAt: now(),
    });

    await addDoc(collection(db, "messages"), {
      chatId: chatRef.id,
      senderId: currentUser.uid,
      senderEmail: currentUser.email || "",
      text: orderId
        ? "Sipariş talebi oluşturuldu. Alıcı ve satıcı bu sohbet üzerinden iletişim kurabilir."
        : "Merhaba, ürün hakkında bilgi almak istiyorum.",
      system: Boolean(orderId),
      createdAt: now(),
    });

    return chatRef.id;
  }

  async function getOrCreateChat(orderId = "") {
    const existingChatId = await findExistingChat();

    if (existingChatId) {
      if (orderId) {
        await updateDoc(doc(db, "orders", orderId), {
          chatId: existingChatId,
          updatedAt: now(),
        });
      }

      return existingChatId;
    }

    const newChatId = await createChat(orderId);

    if (orderId && newChatId) {
      await updateDoc(doc(db, "orders", orderId), {
        chatId: newChatId,
        updatedAt: now(),
      });
    }

    return newChatId;
  }

  function validateAction(action: "buy" | "chat") {
    setMessage("");

    if (!currentUser) {
      setMessage(
        action === "buy"
          ? "Satın almak için giriş yapmalısın."
          : "Mesaj göndermek için giriş yapmalısın."
      );

      setTimeout(() => router.push("/login"), 700);
      return false;
    }

    if (!product) {
      setMessage("Ürün bilgisi yüklenemedi.");
      return false;
    }

    if (!product.sellerId) {
      setMessage("Bu ilanda satıcı bilgisi eksik. Lütfen destek ile iletişime geç.");
      return false;
    }

    if (product.sellerId === currentUser.uid) {
      setMessage(
        action === "buy"
          ? "Kendi ilanını satın alamazsın."
          : "Kendi ilanın için sohbet başlatamazsın."
      );
      return false;
    }

    return true;
  }

  async function startChatOnly() {
    if (!validateAction("chat")) return;

    try {
      setChatting(true);

      const chatId = await getOrCreateChat("");

      if (!chatId) {
        setMessage("Sohbet oluşturulamadı.");
        return;
      }

      await createNotification({
        userId: product!.sellerId!,
        title: "Yeni mesaj",
        message: `${product!.title || "İlan"} için yeni mesaj geldi.`,
        type: "chat",
      });

      await createLog({
        event: "chat_started",
        detail: `${product!.title || id} için sohbet başlatıldı.`,
        userId: currentUser!.uid,
      });

      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error("Sohbet başlatma hatası:", error);
      setMessage("Sohbet başlatılamadı. Lütfen tekrar dene.");
    } finally {
      setChatting(false);
    }
  }

  async function createOrder() {
    if (!validateAction("buy")) return;

    try {
      setBuying(true);

      const orderRef = await addDoc(collection(db, "orders"), {
        productId: id,
        productTitle: product!.title || "Başlıksız ilan",
        amount: Number(product!.price || 0),
        buyerId: currentUser!.uid,
        buyerEmail: currentUser!.email || "",
        sellerId: product!.sellerId,
        sellerEmail: product!.seller || "",
        status: "pending_seller",
        createdAt: now(),
      });

      const chatId = await getOrCreateChat(orderRef.id);

      await createNotification({
        userId: product!.sellerId!,
        title: "Yeni sipariş talebi",
        message: `${product!.title || "İlan"} için yeni sipariş talebi geldi.`,
        type: "order",
      });

      await createLog({
        event: "order_request_created",
        detail: `${product!.title || id} için beta sipariş talebi oluşturuldu.`,
        userId: currentUser!.uid,
      });

      setMessage("Sipariş talebi oluşturuldu. Sohbete yönlendiriliyorsun.");

      setTimeout(() => {
        router.push(chatId ? `/chat/${chatId}` : "/messages");
      }, 700);
    } catch (error) {
      console.error("Sipariş oluşturma hatası:", error);
      setMessage("Sipariş oluşturulamadı. Lütfen tekrar dene.");
    } finally {
      setBuying(false);
    }
  }

  const s = getStyles(isMobile);

  if (loading) {
    return <main style={s.page}>İlan yükleniyor...</main>;
  }

  if (!product) {
    return (
      <main style={s.page}>
        <section style={s.card}>
          <h1>İlan bulunamadı</h1>
          <Link href="/" style={s.backBtn}>
            Ana sayfaya dön
          </Link>
        </section>
      </main>
    );
  }

  const productImage = product.imageUrl || product.imageBase64 || "";

  return (
    <main style={s.page}>
      <section style={s.card}>
        <Link href="/" style={s.backBtn}>
          ← Ana sayfaya dön
        </Link>

        {message && <div style={s.messageBox}>{message}</div>}

        <div style={s.layout}>
          <div style={s.imageBox}>
            {productImage ? (
              <img src={productImage} alt={product.title || "İlan"} style={s.detailImage} />
            ) : (
              <div style={s.placeholder}>GAMECENTRAL</div>
            )}
          </div>

          <div style={s.info}>
            <span style={s.category}>{product.category || "Kategori yok"}</span>

            <h1 style={s.title}>{product.title || "Başlıksız ilan"}</h1>

            <div style={s.price}>{money(product.price)}</div>

            {product.description && (
              <div style={s.descriptionBox}>
                <strong>Açıklama</strong>
                <p>{product.description}</p>
              </div>
            )}

            <div style={s.sellerBox}>
              <strong>Satıcı Bilgisi</strong>
              <span>{product.seller || "Bilinmiyor"}</span>
              <small>{product.sellerId ? "Satıcı bilgisi kayıtlı" : "Satıcı bilgisi eksik"}</small>
            </div>

            <p style={s.status}>Beta işlem: ödeme yok, sipariş talebi + sohbet.</p>

            <div style={s.actions}>
              <button type="button" onClick={createOrder} style={s.buyBtn} disabled={buying}>
                {buying ? "Sipariş oluşturuluyor..." : "Satın Al"}
              </button>

              <button
                type="button"
                onClick={startChatOnly}
                style={s.messageBtn}
                disabled={chatting}
              >
                {chatting ? "Sohbet açılıyor..." : "Satıcıya Mesaj Gönder"}
              </button>

              <Link href={`/report?type=product&id=${id}`} style={s.reportBtn}>
                Bu ilanı rapor et
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function getStyles(isMobile: boolean) {
  const page: React.CSSProperties = {
    minHeight: "100vh",
    background: "#05060f",
    color: "white",
    padding: isMobile ? "14px 12px 92px" : 40,
  };

  const card: React.CSSProperties = {
    maxWidth: 1150,
    margin: "0 auto",
    padding: isMobile ? 18 : 30,
    borderRadius: isMobile ? 20 : 24,
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
  };

  const layout: React.CSSProperties = {
    marginTop: 24,
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "55% 45%",
    gap: isMobile ? 18 : 24,
  };

  const imageBox: React.CSSProperties = {
    height: isMobile ? 260 : 520,
    borderRadius: isMobile ? 18 : 22,
    overflow: "hidden",
    background:
      "radial-gradient(circle, rgba(255,212,0,0.16), transparent 60%), #090b11",
    display: "grid",
    placeItems: "center",
    color: "rgba(255,212,0,0.5)",
    fontWeight: 900,
    fontSize: isMobile ? 20 : 28,
  };

  const detailImage: React.CSSProperties = {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  };

  const placeholder: React.CSSProperties = {
    color: "#ffd400",
    fontWeight: 900,
  };

  const info: React.CSSProperties = {
    display: "grid",
    alignContent: "start",
  };

  const backBtn: React.CSSProperties = {
    color: "#ffd400",
    textDecoration: "none",
    fontWeight: 900,
    display: "inline-block",
    marginBottom: 12,
  };

  const category: React.CSSProperties = {
    display: "inline-block",
    color: "#22c55e",
    fontWeight: 900,
  };

  const title: React.CSSProperties = {
    marginTop: 12,
    marginBottom: 0,
    fontSize: isMobile ? 30 : 42,
    lineHeight: 1.08,
    wordBreak: "break-word",
  };

  const price: React.CSSProperties = {
    marginTop: 20,
    color: "#ffd400",
    fontSize: isMobile ? 34 : 44,
    fontWeight: 900,
  };

  const descriptionBox: React.CSSProperties = {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    background: "rgba(255,255,255,0.035)",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "#cbd5e1",
    lineHeight: 1.7,
  };

  const sellerBox: React.CSSProperties = {
    marginTop: 20,
    padding: 16,
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "grid",
    gap: 6,
    overflowWrap: "anywhere",
  };

  const status: React.CSSProperties = {
    color: "#38bdf8",
    marginTop: 18,
    lineHeight: 1.5,
  };

  const actions: React.CSSProperties = {
    marginTop: 26,
    display: "grid",
    gap: 12,
  };

  const buyBtn: React.CSSProperties = {
    width: "100%",
    height: 56,
    borderRadius: 14,
    border: "none",
    background: "#ffd400",
    color: "#05060f",
    fontWeight: 900,
    cursor: "pointer",
  };

  const messageBtn: React.CSSProperties = {
    width: "100%",
    height: 56,
    borderRadius: 14,
    border: "none",
    background: "#22c55e",
    color: "white",
    fontWeight: 900,
    cursor: "pointer",
  };

  const reportBtn: React.CSSProperties = {
    width: "100%",
    minHeight: 56,
    borderRadius: 14,
    background: "rgba(239,68,68,0.1)",
    color: "#ef4444",
    border: "1px solid rgba(239,68,68,0.35)",
    textDecoration: "none",
    display: "grid",
    placeItems: "center",
    fontWeight: 900,
    textAlign: "center",
  };

  const messageBox: React.CSSProperties = {
    margin: "10px 0 18px",
    padding: 14,
    borderRadius: 14,
    color: "#ffd400",
    background: "rgba(255,212,0,0.08)",
    border: "1px solid rgba(255,212,0,0.25)",
    fontWeight: 800,
    lineHeight: 1.4,
  };

  return {
    page,
    card,
    layout,
    imageBox,
    detailImage,
    placeholder,
    info,
    backBtn,
    category,
    title,
    price,
    descriptionBox,
    sellerBox,
    status,
    actions,
    buyBtn,
    messageBtn,
    reportBtn,
    messageBox,
  };
}