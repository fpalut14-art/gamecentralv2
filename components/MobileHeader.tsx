"use client";

import React from "react";
import Link from "next/link";
import { User } from "firebase/auth";
import { NotificationItem, UserProfile } from "./Header";
import NotificationPanel from "./NotificationPanel";

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
  logout,
}: Props) {
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <header className="gc-mobile-header">
      <div className="gc-mobile-top">
        <Link href="/" className="gc-mobile-logo">
          GAME<span>CENTRAL</span>
        </Link>

        {user && (
          <div className="gc-notification-wrap">
            <button
              type="button"
              className="gc-mobile-icon-btn"
              onClick={() => setOpenNotifications((prev) => !prev)}
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
      </div>

      <form className="gc-mobile-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Ürün, kategori veya ilan ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      <div className="gc-mobile-primary-actions">
        <Link href="/create" className="gc-mobile-create">
          + Yeni İlan
        </Link>

        {!user ? (
          <>
            <Link href="/login" className="gc-mobile-login">
              Giriş
            </Link>

            <Link href="/register" className="gc-mobile-register">
              Kayıt
            </Link>
          </>
        ) : (
          <>
            <Link href="/profile" className="gc-mobile-profile">
              {profile?.name || "Profil"}
            </Link>

            <button type="button" onClick={logout} className="gc-mobile-logout">
              Çıkış
            </button>
          </>
        )}
      </div>

      <nav className="gc-mobile-shortcuts">
        <Link href="/messages">Mesajlar</Link>
        <Link href="/support">Destek</Link>
        <Link href="/my-orders">Siparişler</Link>

        {(profile?.role === "seller" || profile?.role === "admin") && (
          <Link href="/seller">Satıcı</Link>
        )}

        {profile?.role === "admin" && <Link href="/admin">Admin</Link>}
      </nav>
    </header>
  );
}