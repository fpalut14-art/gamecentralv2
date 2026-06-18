"use client";

import React, { useEffect, useRef, useState } from "react";
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
  setDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { now } from "@/lib/format";
import type { Chat, ChatMessage } from "@/types";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id || "");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [user, setUser] = useState<User | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth <= 820);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function load(currentUser?: User | null) {
    const activeUser = currentUser || user;

    try {
      setErrorMessage("");

      const chatSnap = await getDoc(doc(db, "chats", id));

      if (!chatSnap.exists()) {
        setChat(null);
        setLoading(false);
        return;
      }

      const chatData = { id: chatSnap.id, ...chatSnap.data() } as Chat;

      if (
        activeUser &&
        chatData.participants &&
        !chatData.participants.includes(activeUser.uid)
      ) {
        router.push("/messages");
        return;
      }

      setChat(chatData);

      const q = query(collection(db, "messages"), where("chatId", "==", id));
      const snap = await getDocs(q);

      setMessages(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as ChatMessage))
          .sort((a, b) =>
            String(a.createdAt || "").localeCompare(String(b.createdAt || ""))
          )
      );
    } catch (error) {
      console.error("Sohbet yüklenemedi:", error);
      setErrorMessage("Sohbet yüklenemedi. Lütfen tekrar dene.");
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
      await load(currentUser);
    });

    return () => unsub();
  }, [router, id]);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cleanText = text.trim();

    if (!user || !cleanText || sending) return;

    try {
      setSending(true);
      setErrorMessage("");

      await addDoc(collection(db, "messages"), {
        chatId: id,
        senderId: user.uid,
        senderEmail: user.email,
        text: cleanText,
        createdAt: now(),
      });

      await setDoc(
        doc(db, "chats", id),
        {
          lastMessage: cleanText,
          updatedAt: now(),
        },
        { merge: true }
      );

      setText("");
      await load(user);
    } catch (error) {
      console.error("Mesaj gönderilemedi:", error);
      setErrorMessage("Mesaj gönderilemedi. Lütfen tekrar dene.");
    } finally {
      setSending(false);
    }
  }

  const s = getStyles(isMobile);

  if (loading) {
    return <main style={s.page}>Sohbet yükleniyor...</main>;
  }

  if (!chat) {
    return (
      <main style={s.page}>
        <section style={s.shell}>
          <h1>Sohbet bulunamadı</h1>
          <Link href="/messages" style={s.backBtn}>
            Mesajlara dön
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main style={s.page}>
      <section style={s.shell}>
        <header style={s.header}>
          <Link href="/messages" style={s.backBtn}>
            ← Mesajlar
          </Link>

          <div>
            <span style={s.eyebrow}>GAMECENTRAL CHAT</span>
            <h1 style={s.title}>{chat.productTitle || "Sohbet"}</h1>
            <p style={s.muted}>
              Beta sipariş görüşmesi. Ödeme sistemi aktif değildir.
            </p>
          </div>

          {chat.productId && (
            <Link href={`/listing/${chat.productId}`} style={s.listingBtn}>
              İlanı Aç
            </Link>
          )}
        </header>

        {errorMessage && <div style={s.errorBox}>{errorMessage}</div>}

        <div style={s.messageList}>
          {messages.length === 0 && (
            <div style={s.emptyBox}>
              Henüz mesaj yok. İlk mesajı yazarak görüşmeyi başlatabilirsin.
            </div>
          )}

          {messages.map((message) => {
            const mine = message.senderId === user?.uid;

            return (
              <div key={message.id} style={mine ? s.myMessage : s.otherMessage}>
                <b>{message.system ? "Sistem" : mine ? "Ben" : "Karşı taraf"}</b>
                <p style={s.messageText}>{message.text}</p>
                <small style={s.muted}>{message.createdAt || ""}</small>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} style={s.form}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Mesaj yaz..."
            style={s.input}
          />

          <button type="submit" style={s.button} disabled={sending}>
            {sending ? "..." : "Gönder"}
          </button>
        </form>
      </section>
    </main>
  );
}

function getStyles(isMobile: boolean) {
  const page: React.CSSProperties = {
    minHeight: "100vh",
    background: "#05060f",
    color: "white",
    padding: isMobile ? "12px 10px 92px" : 40,
  };

  const shell: React.CSSProperties = {
    maxWidth: 980,
    margin: "0 auto",
    minHeight: isMobile ? "calc(100vh - 104px)" : "auto",
    display: "grid",
    gridTemplateRows: "auto auto 1fr auto",
    gap: isMobile ? 12 : 16,
  };

  const header: React.CSSProperties = {
    padding: isMobile ? 16 : 22,
    borderRadius: isMobile ? 18 : 22,
    background: "linear-gradient(180deg, #0f172a, #070a12)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "grid",
    gap: 12,
  };

  const backBtn: React.CSSProperties = {
    color: "#ffd400",
    textDecoration: "none",
    fontWeight: 900,
    width: "fit-content",
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
    fontSize: isMobile ? 24 : 34,
    lineHeight: 1.1,
    wordBreak: "break-word",
  };

  const muted: React.CSSProperties = {
    color: "#94a3b8",
  };

  const listingBtn: React.CSSProperties = {
    height: 46,
    borderRadius: 14,
    background: "rgba(255,212,0,0.1)",
    color: "#ffd400",
    border: "1px solid rgba(255,212,0,0.24)",
    display: "grid",
    placeItems: "center",
    textDecoration: "none",
    fontWeight: 900,
    padding: "0 16px",
    width: isMobile ? "100%" : "fit-content",
  };

  const errorBox: React.CSSProperties = {
    padding: 14,
    borderRadius: 14,
    color: "#fca5a5",
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.3)",
    fontWeight: 800,
  };

  const messageList: React.CSSProperties = {
    display: "grid",
    alignContent: "start",
    gap: 12,
    padding: isMobile ? 12 : 18,
    borderRadius: isMobile ? 18 : 22,
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    maxHeight: isMobile ? "calc(100vh - 320px)" : 620,
    overflowY: "auto",
  };

  const myMessage: React.CSSProperties = {
    padding: 14,
    borderRadius: 14,
    background: "rgba(255,212,0,.12)",
    border: "1px solid rgba(255,212,0,.18)",
    justifySelf: "end",
    maxWidth: isMobile ? "88%" : "75%",
    overflowWrap: "anywhere",
  };

  const otherMessage: React.CSSProperties = {
    padding: 14,
    borderRadius: 14,
    background: "#101827",
    border: "1px solid #263244",
    justifySelf: "start",
    maxWidth: isMobile ? "88%" : "75%",
    overflowWrap: "anywhere",
  };

  const messageText: React.CSSProperties = {
    margin: "8px 0",
    lineHeight: 1.5,
  };

  const emptyBox: React.CSSProperties = {
    padding: 18,
    borderRadius: 18,
    background: "rgba(255,255,255,0.035)",
    color: "#94a3b8",
    lineHeight: 1.5,
  };

  const form: React.CSSProperties = {
    display: "flex",
    gap: 10,
    padding: isMobile ? 10 : 0,
    borderRadius: isMobile ? 18 : 0,
    background: isMobile ? "#05060f" : "transparent",
    position: isMobile ? "sticky" : "static",
    bottom: isMobile ? 0 : "auto",
  };

  const input: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    height: 52,
    borderRadius: 14,
    background: "#111827",
    color: "white",
    padding: "0 14px",
    border: "1px solid rgba(255,255,255,.1)",
    outline: "none",
    fontSize: 16,
  };

  const button: React.CSSProperties = {
    minWidth: isMobile ? 86 : 110,
    padding: "0 18px",
    borderRadius: 14,
    background: "#ffd400",
    color: "#05060f",
    fontWeight: 900,
    border: 0,
    cursor: "pointer",
  };

  return {
    page,
    shell,
    header,
    backBtn,
    eyebrow,
    title,
    muted,
    listingBtn,
    errorBox,
    messageList,
    myMessage,
    otherMessage,
    messageText,
    emptyBox,
    form,
    input,
    button,
  };
}