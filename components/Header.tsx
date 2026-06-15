"use client";

import React, { useEffect, useState } from "react";
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
import DesktopHeader from "./DesktopHeader";
import MobileHeader from "./MobileHeader";
import "./Header.css";

export type UserProfile = {
  email?: string;
  name?: string;
  role?: "admin" | "seller" | "user";
};

export type NotificationItem = {
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
      const q = query(collection(db, "notifications"), where("userId", "==", uid));
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

  const sharedProps = {
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
  };

  return (
    <>
      <DesktopHeader {...sharedProps} />
      <MobileHeader {...sharedProps} />
    </>
  );
}