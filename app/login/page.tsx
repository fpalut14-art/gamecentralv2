"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type AppUser = {
  email?: string;
  name?: string;
  role?: "admin" | "seller" | "user";
  sellerStatus?: "none" | "pending" | "approved" | "rejected";
  banned?: boolean;
  createdAt?: string;
  updatedAt?: string;
  lastLoginAt?: string;
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);
      setErrorMessage("");

      const cleanEmail = email.trim();

      const result = await signInWithEmailAndPassword(
        auth,
        cleanEmail,
        password
      );

      const uid = result.user.uid;
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      let userData: AppUser;

      if (userSnap.exists()) {
        userData = userSnap.data() as AppUser;
      } else {
        userData = {
          email: result.user.email || cleanEmail,
          role: "user",
          sellerStatus: "none",
          banned: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await setDoc(userRef, userData, { merge: true });
      }

      if (userData.banned === true) {
        setErrorMessage("Bu hesap banlanmış. Destek ile iletişime geç.");
        return;
      }

      await setDoc(
        userRef,
        {
          email: result.user.email || cleanEmail,
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      if (userData.role === "admin") {
        router.push("/admin");
        return;
      }

      if (userData.role === "seller") {
        router.push("/seller");
        return;
      }

      router.push("/profile");
    } catch (error: any) {
      console.error("LOGIN ERROR:", error);

      if (error?.code === "auth/invalid-credential") {
        setErrorMessage("E-posta veya şifre hatalı.");
        return;
      }

      if (error?.code === "auth/user-not-found") {
        setErrorMessage("Bu e-posta ile kayıtlı kullanıcı yok.");
        return;
      }

      if (error?.code === "auth/wrong-password") {
        setErrorMessage("Şifre hatalı.");
        return;
      }

      if (
        error?.code === "permission-denied" ||
        error?.code === "firestore/permission-denied"
      ) {
        setErrorMessage(
          "Giriş başarılı fakat kullanıcı profili okunamadı. Firestore Rules users iznini kontrol et."
        );
        return;
      }

      setErrorMessage(
        `Giriş başarısız: ${error?.code || error?.message || "Bilinmeyen hata"}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={page}>
      <section style={box}>
        <Link href="/" style={logo}>
          GAME<span style={{ color: "#ffd400" }}>CENTRAL</span>
        </Link>

        <h1 style={title}>Giriş Yap</h1>
        <p style={text}>Hesabına giriş yap ve paneline yönlen.</p>

        <form onSubmit={handleLogin} style={form}>
          <input
            type="email"
            placeholder="E-posta adresi"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input}
            required
            autoComplete="email"
          />

          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input}
            required
            autoComplete="current-password"
          />

          <button type="submit" style={button} disabled={loading}>
            {loading ? "GİRİŞ YAPILIYOR..." : "GİRİŞ YAP"}
          </button>
        </form>

        {errorMessage && <div style={errorBox}>{errorMessage}</div>}

        <Link href="/register" style={registerLink}>
          Hesabın yok mu? Kayıt ol
        </Link>
      </section>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(255,212,0,0.14), transparent 28%), #050505",
  display: "grid",
  placeItems: "center",
  padding: 18,
  color: "white",
};

const box: React.CSSProperties = {
  width: "100%",
  maxWidth: 460,
  padding: 30,
  borderRadius: 26,
  background: "linear-gradient(180deg, #0f172a, #070a12)",
  border: "1px solid rgba(255,255,255,0.09)",
  boxShadow: "0 28px 90px rgba(0,0,0,0.45)",
};

const logo: React.CSSProperties = {
  display: "inline-block",
  marginBottom: 26,
  color: "white",
  textDecoration: "none",
  fontWeight: 900,
  fontSize: 28,
};

const title: React.CSSProperties = {
  margin: 0,
  color: "#ffd400",
  fontSize: 36,
  fontWeight: 900,
};

const text: React.CSSProperties = {
  color: "#94a3b8",
  marginTop: 10,
};

const form: React.CSSProperties = {
  display: "grid",
  gap: 16,
  marginTop: 28,
};

const input: React.CSSProperties = {
  height: 54,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.09)",
  background: "#111827",
  padding: "0 16px",
  color: "white",
  outline: "none",
  fontSize: 15,
};

const button: React.CSSProperties = {
  height: 54,
  border: "none",
  borderRadius: 14,
  background: "#ffd400",
  color: "#050505",
  fontWeight: 900,
  cursor: "pointer",
  fontSize: 16,
};

const errorBox: React.CSSProperties = {
  marginTop: 16,
  padding: 13,
  borderRadius: 14,
  background: "rgba(239,68,68,0.12)",
  border: "1px solid rgba(239,68,68,0.35)",
  color: "#fca5a5",
  fontWeight: 800,
  lineHeight: 1.4,
};

const registerLink: React.CSSProperties = {
  display: "inline-block",
  marginTop: 18,
  color: "#38bdf8",
  textDecoration: "none",
  fontWeight: 800,
};