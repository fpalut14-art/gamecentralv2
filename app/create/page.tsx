"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { addDoc, collection, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { CATEGORIES } from "@/constants";
import { AppUser } from "@/types";

export default function CreatePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success" | "info">(
    "info"
  );

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth <= 760);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (current) => {
      if (!current) {
        router.push("/login");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", current.uid));
        const data = snap.exists()
          ? ({ id: snap.id, ...snap.data() } as AppUser)
          : null;

        if (
          !data ||
          data.banned ||
          !(data.role === "seller" || data.role === "admin")
        ) {
          setMessageType("error");
          setMessage("İlan açmak için satıcı yetkisi gerekir. Profil sayfasına yönlendiriliyorsun.");

          setTimeout(() => {
            router.push("/profile");
          }, 1200);

          return;
        }

        setUser(current);
        setProfile(data);
      } catch (error) {
        console.error("Yetki kontrol hatası:", error);
        setMessageType("error");
        setMessage("Yetki kontrolü yapılamadı. Lütfen tekrar giriş yap.");
      } finally {
        setChecking(false);
      }
    });

    return () => unsub();
  }, [router]);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!user) return;

    setMessage("");

    if (!title.trim()) {
      setMessageType("error");
      setMessage("Ürün başlığı gerekli.");
      return;
    }

    if (!price || Number(price) <= 0) {
      setMessageType("error");
      setMessage("Geçerli bir fiyat gir.");
      return;
    }

    if (!category) {
      setMessageType("error");
      setMessage("Kategori seçmelisin.");
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

      setMessageType("success");
      setMessage("İlan admin onayına gönderildi.");

      setTimeout(() => {
        router.push("/");
      }, 900);
    } catch (error) {
      console.error("İlan oluşturma hatası:", error);
      setMessageType("error");
      setMessage("İlan oluşturulamadı. Lütfen tekrar dene.");
    } finally {
      setSubmitting(false);
    }
  }

  const s = getStyles(isMobile, messageType);

  if (checking) {
    return <main style={s.page}>Yetki kontrol ediliyor...</main>;
  }

  return (
    <main style={s.page}>
      <form onSubmit={handleCreate} style={s.box}>
        <div style={s.header}>
          <span style={s.eyebrow}>GAMECENTRAL BETA</span>
          <h1 style={s.title}>Yeni İlan Oluştur</h1>

          <p style={s.hint}>
            Ürününü ekle, admin onayından sonra ana sayfada yayınlansın.
          </p>
        </div>

        {message && <div style={s.messageBox}>{message}</div>}

        <div style={s.formGrid}>
          <label style={s.field}>
            <span style={s.label}>Ürün başlığı</span>
            <input
              placeholder="Örn: Monster Abra A5 Gaming Laptop"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={s.input}
              required
            />
          </label>

          <label style={s.field}>
            <span style={s.label}>Fiyat</span>
            <input
              placeholder="Örn: 14500"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              style={s.input}
              required
            />
          </label>

          <label style={s.field}>
            <span style={s.label}>Kategori</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={s.input}
              required
            >
              <option value="">Kategori seç</option>
              {CATEGORIES.filter((c) => c !== "TÜMÜ").map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label style={s.field}>
            <span style={s.label}>Ürün açıklaması</span>
            <textarea
              placeholder="Ürünün durumu, garantisi, kullanım süresi ve detaylarını yaz."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={s.textarea}
            />
          </label>

          <label style={s.field}>
            <span style={s.label}>Görsel URL'si</span>
            <input
              placeholder="https://site.com/gorsel.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              style={s.input}
            />
            <span style={s.hint}>
              Test için örnek: https://picsum.photos/800/500
            </span>
          </label>

          {imageUrl.trim() && (
            <img
              src={imageUrl.trim()}
              alt="İlan görseli önizleme"
              style={s.preview}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}

          <button type="submit" style={s.button} disabled={submitting}>
            {submitting ? "İLAN GÖNDERİLİYOR..." : "ADMİN ONAYINA GÖNDER"}
          </button>
        </div>
      </form>
    </main>
  );
}

function getStyles(
  isMobile: boolean,
  messageType: "error" | "success" | "info"
) {
  const messageColor =
    messageType === "success"
      ? "#22c55e"
      : messageType === "error"
      ? "#fca5a5"
      : "#93c5fd";

  const messageBg =
    messageType === "success"
      ? "rgba(34,197,94,0.1)"
      : messageType === "error"
      ? "rgba(239,68,68,0.12)"
      : "rgba(59,130,246,0.1)";

  const page: React.CSSProperties = {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(255,212,0,0.09), transparent 25%), #05060f",
    display: "grid",
    placeItems: isMobile ? "start stretch" : "center",
    padding: isMobile ? "16px 12px 92px" : 30,
    color: "white",
  };

  const box: React.CSSProperties = {
    width: "100%",
    maxWidth: 720,
    margin: "0 auto",
    padding: isMobile ? 18 : 34,
    borderRadius: isMobile ? 20 : 24,
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,.08)",
    boxShadow: "0 26px 90px rgba(0,0,0,0.35)",
  };

  const header: React.CSSProperties = {
    marginBottom: 22,
  };

  const eyebrow: React.CSSProperties = {
    color: "#ffd400",
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: 1,
  };

  const title: React.CSSProperties = {
    color: "#ffd400",
    margin: "8px 0 0",
    fontSize: isMobile ? 30 : 38,
    lineHeight: 1,
  };

  const hint: React.CSSProperties = {
    color: "#94a3b8",
    fontSize: 14,
    lineHeight: 1.6,
  };

  const messageBox: React.CSSProperties = {
    marginBottom: 18,
    padding: 14,
    borderRadius: 14,
    color: messageColor,
    background: messageBg,
    border: `1px solid ${messageColor}55`,
    fontWeight: 800,
    lineHeight: 1.4,
  };

  const formGrid: React.CSSProperties = {
    display: "grid",
    gap: isMobile ? 14 : 16,
  };

  const field: React.CSSProperties = {
    display: "grid",
    gap: 8,
  };

  const label: React.CSSProperties = {
    color: "#cbd5e1",
    fontWeight: 900,
  };

  const input: React.CSSProperties = {
    width: "100%",
    height: isMobile ? 52 : 54,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.1)",
    background: "#111827",
    color: "white",
    padding: "0 16px",
    outline: "none",
    fontSize: 16,
  };

  const textarea: React.CSSProperties = {
    width: "100%",
    minHeight: isMobile ? 120 : 110,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,.1)",
    background: "#111827",
    color: "white",
    padding: 16,
    resize: "vertical",
    outline: "none",
    fontSize: 16,
  };

  const preview: React.CSSProperties = {
    width: "100%",
    height: isMobile ? 190 : 280,
    objectFit: "cover",
    borderRadius: 18,
    border: "1px solid rgba(255,255,255,.08)",
  };

  const button: React.CSSProperties = {
    width: "100%",
    height: 56,
    border: 0,
    borderRadius: 14,
    background: "#ffd400",
    color: "#05060f",
    fontWeight: 900,
    cursor: submittingCursor(false),
    fontSize: 15,
  };

  return {
    page,
    box,
    header,
    eyebrow,
    title,
    hint,
    messageBox,
    formGrid,
    field,
    label,
    input,
    textarea,
    preview,
    button,
  };
}

function submittingCursor(disabled: boolean) {
  return disabled ? "not-allowed" : "pointer";
}