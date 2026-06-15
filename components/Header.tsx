"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type UserProfile = {
  email?: string;
  name?: string;
  role?: "admin" | "seller" | "user";
};

type NotificationItem = {
  id: string;
  userId?: string;
  title?: string;
  message?: string;
  read?: boolean;
  type?: string;
  createdAt?: string;
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [openNotifications, setOpenNotifications] = useState(false);

  const isAdminArea = pathname?.startsWith("/admin");

  async function loadNotifications(uid: string) {
    try {
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", uid)
      );

      const snap = await getDocs(q);

      const data = snap.docs
        .map((item) => ({
          id: item.id,
          ...(item.data() as Omit<NotificationItem, "id">),
        }))
        .sort((a, b) =>
          String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
        );

      setNotifications(data);
    } catch (error) {
      console.error("Bildirimler çekilemedi:", error);
      setNotifications([]);
    }
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setProfile(null);
        setNotifications([]);
        return;
      }

      const snap = await getDoc(doc(db, "users", currentUser.uid));

      if (snap.exists()) {
        setProfile(snap.data() as UserProfile);
      } else {
        setProfile({
          email: currentUser.email || "",
          role: "user",
        });
      }

      await loadNotifications(currentUser.uid);
    });

    return () => unsub();
  }, []);

  async function logout() {
    await signOut(auth);
    setOpenNotifications(false);
    router.push("/");
  }

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const q = search.trim();

    if (!q) {
      router.push("/");
      return;
    }

    router.push(`/?q=${encodeURIComponent(q)}`);
  }

  async function markNotificationRead(id: string) {
    if (!user) return;

    try {
      await updateDoc(doc(db, "notifications", id), {
        read: true,
        readAt: new Date().toISOString(),
      });

      await loadNotifications(user.uid);
    } catch (error) {
      console.error("Bildirim okundu yapılamadı:", error);
      alert("Bildirim güncellenemedi.");
    }
  }

  async function markAllNotificationsRead() {
    if (!user) return;

    try {
      const unread = notifications.filter((item) => !item.read);

      await Promise.all(
        unread.map((item) =>
          updateDoc(doc(db, "notifications", item.id), {
            read: true,
            readAt: new Date().toISOString(),
          })
        )
      );

      await loadNotifications(user.uid);
    } catch (error) {
      console.error("Bildirimler okundu yapılamadı:", error);
      alert("Bildirimler güncellenemedi.");
    }
  }

  if (isAdminArea) return null;

  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <header style={header}>
      <div style={leftArea}>
        <Link href="/" style={logo}>
          GAME<span style={{ color: "#ffd400" }}>CENTRAL</span>
        </Link>

        <form style={searchForm} onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="İlan, kategori veya ürün ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={searchInput}
          />
        </form>
      </div>

      <nav style={nav}>
        <Link href="/messages" style={navItem}>
          💬 Mesajlar
        </Link>

        <Link href="/support" style={navItem}>
          🎧 Destek
        </Link>

        <Link href="/report" style={navItem}>
          ⚠️ Rapor
        </Link>

        <Link href="/my-orders" style={navItem}>
          📦 Siparişler
        </Link>

        {user && (
          <div style={notificationWrap}>
            <button
              type="button"
              style={notificationBtn}
              onClick={() => setOpenNotifications((prev) => !prev)}
            >
              🔔
              {unreadCount > 0 && (
                <span style={notificationCount}>{unreadCount}</span>
              )}
            </button>

            {openNotifications && (
              <div style={notificationPanel}>
                <div style={notificationHead}>
                  <strong>Bildirimler</strong>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      style={smallActionBtn}
                      onClick={markAllNotificationsRead}
                    >
                      Hepsini okundu yap
                    </button>
                  )}
                </div>

                {notifications.length === 0 && (
                  <div style={notificationEmpty}>Henüz bildirimin yok.</div>
                )}

                {notifications.map((item) => (
                  <div
                    key={item.id}
                    style={
                      item.read
                        ? notificationItemRead
                        : notificationItemUnread
                    }
                  >
                    <strong style={notificationTitle}>
                      {item.title || "Bildirim"}
                    </strong>

                    <p style={notificationMessage}>
                      {item.message || "Mesaj yok"}
                    </p>

                    <small style={notificationDate}>
                      {item.createdAt || ""}
                    </small>

                    {!item.read && (
                      <button
                        type="button"
                        style={markReadBtn}
                        onClick={() => markNotificationRead(item.id)}
                      >
                        Okundu yap
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {user && (
          <Link href="/profile" style={profileBtn}>
            👤 {profile?.name || profile?.email || user.email || "Profil"}
          </Link>
        )}

        {(profile?.role === "seller" || profile?.role === "admin") && (
          <Link href="/seller" style={sellerBtn}>
            🛒 Satıcı
          </Link>
        )}

        {profile?.role === "admin" && (
          <Link href="/admin" style={adminBtn}>
            ⚙️ Admin
          </Link>
        )}

        {!user ? (
          <>
            <Link href="/login" style={loginBtn}>
              Giriş
            </Link>

            <Link href="/register" style={registerBtn}>
              Kayıt
            </Link>
          </>
        ) : (
          <button onClick={logout} style={logoutBtn}>
            Çıkış
          </button>
        )}
      </nav>
    </header>
  );
}

const header: React.CSSProperties = {
  minHeight: 72,
  padding: "0 28px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 20,
  background: "rgba(0,0,0,0.94)",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  position: "sticky",
  top: 0,
  zIndex: 1000,
  backdropFilter: "blur(16px)",
  overflow: "visible",
};

const leftArea: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 24,
  minWidth: 0,
  flex: "1 1 auto",
};

const logo: React.CSSProperties = {
  color: "white",
  fontWeight: 900,
  fontSize: 26,
  letterSpacing: 1,
  textDecoration: "none",
  flex: "0 0 auto",
};

const searchForm: React.CSSProperties = {
  width: 440,
  minWidth: 280,
  maxWidth: 440,
  flex: "0 0 440px",
};

const searchInput: React.CSSProperties = {
  width: "100%",
  height: 42,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.1)",
  background: "linear-gradient(180deg,#0d0f16,#080910)",
  color: "white",
  padding: "0 16px",
  outline: "none",
  fontSize: 14,
  fontWeight: 800,
};

const nav: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  justifyContent: "flex-end",
  overflowX: "visible",
  whiteSpace: "nowrap",
  scrollbarWidth: "none",
  flex: "0 1 auto",
};

const navItem: React.CSSProperties = {
  height: 40,
  padding: "0 13px",
  borderRadius: 12,
  display: "flex",
  alignItems: "center",
  color: "#cbd5e1",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.06)",
  textDecoration: "none",
  fontWeight: 800,
  fontSize: 14,
  flex: "0 0 auto",
};

const notificationWrap: React.CSSProperties = {
  position: "relative",
  flex: "0 0 auto",
};

const notificationBtn: React.CSSProperties = {
  width: 42,
  height: 40,
  borderRadius: 12,
  border: "1px solid rgba(255,212,0,0.28)",
  background: "rgba(255,212,0,0.08)",
  color: "#ffd400",
  fontWeight: 900,
  cursor: "pointer",
  position: "relative",
};

const notificationCount: React.CSSProperties = {
  position: "absolute",
  top: -8,
  right: -8,
  minWidth: 20,
  height: 20,
  borderRadius: 999,
  background: "#ef4444",
  color: "white",
  fontSize: 11,
  display: "grid",
  placeItems: "center",
  padding: "0 5px",
};

const notificationPanel: React.CSSProperties = {
  position: "absolute",
  top: 52,
  right: 0,
  width: 360,
  maxHeight: 460,
  overflowY: "auto",
  borderRadius: 18,
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 28px 90px rgba(0,0,0,0.55)",
  padding: 14,
  zIndex: 9999,
};

const notificationHead: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  color: "#ffd400",
  gap: 12,
};

const smallActionBtn: React.CSSProperties = {
  border: "1px solid rgba(255,212,0,0.25)",
  background: "rgba(255,212,0,0.08)",
  color: "#ffd400",
  borderRadius: 10,
  padding: "7px 10px",
  fontWeight: 900,
  cursor: "pointer",
};

const notificationEmpty: React.CSSProperties = {
  marginTop: 12,
  padding: 14,
  borderRadius: 14,
  background: "rgba(255,255,255,0.035)",
  color: "#94a3b8",
};

const notificationItemBase: React.CSSProperties = {
  marginTop: 10,
  padding: 14,
  borderRadius: 14,
  border: "1px solid rgba(255,255,255,0.06)",
};

const notificationItemUnread: React.CSSProperties = {
  ...notificationItemBase,
  background: "rgba(255,212,0,0.08)",
  border: "1px solid rgba(255,212,0,0.18)",
};

const notificationItemRead: React.CSSProperties = {
  ...notificationItemBase,
  background: "rgba(255,255,255,0.035)",
  opacity: 0.75,
};

const notificationTitle: React.CSSProperties = {
  color: "#ffd400",
};

const notificationMessage: React.CSSProperties = {
  color: "#cbd5e1",
  margin: "6px 0",
  whiteSpace: "normal",
};

const notificationDate: React.CSSProperties = {
  color: "#64748b",
};

const markReadBtn: React.CSSProperties = {
  marginTop: 10,
  height: 32,
  padding: "0 10px",
  borderRadius: 10,
  border: "1px solid rgba(255,212,0,0.25)",
  background: "rgba(255,212,0,0.08)",
  color: "#ffd400",
  fontWeight: 900,
  cursor: "pointer",
};

const profileBtn: React.CSSProperties = {
  ...navItem,
  color: "#ffd400",
  border: "1px solid rgba(255,212,0,0.25)",
  maxWidth: 230,
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const sellerBtn: React.CSSProperties = {
  ...navItem,
  color: "#05060f",
  background: "#ffd400",
};

const adminBtn: React.CSSProperties = {
  ...navItem,
  color: "#38bdf8",
  border: "1px solid rgba(56,189,248,0.3)",
};

const loginBtn: React.CSSProperties = {
  ...navItem,
  color: "white",
};

const registerBtn: React.CSSProperties = {
  ...navItem,
  background: "#ffd400",
  color: "#05060f",
};

const logoutBtn: React.CSSProperties = {
  height: 40,
  padding: "0 13px",
  borderRadius: 12,
  border: "1px solid rgba(239,68,68,0.35)",
  background: "rgba(239,68,68,0.08)",
  color: "#ef4444",
  fontWeight: 900,
  cursor: "pointer",
  flex: "0 0 auto",
};