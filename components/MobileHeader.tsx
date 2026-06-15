"use client";

import React, { useState } from "react";
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
  const [openMenu, setOpenMenu] = useState(false);
  const unreadCount = notifications.filter((item) => !item.read).length;

  return (
    <header className="gc-mobile-header">
      <div className="gc-mobile-top">
        <Link href="/" className="gc-mobile-logo">
          GAME<span>CENTRAL</span>
        </Link>

        <div className="gc-mobile-actions">
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

          <button
            type="button"
            className="gc-mobile-icon-btn"
            onClick={() => setOpenMenu((prev) => !prev)}
          >
            ☰
          </button>
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

      <Link href="/create" className="gc-mobile-create">
        + YENİ İLAN VER
      </Link>

      {openMenu && (
        <nav className="gc-mobile-menu">
          <Link href="/messages" onClick={() => setOpenMenu(false)}>
            Mesajlar
          </Link>

          <Link href="/support" onClick={() => setOpenMenu(false)}>
            Destek
          </Link>

          <Link href="/report" onClick={() => setOpenMenu(false)}>
            Rapor
          </Link>

          <Link href="/my-orders" onClick={() => setOpenMenu(false)}>
            Siparişler
          </Link>

          {user && (
            <Link href="/profile" onClick={() => setOpenMenu(false)}>
              Profil
            </Link>
          )}

          {(profile?.role === "seller" || profile?.role === "admin") && (
            <Link href="/seller" onClick={() => setOpenMenu(false)}>
              Satıcı Paneli
            </Link>
          )}

          {profile?.role === "admin" && (
            <Link href="/admin" onClick={() => setOpenMenu(false)}>
              Admin Paneli
            </Link>
          )}

          {!user ? (
            <>
              <Link href="/login" onClick={() => setOpenMenu(false)}>
                Giriş
              </Link>

              <Link href="/register" onClick={() => setOpenMenu(false)}>
                Kayıt Ol
              </Link>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOpenMenu(false);
                logout();
              }}
            >
              Çıkış
            </button>
          )}
        </nav>
      )}
    </header>
  );
}