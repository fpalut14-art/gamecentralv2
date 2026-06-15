"use client";

import Link from "next/link";

type Props = {
  isLoggedIn: boolean;
  role?: string;
};

export default function MobileBottomActions({
  isLoggedIn,
  role,
}: Props) {
  return (
    <nav className="gc-mobile-bottom-nav">
      {!isLoggedIn ? (
        <>
          <Link href="/create">➕<span>İlan</span></Link>
          <Link href="/login">👤<span>Giriş</span></Link>
          <Link href="/register">📝<span>Kayıt</span></Link>
          <Link href="/support">🎧<span>Destek</span></Link>
        </>
      ) : role === "admin" ? (
        <>
          <Link href="/admin">🛠<span>Admin</span></Link>
          <Link href="/seller">📦<span>Panel</span></Link>
          <Link href="/messages">💬<span>Mesaj</span></Link>
          <Link href="/support">🎧<span>Destek</span></Link>
        </>
      ) : role === "seller" ? (
        <>
          <Link href="/create">➕<span>İlan</span></Link>
          <Link href="/seller">📦<span>Panel</span></Link>
          <Link href="/messages">💬<span>Mesaj</span></Link>
          <Link href="/support">🎧<span>Destek</span></Link>
        </>
      ) : (
        <>
          <Link href="/create">➕<span>İlan</span></Link>
          <Link href="/profile">👤<span>Profil</span></Link>
          <Link href="/messages">💬<span>Mesaj</span></Link>
          <Link href="/support">🎧<span>Destek</span></Link>
        </>
      )}
    </nav>
  );
}