"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type ChatItem = {
  id: string;
  buyerId?: string;
  buyerEmail?: string;
  sellerId?: string;
  sellerEmail?: string;
  productId?: string;
  productTitle?: string;
  orderId?: string;
  lastMessage?: string;
  createdAt?: string;
  updatedAt?: string;
};

export default function MessagesPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadChats(uid: string) {
    try {
      setLoading(true);

      const buyerQuery = query(
        collection(db, "chats"),
        where("buyerId", "==", uid)
      );

      const sellerQuery = query(
        collection(db, "chats"),
        where("sellerId", "==", uid)
      );

      const [buyerSnap, sellerSnap] = await Promise.all([
        getDocs(buyerQuery),
        getDocs(sellerQuery),
      ]);

      const allChats = [
        ...buyerSnap.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<ChatItem, "id">),
        })),
        ...sellerSnap.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<ChatItem, "id">),
        })),
      ];

      const unique = Array.from(
        new Map(allChats.map((item) => [item.id, item])).values()
      ).sort((a, b) =>
        String(b.updatedAt || b.createdAt || "").localeCompare(
          String(a.updatedAt || a.createdAt || "")
        )
      );

      setChats(unique);

      if (unique.length > 0) {
        setSelectedChatId(unique[0].id);
      }
    } catch (error) {
      console.error("Sohbetler çekilemedi:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUser(user);
      await loadChats(user.uid);
    });

    return () => unsub();
  }, [router]);

  const filteredChats = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return chats;

    return chats.filter((chat) => {
      return (
        String(chat.productTitle || "").toLowerCase().includes(q) ||
        String(chat.buyerEmail || "").toLowerCase().includes(q) ||
        String(chat.sellerEmail || "").toLowerCase().includes(q) ||
        String(chat.lastMessage || "").toLowerCase().includes(q)
      );
    });
  }, [chats, search]);

  const selectedChat =
    filteredChats.find((item) => item.id === selectedChatId) ||
    filteredChats[0];

  function getOtherUser(chat: ChatItem) {
    if (!currentUser) return "Kullanıcı";

    if (chat.buyerId === currentUser.uid) {
      return chat.sellerEmail || "Satıcı";
    }

    return chat.buyerEmail || "Alıcı";
  }

  function getRoleLabel(chat: ChatItem) {
    if (!currentUser) return "";

    if (chat.buyerId === currentUser.uid) {
      return "Alıcı olarak konuşuyorsun";
    }

    return "Satıcı olarak konuşuyorsun";
  }

  if (loading) {
    return <main style={page}>Mesajlar yükleniyor...</main>;
  }

  return (
    <main style={page}>
      <section style={shell}>
        <aside style={sidebar}>
          <div style={sideHeader}>
            <div>
              <span style={eyebrow}>GAMECENTRAL</span>
              <h1 style={title}>Mesajlar</h1>
            </div>

            <button
              type="button"
              style={refreshBtn}
              onClick={() => currentUser && loadChats(currentUser.uid)}
            >
              ↻
            </button>
          </div>

          <input
            style={searchInput}
            placeholder="Sohbet, ürün veya kullanıcı ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div style={chatList}>
            {filteredChats.length === 0 && (
              <div style={emptyBox}>
                Henüz sohbet yok.
                <br />
                Bir ilan üzerinden mesaj başlatabilirsin.
              </div>
            )}

            {filteredChats.map((chat, index) => {
              const active = selectedChat?.id === chat.id;

              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => setSelectedChatId(chat.id)}
                  style={active ? chatItemActive : chatItem}
                >
                  <div style={avatar}>
                    {String(getOtherUser(chat)).charAt(0).toUpperCase()}
                  </div>

                  <div style={chatMeta}>
                    <strong style={chatUser}>
                      {index + 1}. {getOtherUser(chat)}
                    </strong>

                    <span style={chatProduct}>
                      {chat.productTitle || "Ürün sohbeti"}
                    </span>

                    <small style={chatLast}>
                      {chat.lastMessage || "Henüz mesaj yok"}
                    </small>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section style={preview}>
          {!selectedChat ? (
            <div style={emptyPreview}>
              <h2>Henüz sohbet seçilmedi</h2>
              <p>Sol taraftan bir sohbet seç.</p>
            </div>
          ) : (
            <>
              <div style={previewTop}>
                <div>
                  <span style={eyebrow}>{getRoleLabel(selectedChat)}</span>
                  <h2 style={previewTitle}>
                    {selectedChat.productTitle || "Ürün Sohbeti"}
                  </h2>
                  <p style={muted}>
                    Karşı taraf: {getOtherUser(selectedChat)}
                  </p>
                </div>

                <Link href={`/chat/${selectedChat.id}`} style={openChatBtn}>
                  Sohbete Git
                </Link>
              </div>

              <div style={infoGrid}>
                <div style={infoCard}>
                  <small>Ürün</small>
                  <strong>{selectedChat.productTitle || "Belirtilmemiş"}</strong>
                </div>

                <div style={infoCard}>
                  <small>Son Mesaj</small>
                  <strong>{selectedChat.lastMessage || "Henüz mesaj yok"}</strong>
                </div>

                <div style={infoCard}>
                  <small>Güncelleme</small>
                  <strong>{selectedChat.updatedAt || selectedChat.createdAt || "-"}</strong>
                </div>

                <div style={infoCard}>
                  <small>Sipariş</small>
                  <strong>{selectedChat.orderId ? "Bağlı" : "Yok"}</strong>
                </div>
              </div>

              <div style={notice}>
                Bu alan hızlı sohbet önizlemesidir. Mesaj yazmak ve geçmişi
                görmek için "Sohbete Git" butonunu kullan.
              </div>

              <div style={actions}>
                {selectedChat.productId && (
                  <Link
                    href={`/listing/${selectedChat.productId}`}
                    style={secondaryBtn}
                  >
                    İlanı Aç
                  </Link>
                )}

                <Link href="/support" style={secondaryBtn}>
                  Destek Al
                </Link>

                <Link
                  href={`/report?type=chat&id=${selectedChat.id}`}
                  style={dangerBtn}
                >
                  Sohbeti Rapor Et
                </Link>
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(255,212,0,0.08), transparent 24%), #05060f",
  color: "white",
  padding: 30,
};

const shell: React.CSSProperties = {
  width: "min(1500px, calc(100% - 20px))",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "390px 1fr",
  gap: 24,
};

const sidebar: React.CSSProperties = {
  borderRadius: 26,
  background: "linear-gradient(180deg, #0f172a, #070a12)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: 22,
  minHeight: 720,
};

const sideHeader: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 14,
  alignItems: "center",
};

const eyebrow: React.CSSProperties = {
  color: "#ffd400",
  fontWeight: 900,
  letterSpacing: 1,
  fontSize: 12,
};

const title: React.CSSProperties = {
  margin: "6px 0 0",
  color: "#ffd400",
  fontSize: 34,
};

const refreshBtn: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 14,
  border: "1px solid rgba(255,212,0,0.25)",
  background: "rgba(255,212,0,0.08)",
  color: "#ffd400",
  fontWeight: 900,
  cursor: "pointer",
};

const searchInput: React.CSSProperties = {
  marginTop: 20,
  width: "100%",
  height: 48,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.08)",
  background: "#05060f",
  color: "white",
  padding: "0 14px",
  outline: "none",
  fontWeight: 800,
};

const chatList: React.CSSProperties = {
  marginTop: 18,
  display: "grid",
  gap: 12,
};

const chatItem: React.CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,0.06)",
  background: "rgba(255,255,255,0.035)",
  color: "white",
  cursor: "pointer",
  display: "flex",
  gap: 12,
  textAlign: "left",
};

const chatItemActive: React.CSSProperties = {
  ...chatItem,
  border: "1px solid rgba(255,212,0,0.32)",
  background: "rgba(255,212,0,0.08)",
};

const avatar: React.CSSProperties = {
  width: 46,
  height: 46,
  borderRadius: "50%",
  background: "#ffd400",
  color: "#05060f",
  display: "grid",
  placeItems: "center",
  fontWeight: 900,
  flex: "0 0 auto",
};

const chatMeta: React.CSSProperties = {
  minWidth: 0,
  display: "grid",
  gap: 4,
};

const chatUser: React.CSSProperties = {
  color: "white",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const chatProduct: React.CSSProperties = {
  color: "#ffd400",
  fontWeight: 800,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const chatLast: React.CSSProperties = {
  color: "#94a3b8",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const emptyBox: React.CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: "rgba(255,255,255,0.035)",
  color: "#94a3b8",
  lineHeight: 1.5,
};

const preview: React.CSSProperties = {
  borderRadius: 26,
  background: "linear-gradient(180deg, #0f172a, #070a12)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: 28,
  minHeight: 720,
};

const previewTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 20,
};

const previewTitle: React.CSSProperties = {
  margin: "8px 0 0",
  color: "#ffd400",
  fontSize: 38,
};

const muted: React.CSSProperties = {
  color: "#94a3b8",
};

const openChatBtn: React.CSSProperties = {
  height: 52,
  minWidth: 150,
  borderRadius: 14,
  background: "#ffd400",
  color: "#05060f",
  display: "grid",
  placeItems: "center",
  textDecoration: "none",
  fontWeight: 900,
};

const infoGrid: React.CSSProperties = {
  marginTop: 28,
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 16,
};

const infoCard: React.CSSProperties = {
  padding: 18,
  borderRadius: 18,
  background: "rgba(255,255,255,0.035)",
  border: "1px solid rgba(255,255,255,0.06)",
  display: "grid",
  gap: 8,
};

const notice: React.CSSProperties = {
  marginTop: 24,
  padding: 18,
  borderRadius: 18,
  background: "rgba(255,212,0,0.08)",
  border: "1px solid rgba(255,212,0,0.18)",
  color: "#ffd400",
  lineHeight: 1.5,
  fontWeight: 800,
};

const actions: React.CSSProperties = {
  marginTop: 24,
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
};

const secondaryBtn: React.CSSProperties = {
  height: 48,
  padding: "0 18px",
  borderRadius: 14,
  background: "rgba(255,255,255,0.05)",
  color: "white",
  display: "grid",
  placeItems: "center",
  textDecoration: "none",
  fontWeight: 900,
};

const dangerBtn: React.CSSProperties = {
  ...secondaryBtn,
  color: "#ef4444",
  border: "1px solid rgba(239,68,68,0.3)",
};

const emptyPreview: React.CSSProperties = {
  height: "100%",
  display: "grid",
  placeItems: "center",
  textAlign: "center",
  color: "#94a3b8",
};