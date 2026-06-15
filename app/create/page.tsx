"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { CATEGORIES } from "@/constants";
import { AppUser } from "@/types";

const page: React.CSSProperties = {
  minHeight: "100vh",
  background: "#05060f",
  display: "grid",
  placeItems: "center",
  padding: 30,
  color: "white",
};

const box: React.CSSProperties = {
  width: "100%",
  maxWidth: 720,
  padding: 34,
  borderRadius: 24,
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,.08)",
};

const input: React.CSSProperties = {
  height: 54,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.1)",
  background: "#111827",
  color: "white",
  padding: "0 16px",
};

const textarea: React.CSSProperties = {
  minHeight: 110,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,.1)",
  background: "#111827",
  color: "white",
  padding: 16,
  resize: "vertical",
};

const hint: React.CSSProperties = {
  color: "#94a3b8",
  fontSize: 14,
  lineHeight: 1.6,
};

const preview: React.CSSProperties = {
  width: "100%",
  height: 280,
  objectFit: "cover",
  borderRadius: 18,
  border: "1px solid rgba(255,255,255,.08)",
};

const button: React.CSSProperties = {
  height: 56,
  border: 0,
  borderRadius: 14,
  background: "#ffd400",
  color: "#05060f",
  fontWeight: 900,
  cursor: "pointer",
};

export default function CreatePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (current) => {
      if (!current) {
        router.push("/login");
        return;
      }

      const snap = await getDoc(doc(db, "users", current.uid));
      const data = snap.exists()
        ? ({ id: snap.id, ...snap.data() } as AppUser)
        : null;

      if (
        !data ||
        data.banned ||
        !(data.role === "seller" || data.role === "admin")
      ) {
        alert("İlan açmak için satıcı yetkisi gerekir.");
        router.push("/profile");
        return;
      }

      setUser(current);
      setProfile(data);
      setChecking(false);
    });

    return () => unsub();
  }, [router]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!user) return;

    if (!title.trim()) {
      alert("Ürün başlığı gerekli.");
      return;
    }

    if (!price || Number(price) <= 0) {
      alert("Geçerli bir fiyat gir.");
      return;
    }

    if (!category) {
      alert("Kategori seçmelisin.");
      return;
    }

    try {
      setSubmitting(true);

      await addDoc(collection(db, "products"), {
        title: title.trim(),
        price: Number(price),
        category,
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        status: "pending",
        sellerId: user.uid,
        seller: profile?.email || user.email || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      alert("İlan admin onayına gönderildi.");
      router.push("/");
    } catch (error) {
      console.error("İlan oluşturma hatası:", error);
      alert("İlan oluşturulamadı. Console hatasına bak.");
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return <main style={page}>Yetki kontrol ediliyor...</main>;
  }

  return (
    <main style={page}>
      <form onSubmit={handleCreate} style={box}>
        <h1 style={{ color: "#ffd400", marginTop: 0 }}>
          Yeni İlan Oluştur
        </h1>

        <p style={hint}>
          Faz 1 Beta sürümünde görseller URL ile eklenir. Firebase Storage daha
          sonra aktif edilecek.
        </p>

        <div style={{ display: "grid", gap: 16 }}>
          <input
            placeholder="Ürün başlığı"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={input}
            required
          />

          <input
            placeholder="Fiyat"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={input}
            required
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={input}
            required
          >
            <option value="">Kategori seç</option>
            {CATEGORIES.filter((c) => c !== "TÜMÜ").map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <textarea
            placeholder="Ürün açıklaması"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={textarea}
          />

          <div style={{ display: "grid", gap: 8 }}>
            <strong>Görsel URL'si</strong>

            <input
              placeholder="https://site.com/gorsel.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              style={input}
            />

            <span style={hint}>
              Test için örnek: https://picsum.photos/800/500
            </span>
          </div>

          {imageUrl.trim() && (
            <img
              src={imageUrl.trim()}
              alt="İlan görseli önizleme"
              style={preview}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}

          <button style={button} disabled={submitting}>
            {submitting ? "İLAN GÖNDERİLİYOR..." : "ADMİN ONAYINA GÖNDER"}
          </button>
        </div>
      </form>
    </main>
  );
}