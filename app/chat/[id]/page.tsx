'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { now } from '@/lib/format';
import type { Chat, ChatMessage } from '@/types';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  async function load(currentUser?: User | null) {
    const activeUser = currentUser || user;
    const chatSnap = await getDoc(doc(db, 'chats', id));

    if (!chatSnap.exists()) {
      setChat(null);
      setLoading(false);
      return;
    }

    const chatData = { id: chatSnap.id, ...chatSnap.data() } as Chat;

    if (activeUser && chatData.participants && !chatData.participants.includes(activeUser.uid)) {
      router.push('/messages');
      return;
    }

    setChat(chatData);

    const q = query(collection(db, 'messages'), where('chatId', '==', id));
    const snap = await getDocs(q);
    setMessages(
      snap.docs
        .map((d) => ({ id: d.id, ...d.data() } as ChatMessage))
        .sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')))
    );

    setLoading(false);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);
      await load(currentUser);
    });

    return () => unsub();
  }, [router, id]);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user || !text.trim()) return;

    await addDoc(collection(db, 'messages'), {
      chatId: id,
      senderId: user.uid,
      senderEmail: user.email,
      text,
      createdAt: now(),
    });

    await setDoc(doc(db, 'chats', id), { lastMessage: text, updatedAt: now() }, { merge: true });
    setText('');
    await load(user);
  }

  if (loading) return <main style={page}>Sohbet yükleniyor...</main>;

  if (!chat) {
    return (
      <main style={page}>
        <h1>Sohbet bulunamadı</h1>
        <Link href="/messages" style={backBtn}>Mesajlara dön</Link>
      </main>
    );
  }

  return (
    <main style={page}>
      <section style={wrap}>
        <Link href="/messages" style={backBtn}>← Mesajlar</Link>
        <h1 style={title}>{chat.productTitle || 'Sohbet'}</h1>
        <p style={muted}>Beta sipariş görüşmesi. Ödeme sistemi aktif değildir.</p>

        <div style={messageList}>
          {messages.map((message) => {
            const mine = message.senderId === user?.uid;
            return (
              <div key={message.id} style={mine ? myMessage : otherMessage}>
                <b>{message.system ? 'Sistem' : mine ? 'Ben' : 'Karşı taraf'}</b>
                <p>{message.text}</p>
                <small style={muted}>{message.createdAt || ''}</small>
              </div>
            );
          })}
        </div>

        <form onSubmit={send} style={form}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Mesaj yaz..." style={input} />
          <button style={button}>Gönder</button>
        </form>
      </section>
    </main>
  );
}

const page: React.CSSProperties = { minHeight: '100vh', background: '#05060f', color: 'white', padding: 40 };
const wrap: React.CSSProperties = { maxWidth: 980, margin: '0 auto' };
const backBtn: React.CSSProperties = { color: '#ffd400', textDecoration: 'none', fontWeight: 900 };
const title: React.CSSProperties = { color: '#ffd400', marginTop: 24 };
const muted: React.CSSProperties = { color: '#94a3b8' };
const messageList: React.CSSProperties = { display: 'grid', gap: 12, marginTop: 24 };
const myMessage: React.CSSProperties = { padding: 14, borderRadius: 14, background: 'rgba(255,212,0,.12)', border: '1px solid rgba(255,212,0,.18)', justifySelf: 'end', maxWidth: '75%' };
const otherMessage: React.CSSProperties = { padding: 14, borderRadius: 14, background: '#101827', border: '1px solid #263244', justifySelf: 'start', maxWidth: '75%' };
const form: React.CSSProperties = { display: 'flex', gap: 10, marginTop: 20 };
const input: React.CSSProperties = { flex: 1, height: 50, borderRadius: 12, background: '#111827', color: 'white', padding: '0 14px', border: '1px solid rgba(255,255,255,.1)' };
const button: React.CSSProperties = { padding: '0 20px', borderRadius: 12, background: '#ffd400', color: '#05060f', fontWeight: 900, border: 0, cursor: 'pointer' };
