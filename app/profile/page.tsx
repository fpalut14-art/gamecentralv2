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
  const [isMobile, setIsMobile] = useState(false);

  const [stats, setStats] = useState<Stats>({
    orders: 0,
    chats: 0,
    products: 0,
    notifications: 0,
    supportTickets: 0,
  });

  useEffect(() => {
    function checkMobile() {
      setIsMobile(window.innerWidth <= 980);
    }

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      const ordersQ = query(collection(db, "orders"), where("buyerId", "==", uid));
      const buyerChatsQ = query(collection(db, "chats"), where("buyerId", "==", uid));
      const sellerChatsQ = query(collection(db, "chats"), where("sellerId", "==", uid));
      const productsQ = query(collection(db, "products"), where("sellerId", "==", uid));
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

  const s = getStyles(isMobile);

  if (loading) {
    return <main style={s.page}>Profil merkezi yükleniyor...</main>;
  }

  const displayName =
    profile?.name || profile?.email || user?.email || "GameCentral Kullanıcısı";

  return (
    <main style={s.page}>
      <div style={s.layout}>
        <aside style={s.sidebar}>
          <div style={s.profileTop}>
            <div style={s.avatar}>{displayName.charAt(0).toUpperCase()}</div>

            <h2 style={s.userName}>{displayName}</h2>
            <p style={s.muted}>{profile?.email || user?.email}</p>

            <div style={s.badges}>
              <span style={s.roleBadge}>{profile?.role || "user"}</span>
              <span style={s.sellerBadge}>
                seller: {profile?.sellerStatus || "none"}
              </span>
            </div>
          </div>

          <nav style={s.menu}>
            <Link href="/" style={s.menuItem}>
              🏠 Ana Sayfa
            </Link>
            <Link href="/my-orders" style={s.menuItem}>
              📦 Siparişlerim
            </Link>
            <Link href="/messages" style={s.menuItem}>
              💬 Mesajlarım
            </Link>
            <Link href="/create" style={s.menuItem}>
              ➕ Yeni İlan
            </Link>
            <Link href="/support" style={s.menuItem}>
              🎧 Destek
            </Link>
            <Link href="/report" style={s.menuItem}>
              ⚠️ Rapor Oluştur
            </Link>

            {(profile?.role === "seller" || profile?.role === "admin") && (
              <Link href="/seller" style={s.sellerMenuItem}>
                🛒 Satıcı Panelim
              </Link>
            )}

            {profile?.role === "admin" && (
              <Link href="/admin" style={s.adminMenuItem}>
                ⚙️ Admin Panel
              </Link>
            )}
          </nav>
        </aside>

        <section style={s.main}>
          <section style={s.hero}>
            <div>
              <span style={s.eyebrow}>GAMECENTRAL BETA</span>
              <h1 style={s.title}>Profil Merkezi</h1>
              <p style={s.heroText}>
                Siparişlerini, mesajlarını, ilanlarını ve destek taleplerini tek
                panelden yönet.
              </p>
            </div>

            <div style={s.statusCard}>
              <span style={s.muted}>Hesap Durumu</span>
              <strong style={s.statusText}>
                {profile?.banned ? "Kısıtlı" : "Aktif"}
              </strong>
            </div>
          </section>

          <section style={s.statsGrid}>
            <StatCard styles={s} icon="📦" label="Siparişler" value={stats.orders} />
            <StatCard styles={s} icon="💬" label="Sohbetler" value={stats.chats} />
            <StatCard styles={s} icon="📢" label="İlanlarım" value={stats.products} />
            <StatCard
              styles={s}
              icon="🔔"
              label="Bildirimler"
              value={stats.notifications}
            />
            <StatCard
              styles={s}
              icon="🎧"
              label="Destek"
              value={stats.supportTickets}
            />
          </section>

          <section style={s.quickPanel}>
            <div style={s.sectionHead}>
              <div>
                <h2 style={s.sectionTitle}>Hızlı İşlemler</h2>
                <p style={s.muted}>En çok kullanılan işlemler.</p>
              </div>
            </div>

            <div style={s.quickGrid}>
              <ActionCard
                styles={s}
                href="/create"
                title="+ Yeni İlan Ver"
                desc="Ürününü admin onayına gönder."
              />

              <ActionCard
                styles={s}
                href="/messages"
                title="Mesajlarım"
                desc="Alıcı ve satıcı sohbetlerini gör."
              />

              <ActionCard
                styles={s}
                href="/my-orders"
                title="Siparişlerim"
                desc="Beta sipariş taleplerini takip et."
              />

              <ActionCard
                styles={s}
                href="/support"
                title="Canlı Destek"
                desc="Destek talebi oluştur."
              />
            </div>
          </section>

          <section style={s.sellerPanel}>
            <div>
              <h2 style={s.sectionTitle}>Satıcı Merkezi</h2>
              <p style={s.muted}>
                Satış yapmak istiyorsan satıcı başvurusu gönder. Onay sonrası
                satış paneli açılır.
              </p>
            </div>

            {(!profile?.sellerStatus || profile?.sellerStatus === "none") && (
              <button type="button" onClick={applySeller} style={s.sellerBtn}>
                Satıcı Ol
              </button>
            )}

            {profile?.sellerStatus === "pending" && (
              <div style={s.pendingBox}>Başvurun admin onayı bekliyor.</div>
            )}

            {profile?.sellerStatus === "approved" && (
              <Link href="/seller" style={s.sellerLink}>
                Satıcı Paneline Git
              </Link>
            )}

            {profile?.sellerStatus === "rejected" && (
              <button type="button" onClick={applySeller} style={s.sellerBtn}>
                Tekrar Başvur
              </button>
            )}
          </section>

          {profile?.banned && (
            <section style={s.banBox}>
              Bu hesap banlı. İşlem yapma yetkileri kısıtlandı.
            </section>
          )}
        </section>

        <aside style={s.rightPanel}>
          <h3 style={s.rightTitle}>Durum Özeti</h3>

          <div style={s.rightItem}>
            <span>Rol</span>
            <strong>{profile?.role || "user"}</strong>
          </div>

          <div style={s.rightItem}>
            <span>Satıcı</span>
            <strong>{profile?.sellerStatus || "none"}</strong>
          </div>

          <div style={s.rightItem}>
            <span>Beta İşlem</span>
            <strong>Aktif</strong>
          </div>

          <div style={s.noticeBox}>
            Faz 1 beta sürümünde ödeme alınmaz. Satın Al butonu sipariş talebi
            ve sohbet başlatır.
          </div>
        </aside>
      </div>
    </main>
  );
}

function StatCard({
  styles,
  icon,
  label,
  value,
}: {
  styles: ReturnType<typeof getStyles>;
  icon: string;
  label: string;
  value: number;
}) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statIcon}>{icon}</span>
      <small style={styles.muted}>{label}</small>
      <strong style={styles.statNumber}>{value}</strong>
    </div>
  );
}

function ActionCard({
  styles,
  href,
  title,
  desc,
}: {
  styles: ReturnType<typeof getStyles>;
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href} style={styles.actionCard}>
      <strong>{title}</strong>
      <span>{desc}</span>
    </Link>
  );
}

function getStyles(isMobile: boolean) {
  const page: React.CSSProperties = {
    minHeight: "100vh",
    background:
      "radial-gradient(circle at top left, rgba(255,212,0,0.08), transparent 24%), #05060f",
    color: "white",
    padding: isMobile ? "14px 12px 92px" : 30,
  };

  const layout: React.CSSProperties = {
    maxWidth: 1700,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "300px 1fr 310px",
    gap: isMobile ? 16 : 24,
  };

  const sidebar: React.CSSProperties = {
    borderRadius: isMobile ? 20 : 26,
    background: "linear-gradient(180deg, #0f172a, #070a12)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: isMobile ? 18 : 24,
    alignSelf: "start",
  };

  const profileTop: React.CSSProperties = {
    textAlign: "center",
    paddingBottom: isMobile ? 18 : 22,
    borderBottom: "1px solid rgba(255,255,255,0.08)",
  };

  const avatar: React.CSSProperties = {
    width: isMobile ? 76 : 92,
    height: isMobile ? 76 : 92,
    margin: "0 auto 16px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, #ffd400, #ffb800)",
    color: "#05060f",
    display: "grid",
    placeItems: "center",
    fontSize: isMobile ? 34 : 42,
    fontWeight: 900,
  };

  const userName: React.CSSProperties = {
    margin: 0,
    color: "#ffd400",
    fontSize: isMobile ? 19 : 22,
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
    gridTemplateColumns: isMobile ? "1fr 1fr" : "1fr",
    gap: 10,
  };

  const menuItem: React.CSSProperties = {
    minHeight: 48,
    borderRadius: 14,
    background: "rgba(255,255,255,0.035)",
    color: "#cbd5e1",
    display: "flex",
    alignItems: "center",
    padding: "0 14px",
    textDecoration: "none",
    fontWeight: 800,
    fontSize: isMobile ? 13 : 15,
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
    gap: isMobile ? 16 : 24,
  };

  const hero: React.CSSProperties = {
    padding: isMobile ? 20 : 30,
    borderRadius: isMobile ? 20 : 26,
    background:
      "linear-gradient(135deg, rgba(255,212,0,0.14), rgba(15,23,42,0.96))",
    border: "1px solid rgba(255,255,255,0.08)",
    display: isMobile ? "grid" : "flex",
    justifyContent: "space-between",
    gap: 20,
    alignItems: isMobile ? "stretch" : "center",
  };

  const eyebrow: React.CSSProperties = {
    color: "#ffd400",
    fontWeight: 900,
    letterSpacing: 1,
  };

  const title: React.CSSProperties = {
    margin: "10px 0 0",
    fontSize: isMobile ? 30 : 42,
    color: "#ffd400",
    lineHeight: 1,
  };

  const heroText: React.CSSProperties = {
    color: "#cbd5e1",
    maxWidth: 620,
    fontSize: isMobile ? 15 : 16,
    lineHeight: 1.5,
  };

  const statusCard: React.CSSProperties = {
    minWidth: isMobile ? "auto" : 170,
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
    gridTemplateColumns: isMobile
      ? "repeat(2, minmax(0, 1fr))"
      : "repeat(auto-fit, minmax(170px, 1fr))",
    gap: isMobile ? 12 : 16,
  };

  const statCard: React.CSSProperties = {
    padding: isMobile ? 16 : 20,
    borderRadius: 20,
    background: "#101827",
    border: "1px solid #263244",
    display: "grid",
    gap: 8,
    minWidth: 0,
  };

  const statIcon: React.CSSProperties = {
    fontSize: isMobile ? 24 : 28,
  };

  const statNumber: React.CSSProperties = {
    color: "#ffd400",
    fontSize: isMobile ? 28 : 34,
  };

  const quickPanel: React.CSSProperties = {
    padding: isMobile ? 18 : 24,
    borderRadius: isMobile ? 20 : 24,
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
    fontSize: isMobile ? 22 : 24,
  };

  const quickGrid: React.CSSProperties = {
    marginTop: 18,
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : "repeat(auto-fit, minmax(220px, 1fr))",
    gap: isMobile ? 12 : 16,
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
    padding: isMobile ? 18 : 24,
    borderRadius: isMobile ? 20 : 24,
    background: "#0f172a",
    border: "1px solid rgba(255,255,255,0.08)",
    display: isMobile ? "grid" : "flex",
    justifyContent: "space-between",
    alignItems: isMobile ? "stretch" : "center",
    gap: 18,
  };

  const sellerBtn: React.CSSProperties = {
    width: isMobile ? "100%" : "auto",
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
    width: isMobile ? "100%" : "auto",
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
    textAlign: isMobile ? "center" : "left",
  };

  const banBox: React.CSSProperties = {
    padding: 20,
    borderRadius: 18,
    background: "rgba(239,68,68,0.1)",
    color: "#ef4444",
    border: "1px solid rgba(239,68,68,0.25)",
  };

  const rightPanel: React.CSSProperties = {
    borderRadius: isMobile ? 20 : 26,
    background: "linear-gradient(180deg, #0f172a, #070a12)",
    border: "1px solid rgba(255,255,255,0.08)",
    padding: isMobile ? 18 : 24,
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

  return {
    page,
    layout,
    sidebar,
    profileTop,
    avatar,
    userName,
    muted,
    badges,
    roleBadge,
    sellerBadge,
    menu,
    menuItem,
    sellerMenuItem,
    adminMenuItem,
    main,
    hero,
    eyebrow,
    title,
    heroText,
    statusCard,
    statusText,
    statsGrid,
    statCard,
    statIcon,
    statNumber,
    quickPanel,
    sectionHead,
    sectionTitle,
    quickGrid,
    actionCard,
    sellerPanel,
    sellerBtn,
    sellerLink,
    pendingBox,
    banBox,
    rightPanel,
    rightTitle,
    rightItem,
    noticeBox,
  };
}