"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FloatingSupport() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) return null;

  return (
    <Link href="/support" style={button}>
      <span style={icon}>🎧</span>
      <span>
        <strong>Canlı Destek</strong>
        <small>Yardım al</small>
      </span>
    </Link>
  );
}

const button: React.CSSProperties = {
  position: "fixed",
  right: 24,
  bottom: 24,
  zIndex: 1000,
  minWidth: 190,
  height: 64,
  borderRadius: 999,
  background: "linear-gradient(135deg, #ffd400, #ffb800)",
  color: "#05060f",
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "0 18px",
  textDecoration: "none",
  fontWeight: 900,
  boxShadow: "0 18px 50px rgba(255,212,0,0.28)",
};

const icon: React.CSSProperties = {
  width: 42,
  height: 42,
  borderRadius: "50%",
  background: "rgba(0,0,0,0.12)",
  display: "grid",
  placeItems: "center",
  fontSize: 22,
};