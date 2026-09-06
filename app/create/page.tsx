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

const fileButton: React.CSSProperties = {
  minHeight: 54,
  borderRadius: 14,
  border: "1px dashed rgba(255,255,255,.2)",
  background: "#111827",
  color: "#fff",
  padding: 14,
  cursor: "pointer",
};

const MAX_IMAGE_SIZE = 700 * 1024; // 700 KB

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

  // Mevcut imageUrl alanını koruyoruz.
  // Artık burada Base64 data URL tutulabilecek.
  const [imageUrl, setImageUrl] = useState("");

  const [imageName, setImageName] = useState("");
  const [imageSize, setImageSize] = useState(0);

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
          alert("İlan açmak için satıcı yetkisi gerekir.");
          router.push("/profile");
          return;
        }

        setUser(current);
        setProfile(data);
        setChecking(false);
      } catch (error) {
        console.error("Profil kontrolü hatası:", error);
        alert("Kullanıcı bilgileri kontrol edilemedi.");
        router.push("/");
      }
    });

    return () => unsub();
  }, [router]);

  /**
   * Görseli Base64'e çevirir.
   */
  function handleImageChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    // Sadece görsel kabul et
    if (!file.type.startsWith("image/")) {
      alert("Lütfen bir görsel dosyası seç.");
      e.target.value = "";
      return;
    }

    // Boyut kontrolü
    if (file.size > MAX_IMAGE_SIZE) {
      alert(
        "Görsel çok büyük. Lütfen 700 KB'dan küçük bir görsel seç."
      );
      e.target.value = "";
      return;
    }

    setImageName(file.name);
    setImageSize(file.size);

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;

      if (typeof result !== "string") {
        alert("Görsel okunamadı.");
        return;
      }

      // imageUrl alanına Base64 data URL kaydediyoruz.
      setImageUrl(result);
    };

    reader.onerror = () => {
      alert("Görsel Base64 formatına çevrilemedi.");
    };

    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImageUrl("");
    setImageName("");
    setImageSize(0);
  }

  function formatFileSize(bytes: number) {
    if (!bytes) return "0 KB";

    const kb = bytes / 1024;

    if (kb < 1024) {
      return `${kb.toFixed(0)} KB`;
    }

    return `${(kb / 1024).toFixed(2)} MB`;
  }

  async function handleCreate(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!user) {
      alert("Oturum bulunamadı.");
      return;
    }

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

    if (!description.trim()) {
      alert("Ürün açıklaması gerekli.");
      return;
    }

    try {
      setSubmitting(true);

      const now = new Date().toISOString();

      await addDoc(collection(db, "products"), {
        title: title.trim(),

        price: Number(price),

        category,

        description: description.trim(),

        // MEVCUT imageUrl alanını koruyoruz.
        // Buraya Base64 data URL geliyor.
        imageUrl: imageUrl || "",

        status: "pending",

        sellerId: user.uid,

        seller: profile?.email || user.email || "",

        createdAt: now,

        updatedAt: now,
      });

      alert("İlan admin onayına gönderildi.");

      router.push("/");
    } catch (error) {
      console.error("İlan oluşturma hatası:", error);

      alert(
        "İlan oluşturulamadı. Firestore izinlerini ve Console hatasını kontrol et."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <main style={page}>
        Yetki kontrol ediliyor...
      </main>
    );
  }

  return (
    <main style={page}>
      <form onSubmit={handleCreate} style={box}>
        <h1
          style={{
            color: "#ffd400",
            marginTop: 0,
            marginBottom: 10,
          }}
        >
          Yeni İlan Oluştur
        </h1>

        <p style={hint}>
          Görsel seçtiğinde görsel Base64 formatına çevrilerek
          ilan ile birlikte Firestore&apos;a kaydedilir.
        </p>

        <div
          style={{
            display: "grid",
            gap: 16,
          }}
        >
          {/* ÜRÜN BAŞLIĞI */}

          <input
            placeholder="Ürün başlığı"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={input}
            required
          />

          {/* FİYAT */}

          <input
            placeholder="Fiyat"
            type="number"
            min="1"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            style={input}
            required
          />

          {/* KATEGORİ */}

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={input}
            required
          >
            <option value="">Kategori seç</option>

            {CATEGORIES.filter((c) => c !== "TÜMÜ").map(
              (c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              )
            )}
          </select>

          {/* AÇIKLAMA */}

          <textarea
            placeholder="Ürün açıklaması"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            style={textarea}
            required
          />

          {/* GÖRSEL */}

          <div
            style={{
              display: "grid",
              gap: 10,
            }}
          >
            <strong>İlan Görseli</strong>

            <label style={fileButton}>
              Görsel Seç
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{
                  display: "none",
                }}
              />
            </label>

            <span style={hint}>
              JPG, PNG, WEBP vb. görseller kullanılabilir.
              <br />
              Maksimum dosya boyutu: 700 KB.
            </span>

            {imageName && (
              <div
                style={{
                  padding: 14,
                  borderRadius: 14,
                  background: "#111827",
                  border:
                    "1px solid rgba(255,255,255,.08)",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    marginBottom: 4,
                  }}
                >
                  {imageName}
                </strong>

                <span style={hint}>
                  {formatFileSize(imageSize)}
                </span>
              </div>
            )}
          </div>

          {/* GÖRSEL ÖNİZLEME */}

          {imageUrl && (
            <div
              style={{
                display: "grid",
                gap: 10,
              }}
            >
              <img
                src={imageUrl}
                alt="İlan görseli önizleme"
                style={preview}
              />

              <button
                type="button"
                onClick={removeImage}
                style={{
                  height: 44,
                  border: "1px solid rgba(255,255,255,.1)",
                  borderRadius: 12,
                  background: "#1f2937",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                Görseli Kaldır
              </button>
            </div>
          )}

          {/* GÖRSEL DURUMU */}

          <div
            style={{
              padding: 14,
              borderRadius: 14,
              background: "#080d18",
              border:
                "1px solid rgba(255,255,255,.06)",
            }}
          >
            <span style={hint}>
              Görsel durumu:{" "}
              <strong
                style={{
                  color: imageUrl
                    ? "#ffd400"
                    : "#94a3b8",
                }}
              >
                {imageUrl
                  ? "Base64 hazır"
                  : "Görsel seçilmedi"}
              </strong>
            </span>
          </div>

          {/* GÖNDER */}

          <button
            type="submit"
            style={{
              ...button,
              opacity: submitting ? 0.6 : 1,
              cursor: submitting
                ? "not-allowed"
                : "pointer",
            }}
            disabled={submitting}
          >
            {submitting
              ? "İLAN GÖNDERİLİYOR..."
              : "ADMİN ONAYINA GÖNDER"}
          </button>
        </div>
      </form>
    </main>
  );
}