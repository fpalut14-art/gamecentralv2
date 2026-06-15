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

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [chatting, setChatting] = useState(false);

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
          setProduct({
            id: snap.id,
            ...(snap.data() as Omit<Product, "id">),
          });
        } else {
          setProduct(null);
        }
      } catch (error) {
        console.error("İlan detayı çekilemedi:", error);
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
    if (!currentUser) {
      alert(
        action === "buy"
          ? "Satın almak için giriş yapmalısın."
          : "Mesaj göndermek için giriş yapmalısın."
      );
      router.push("/login");
      return false;
    }

    if (!product) {
      alert("Ürün bilgisi yüklenemedi.");
      return false;
    }

    if (!product.sellerId) {
      alert(
        "Bu ilanda sellerId eksik. Firestore products kaydına sellerId eklenmeli."
      );
      console.log("SELLER ID EKSİK PRODUCT:", product);
      return false;
    }

    if (product.sellerId === currentUser.uid) {
      alert(
        action === "buy"
          ? "Kendi ilanını satın alamazsın."
          : "Kendi ilanın için sohbet başlatamazsın."
      );
      return false;
    }

    return true;
  }

  async function startChatOnly() {
    console.log("START CHAT TIKLANDI", {
      currentUser: currentUser?.uid,
      productId: id,
      sellerId: product?.sellerId,
      product,
    });

    if (!validateAction("chat")) return;

    try {
      setChatting(true);

      const chatId = await getOrCreateChat("");

      if (!chatId) {
        alert("Sohbet oluşturulamadı.");
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
      alert("Sohbet başlatılamadı. Console hatasına bak.");
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

      alert("Sipariş talebi oluşturuldu. Sohbete yönlendiriliyorsun.");
      router.push(chatId ? `/chat/${chatId}` : "/messages");
    } catch (error) {
      console.error("Sipariş oluşturma hatası:", error);
      alert("Sipariş oluşturulamadı.");
    } finally {
      setBuying(false);
    }
  }

  if (loading) {
    return <main style={page}>İlan yükleniyor...</main>;
  }

  if (!product) {
    return (
      <main style={page}>
        <h1>İlan bulunamadı</h1>
        <Link href="/" style={backBtn}>
          Ana sayfaya dön
        </Link>
      </main>
    );
  }

  const productImage = product.imageUrl || product.imageBase64 || "";

  return (
    <main style={page}>
      <section style={card}>
        <Link href="/" style={backBtn}>
          ← Ana sayfaya dön
        </Link>

        <div style={layout}>
          <div style={imageBox}>
            {productImage ? (
              <img
                src={productImage}
                alt={product.title || "İlan"}
                style={detailImage}
              />
            ) : (
              <div style={placeholder}>GAMECENTRAL</div>
            )}
          </div>

          <div style={info}>
            <span style={category}>{product.category || "Kategori yok"}</span>

            <h1 style={title}>{product.title || "Başlıksız ilan"}</h1>

            <div style={price}>{money(product.price)}</div>

            {product.description && (
              <div style={descriptionBox}>
                <strong>Açıklama</strong>
                <p>{product.description}</p>
              </div>
            )}

            <div style={sellerBox}>
              <strong>Satıcı Bilgisi</strong>
              <span>{product.seller || "Bilinmiyor"}</span>
              <small>
                {product.sellerId ? "sellerId kayıtlı" : "sellerId eksik"}
              </small>
            </div>

            <p style={status}>
              Beta işlem: ödeme yok, sipariş talebi + sohbet.
            </p>

            <div style={actions}>
              <button onClick={createOrder} style={buyBtn} disabled={buying}>
                {buying ? "Sipariş oluşturuluyor..." : "Satın Al"}
              </button>

              <button
                type="button"
                onClick={startChatOnly}
                style={messageBtn}
                disabled={chatting}
              >
                {chatting ? "Sohbet açılıyor..." : "Satıcıya Mesaj Gönder"}
              </button>

              <Link href={`/report?type=product&id=${id}`} style={reportBtn}>
                Bu ilanı rapor et
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05060f",
  color: "white",
  padding: 40,
};

const card: React.CSSProperties = {
  maxWidth: 1150,
  margin: "0 auto",
  padding: 30,
  borderRadius: 24,
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.08)",
};

const layout: React.CSSProperties = {
  marginTop: 24,
  display: "grid",
  gridTemplateColumns: "55% 45%",
  gap: 24,
};

const imageBox: React.CSSProperties = {
  height: 520,
  borderRadius: 22,
  overflow: "hidden",
  background:
    "radial-gradient(circle, rgba(255,212,0,0.16), transparent 60%), #090b11",
  display: "grid",
  placeItems: "center",
  color: "rgba(255,212,0,0.5)",
  fontWeight: 900,
  fontSize: 28,
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
};

const category: React.CSSProperties = {
  display: "inline-block",
  color: "#22c55e",
  fontWeight: 900,
};

const title: React.CSSProperties = {
  marginTop: 12,
  fontSize: 42,
};

const price: React.CSSProperties = {
  marginTop: 20,
  color: "#ffd400",
  fontSize: 44,
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
};

const status: React.CSSProperties = {
  color: "#38bdf8",
  marginTop: 18,
};

const actions: React.CSSProperties = {
  marginTop: 26,
  display: "grid",
  gap: 12,
};

const buyBtn: React.CSSProperties = {
  height: 56,
  borderRadius: 14,
  border: "none",
  background: "#ffd400",
  color: "#05060f",
  fontWeight: 900,
  cursor: "pointer",
};

const messageBtn: React.CSSProperties = {
  height: 56,
  borderRadius: 14,
  border: "none",
  background: "#22c55e",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const reportBtn: React.CSSProperties = {
  height: 56,
  borderRadius: 14,
  background: "rgba(239,68,68,0.1)",
  color: "#ef4444",
  border: "1px solid rgba(239,68,68,0.35)",
  textDecoration: "none",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
};