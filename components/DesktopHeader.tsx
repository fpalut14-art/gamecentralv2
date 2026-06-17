"use client";

import React from "react";
import Link from "next/link";
import { User } from "firebase/auth";
import NotificationPanel from "./NotificationPanel";
import type { NotificationItem, UserProfile } from "./Header";

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

export default function DesktopHeader({
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
    <header className="gc-desktop-header">
      <div className="gc-header-left">
        <Link href="/" className="gc-header-logo">
          GAME<span>CENTRAL</span>
        </Link>

        <form className="gc-header-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="İlan, kategori veya ürün ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
      </div>

      <nav className="gc-header-nav">
        <Link href="/messages" className="gc-header-link">
          Mesajlar
        </Link>

        <Link href="/support" className="gc-header-link">
          Destek
        </Link>

        <Link href="/report" className="gc-header-link">
          Rapor
        </Link>

        <Link href="/my-orders" className="gc-header-link">
          Siparişler
        </Link>

        {user && (
          <div className="gc-notification-wrap">
            <button
              type="button"
              className="gc-notification-button"
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

        {user && (
          <Link href="/profile" className="gc-header-link gc-profile-link">
            {profile?.name || profile?.email || user.email || "Profil"}
          </Link>
        )}

        {(profile?.role === "seller" || profile?.role === "admin") && (
          <Link href="/seller" className="gc-header-link gc-seller-link">
            Satıcı
          </Link>
        )}

        {profile?.role === "admin" && (
          <Link href="/admin" className="gc-header-link gc-admin-link">
            Admin
          </Link>
        )}

        {!user ? (
          <>
            <Link href="/login" className="gc-header-link">
              Giriş
            </Link>

            <Link href="/register" className="gc-header-link gc-register-link">
              Kayıt
            </Link>
          </>
        ) : (
          <button type="button" onClick={logout} className="gc-logout-link">
            Çıkış
          </button>
        )}
      </nav>
    </header>
  );
}
