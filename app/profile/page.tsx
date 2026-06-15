"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type UserProfile = {
  email?: string;
  name?: string;
  role?: "admin" | "seller" | "user";
  sellerStatus?: "none" | "pending" | "approved" | "rejected";
  banned?: boolean;
};

type Stats = {
  orders: number;
  chats: number;
  products: number;
  notifications: number;
  supportTickets: number;
};

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<Stats>({
    orders: 0,
    chats: 0,
    products: 0,
    notifications: 0,
    supportTickets: 0,
  });

  async function loadProfile(currentUser: User) {
    const ref = doc(db, "users", currentUser.uid);
    const snap = await getDoc(ref);

    if (snap.exists()) {
      setProfile(snap.data() as UserProfile);
      return;
    }

    const fallback: UserProfile = {
      email: currentUser.email || "",
      role: "user",
      sellerStatus: "none",
      banned: false,
    };

    await setDoc(ref, fallback, { merge: true });
    setProfile(fallback);
  }

  async function loadStats(uid: string) {
    try {
      const ordersQ = query(
        collection(db, "orders"),
        where("buyerId", "==", uid)
      );

      const buyerChatsQ = query(
        collection(db, "chats"),
        where("buyerId", "==", uid)
      );

      const sellerChatsQ = query(
        collection(db, "chats"),
        where("sellerId", "==", uid)
      );

      const productsQ = query(
        collection(db, "products"),
        where("sellerId", "==", uid)
      );

      const notificationsQ = query(
        collection(db, "notifications"),
        where("userId", "==", uid)
      );

      const supportQ = query(
        collection(db, "support_tickets"),
        where("userId", "==", uid)
      );

      const [
        ordersSnap,
        buyerChatsSnap,
        sellerChatsSnap,
        productsSnap,
        notificationsSnap,
        supportSnap,
      ] = await Promise.all([
        getDocs(ordersQ),
        getDocs(buyerChatsQ),
        getDocs(sellerChatsQ),
        getDocs(productsQ),
        getDocs(notificationsQ),
        getDocs(supportQ),
      ]);

      setStats({
        orders: ordersSnap.size,
        chats: buyerChatsSnap.size + sellerChatsSnap.size,
        products: productsSnap.size,
        notifications: notificationsSnap.size,
        supportTickets: supportSnap.size,
      });
    } catch (error) {
      console.error("Profil istatistikleri çekilemedi:", error);
    }
  }

  async function applySeller() {
    if (!user) return;

    await setDoc(
      doc(db, "users", user.uid),
      {
        email: user.email,
        role: profile?.role || "user",
        sellerStatus: "pending",
        banned: false,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    alert("Satıcı başvurun admin onayına gönderildi.");
    await loadProfile(user);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push("/login");
        return;
      }

      setUser(currentUser);
      await loadProfile(currentUser);
      await loadStats(currentUser.uid);
      setLoading(false);
    });

    return () => unsub();
  }, [router]);

  if (loading) {
    return <main style={page}>Profil merkezi yükleniyor...</main>;
  }

  const displayName =
    profile?.name || profile?.email || user?.email || "GameCentral Kullanıcısı";

  return (
    <main style={page}>
      <div style={layout}>
        <aside style={sidebar}>
          <div style={profileTop}>
            <div style={avatar}>{displayName.charAt(0).toUpperCase()}</div>

            <h2 style={userName}>{displayName}</h2>
            <p style={muted}>{profile?.email || user?.email}</p>

            <div style={badges}>
              <span style={roleBadge}>{profile?.role || "user"}</span>
              <span style={sellerBadge}>
                seller: {profile?.sellerStatus || "none"}
              </span>
            </div>
          </div>

          <nav style={menu}>
            <Link href="/" style={menuItem}>
              🏠 Ana Sayfa
            </Link>
            <Link href="/my-orders" style={menuItem}>
              📦 Siparişlerim
            </Link>
            <Link href="/messages" style={menuItem}>
              💬 Mesajlarım
            </Link>
            <Link href="/create" style={menuItem}>
              ➕ Yeni İlan
            </Link>
            <Link href="/support" style={menuItem}>
              🎧 Destek
            </Link>
            <Link href="/report" style={menuItem}>
              ⚠️ Rapor Oluştur
            </Link>

            {(profile?.role === "seller" || profile?.role === "admin") && (
              <Link href="/seller" style={sellerMenuItem}>
                🛒 Satıcı Panelim
              </Link>
            )}

            {profile?.role === "admin" && (
              <Link href="/admin" style={adminMenuItem}>
                ⚙️ Admin Panel
              </Link>
            )}
          </nav>
        </aside>

        <section style={main}>
          <section style={hero}>
            <div>
              <span style={eyebrow}>GAMECENTRAL BETA</span>
              <h1 style={title}>Profil Merkezi</h1>
              <p style={heroText}>
                Siparişlerini, mesajlarını, ilanlarını ve destek taleplerini tek
                panelden yönet.
              </p>
            </div>

            <div style={statusCard}>
              <span style={muted}>Hesap Durumu</span>
              <strong style={statusText}>
                {profile?.banned ? "Kısıtlı" : "Aktif"}
              </strong>
            </div>
          </section>

          <section style={statsGrid}>
            <StatCard icon="📦" label="Siparişler" value={stats.orders} />
            <StatCard icon="💬" label="Sohbetler" value={stats.chats} />
            <StatCard icon="📢" label="İlanlarım" value={stats.products} />
            <StatCard
              icon="🔔"
              label="Bildirimler"
              value={stats.notifications}
            />
            <StatCard icon="🎧" label="Destek" value={stats.supportTickets} />
          </section>

          <section style={quickPanel}>
            <div style={sectionHead}>
              <div>
                <h2 style={sectionTitle}>Hızlı İşlemler</h2>
                <p style={muted}>En çok kullanılan işlemler.</p>
              </div>
            </div>

            <div style={quickGrid}>
              <ActionCard
                href="/create"
                title="+ Yeni İlan Ver"
                desc="Ürününü admin onayına gönder."
              />

              <ActionCard
                href="/messages"
                title="Mesajlarım"
                desc="Alıcı ve satıcı sohbetlerini gör."
              />

              <ActionCard
                href="/my-orders"
                title="Siparişlerim"
                desc="Beta sipariş taleplerini takip et."
              />

              <ActionCard
                href="/support"
                title="Canlı Destek"
                desc="Destek talebi oluştur."
              />
            </div>
          </section>

          <section style={sellerPanel}>
            <div>
              <h2 style={sectionTitle}>Satıcı Merkezi</h2>
              <p style={muted}>
                Satış yapmak istiyorsan satıcı başvurusu gönder. Onay sonrası
                satış paneli açılır.
              </p>
            </div>

            {(!profile?.sellerStatus || profile?.sellerStatus === "none") && (
              <button onClick={applySeller} style={sellerBtn}>
                Satıcı Ol
              </button>
            )}

            {profile?.sellerStatus === "pending" && (
              <div style={pendingBox}>Başvurun admin onayı bekliyor.</div>
            )}

            {profile?.sellerStatus === "approved" && (
              <Link href="/seller" style={sellerLink}>
                Satıcı Paneline Git
              </Link>
            )}

            {profile?.sellerStatus === "rejected" && (
              <button onClick={applySeller} style={sellerBtn}>
                Tekrar Başvur
              </button>
            )}
          </section>

          {profile?.banned && (
            <section style={banBox}>
              Bu hesap banlı. İşlem yapma yetkileri kısıtlandı.
            </section>
          )}
        </section>

        <aside style={rightPanel}>
          <h3 style={rightTitle}>Durum Özeti</h3>

          <div style={rightItem}>
            <span>Rol</span>
            <strong>{profile?.role || "user"}</strong>
          </div>

          <div style={rightItem}>
            <span>Satıcı</span>
            <strong>{profile?.sellerStatus || "none"}</strong>
          </div>

          <div style={rightItem}>
            <span>Beta İşlem</span>
            <strong>Aktif</strong>
          </div>

          <div style={noticeBox}>
            Faz 1 beta sürümünde ödeme alınmaz. Satın Al butonu sipariş talebi
            ve sohbet başlatır.
          </div>
        </aside>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div style={statCard}>
      <span style={statIcon}>{icon}</span>
      <small style={muted}>{label}</small>
      <strong style={statNumber}>{value}</strong>
    </div>
  );
}

function ActionCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} style={actionCard}>
      <strong>{title}</strong>
      <span>{desc}</span>
    </Link>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(255,212,0,0.08), transparent 24%), #05060f",
  color: "white",
  padding: 30,
};

const layout: React.CSSProperties = {
  maxWidth: 1700,
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "300px 1fr 310px",
  gap: 24,
};

const sidebar: React.CSSProperties = {
  borderRadius: 26,
  background: "linear-gradient(180deg, #0f172a, #070a12)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: 24,
  alignSelf: "start",
};

const profileTop: React.CSSProperties = {
  textAlign: "center",
  paddingBottom: 22,
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

const avatar: React.CSSProperties = {
  width: 92,
  height: 92,
  margin: "0 auto 16px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #ffd400, #ffb800)",
  color: "#05060f",
  display: "grid",
  placeItems: "center",
  fontSize: 42,
  fontWeight: 900,
};

const userName: React.CSSProperties = {
  margin: 0,
  color: "#ffd400",
  fontSize: 22,
  wordBreak: "break-word",
};

const muted: React.CSSProperties = {
  color: "#94a3b8",
};

const badges: React.CSSProperties = {
  marginTop: 14,
  display: "flex",
  gap: 8,
  justifyContent: "center",
  flexWrap: "wrap",
};

const roleBadge: React.CSSProperties = {
  padding: "7px 11px",
  borderRadius: 999,
  background: "rgba(255,212,0,0.12)",
  color: "#ffd400",
  fontWeight: 900,
};

const sellerBadge: React.CSSProperties = {
  padding: "7px 11px",
  borderRadius: 999,
  background: "rgba(56,189,248,0.1)",
  color: "#38bdf8",
  fontWeight: 900,
};

const menu: React.CSSProperties = {
  marginTop: 22,
  display: "grid",
  gap: 10,
};

const menuItem: React.CSSProperties = {
  height: 48,
  borderRadius: 14,
  background: "rgba(255,255,255,0.035)",
  color: "#cbd5e1",
  display: "flex",
  alignItems: "center",
  padding: "0 16px",
  textDecoration: "none",
  fontWeight: 800,
};

const sellerMenuItem: React.CSSProperties = {
  ...menuItem,
  background: "#ffd400",
  color: "#05060f",
};

const adminMenuItem: React.CSSProperties = {
  ...menuItem,
  color: "#38bdf8",
  border: "1px solid rgba(56,189,248,0.3)",
};

const main: React.CSSProperties = {
  display: "grid",
  gap: 24,
};

const hero: React.CSSProperties = {
  padding: 30,
  borderRadius: 26,
  background:
    "linear-gradient(135deg, rgba(255,212,0,0.14), rgba(15,23,42,0.96))",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  justifyContent: "space-between",
  gap: 20,
  alignItems: "center",
};

const eyebrow: React.CSSProperties = {
  color: "#ffd400",
  fontWeight: 900,
  letterSpacing: 1,
};

const title: React.CSSProperties = {
  margin: "10px 0 0",
  fontSize: 42,
  color: "#ffd400",
};

const heroText: React.CSSProperties = {
  color: "#cbd5e1",
  maxWidth: 620,
};

const statusCard: React.CSSProperties = {
  minWidth: 170,
  padding: 18,
  borderRadius: 18,
  background: "rgba(0,0,0,0.28)",
  display: "grid",
  gap: 8,
};

const statusText: React.CSSProperties = {
  color: "#22c55e",
  fontSize: 24,
};

const statsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 16,
};

const statCard: React.CSSProperties = {
  padding: 20,
  borderRadius: 20,
  background: "#101827",
  border: "1px solid #263244",
  display: "grid",
  gap: 8,
};

const statIcon: React.CSSProperties = {
  fontSize: 28,
};

const statNumber: React.CSSProperties = {
  color: "#ffd400",
  fontSize: 34,
};

const quickPanel: React.CSSProperties = {
  padding: 24,
  borderRadius: 24,
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.08)",
};

const sectionHead: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const sectionTitle: React.CSSProperties = {
  color: "#ffd400",
  margin: 0,
};

const quickGrid: React.CSSProperties = {
  marginTop: 18,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 16,
};

const actionCard: React.CSSProperties = {
  padding: 20,
  borderRadius: 18,
  background: "#101827",
  border: "1px solid #263244",
  color: "white",
  textDecoration: "none",
  display: "grid",
  gap: 8,
};

const sellerPanel: React.CSSProperties = {
  padding: 24,
  borderRadius: 24,
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.08)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 18,
};

const sellerBtn: React.CSSProperties = {
  minWidth: 150,
  height: 52,
  border: "none",
  borderRadius: 14,
  background: "#ffd400",
  color: "#05060f",
  fontWeight: 900,
  cursor: "pointer",
};

const sellerLink: React.CSSProperties = {
  minWidth: 180,
  height: 52,
  borderRadius: 14,
  background: "#ffd400",
  color: "#05060f",
  display: "grid",
  placeItems: "center",
  textDecoration: "none",
  fontWeight: 900,
};

const pendingBox: React.CSSProperties = {
  padding: 16,
  borderRadius: 14,
  background: "rgba(255,212,0,0.1)",
  color: "#ffd400",
  fontWeight: 900,
};

const banBox: React.CSSProperties = {
  padding: 20,
  borderRadius: 18,
  background: "rgba(239,68,68,0.1)",
  color: "#ef4444",
  border: "1px solid rgba(239,68,68,0.25)",
};

const rightPanel: React.CSSProperties = {
  borderRadius: 26,
  background: "linear-gradient(180deg, #0f172a, #070a12)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: 24,
  alignSelf: "start",
  display: "grid",
  gap: 14,
};

const rightTitle: React.CSSProperties = {
  color: "#ffd400",
  margin: 0,
};

const rightItem: React.CSSProperties = {
  padding: 16,
  borderRadius: 16,
  background: "rgba(255,255,255,0.035)",
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
};

const noticeBox: React.CSSProperties = {
  marginTop: 10,
  padding: 16,
  borderRadius: 16,
  background: "rgba(255,212,0,0.08)",
  color: "#ffd400",
  lineHeight: 1.5,
};