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
import MobileBottomActions from "./MobileBottomActions";
import "./Header.css";

export type UserRole = "admin" | "seller" | "user";

export type UserProfile = {
  email?: string;
  name?: string;
  role?: UserRole;
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

function normalizeRole(value: unknown): UserRole {
  const role = String(value || "user").toLowerCase().trim();

  if (role === "admin") return "admin";
  if (role === "seller") return "seller";

  return "user";
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [openNotifications, setOpenNotifications] = useState(false);

  const isAdminArea = pathname?.startsWith("/admin");
  const isAuthPage = pathname === "/login" || pathname === "/register";

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

      try {
        const snap = await getDoc(doc(db, "users", currentUser.uid));

        if (snap.exists()) {
          const data = snap.data();

          setProfile({
            email: data.email || currentUser.email || "",
            name: data.name || data.username || "",
            role: normalizeRole(data.role),
          });
        } else {
          setProfile({
            email: currentUser.email || "",
            role: "user",
          });
        }

        await loadNotifications(currentUser.uid);
      } catch (error) {
        console.error("Header kullanıcı bilgisi alınamadı:", error);

        setProfile({
          email: currentUser.email || "",
          role: "user",
        });
      }
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
    }
  }

  if (isAdminArea || isAuthPage) return null;

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
      <MobileBottomActions isLoggedIn={!!user} role={profile?.role} />
    </>
  );
}