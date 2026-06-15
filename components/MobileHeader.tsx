"use client";

import React from "react";
import Link from "next/link";
import { User } from "firebase/auth";
import NotificationPanel from "./NotificationPanel";
import { NotificationItem, UserProfile } from "./Header";

type Props = {
  user: User | null;
  profile: UserProfile | null;
  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  notifications: NotificationItem[];
  openNotifications: boolean;
  setOpenNotifications: React.Dispatch<React.SetStateAction<boolean>>;
  handleSearch: (e: React.FormEvent<HTMLFormElement>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  logout: () => void;
};

const ecosystems = [
  { icon: "🖥️", title: "Sistemler", href: "/?q=Sistemler" },
  { icon: "🎮", title: "Oyun Dünyası", href: "/?q=Oyun" },
  { icon: "⌨️", title: "Ekipmanlar", href: "/?q=Ekipman" },
  { icon: "🪑", title: "Yaşam Alanı", href: "/?q=Koltuk" },
  { icon: "💎", title: "Dijital", href: "/?q=Valorant" },
  { icon: "🏪", title: "Oyun Marketi", href: "/?q=Market" },
];

export default function MobileHeader({
  user,
  profile,
  search,
  setSearch,
  notifications,
  openNotifications,
  setOpenNotifications,
  handleSearch,
  markNotificationRead,
  markAllNotificationsRead,
}: Props) {
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <header className="gc-mobile-header">
      <div className="gc-mobile-top">
        <Link href="/" className="gc-mobile-logo">
          GAME<span>CENTRAL</span>
        </Link>

        <div className="gc-mobile-top-actions">
          {user && (
            <div className="gc-notification-wrap">
              <button
                type="button"
                className="gc-mobile-icon-btn"
                onClick={() => setOpenNotifications((prev) => !prev)}
                aria-label="Bildirimler"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="gc-notification-count">{unreadCount}</span>
                )}
              </button>

              {openNotifications && (
                <NotificationPanel
                  notifications={notifications}
                  unreadCount={unreadCount}
                  markNotificationRead={markNotificationRead}
                  markAllNotificationsRead={markAllNotificationsRead}
                />
              )}
            </div>
          )}

          {user ? (
            <Link href="/profile" className="gc-mobile-avatar">
              {(profile?.name || profile?.email || user.email || "U")
                .slice(0, 1)
                .toUpperCase()}
            </Link>
          ) : (
            <Link href="/login" className="gc-mobile-login-pill">
              Giriş
            </Link>
          )}
        </div>
      </div>

      <form className="gc-mobile-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Ürün, kategori veya ilan ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      <section className="gc-mobile-ecosystem-strip">
        <div className="gc-mobile-strip-head">
          <span>EKOSİSTEMLER</span>
          <small>GameCentral</small>
        </div>

        <div className="gc-mobile-ecosystem-scroll">
          {ecosystems.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="gc-mobile-ecosystem-pill"
            >
              <span>{item.icon}</span>
              <strong>{item.title}</strong>
            </Link>
          ))}
        </div>
      </section>
    </header>
  );
}