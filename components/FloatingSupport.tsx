"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function FloatingSupport() {
  const pathname = usePathname();

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth <= 768);
    }

    check();

    window.addEventListener("resize", check);

    return () => window.removeEventListener("resize", check);
  }, []);

  const isAuthPage =
    pathname === "/login" || pathname === "/register";

  if (pathname?.startsWith("/admin") || isAuthPage) return null;

  return (
    <>
      <style>{`
        @keyframes gcSupportPulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(255,212,0,.35);
          }
          50% {
            transform: scale(1.06);
            box-shadow: 0 0 25px rgba(255,212,0,.55);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 rgba(255,212,0,.35);
          }
        }
      `}</style>

      <Link
        href="/support"
        style={isMobile ? mobileButton : desktopButton}
      >
        <div style={iconWrapper}>
          <span style={onlineDot}></span>
          <span style={icon}>🎧</span>
        </div>

        {!isMobile && (
          <div style={text}>
            <strong>Canlı Destek</strong>
            <small>Çevrimiçi • Yardım Al</small>
          </div>
        )}
      </Link>
    </>
  );
}

const desktopButton: React.CSSProperties = {
  position: "fixed",
  right: 24,
  bottom: 24,
  zIndex: 9999,
  width: 210,
  height: 66,
  borderRadius: 999,
  background: "linear-gradient(135deg,#ffd400,#ffb800)",
  color: "#05060f",
  display: "flex",
  alignItems: "center",
  gap: 14,
  padding: "0 18px",
  textDecoration: "none",
  fontWeight: 900,
  boxShadow: "0 15px 35px rgba(255,212,0,.35)",
  animation: "gcSupportPulse 2.5s infinite",
};

const mobileButton: React.CSSProperties = {
  position: "fixed",
  right: 16,
  bottom: 88,
  zIndex: 9999,
  width: 64,
  height: 64,
  borderRadius: "50%",
  background: "linear-gradient(135deg,#ffd400,#ffb800)",
  display: "grid",
  placeItems: "center",
  textDecoration: "none",
  boxShadow: "0 15px 35px rgba(255,212,0,.35)",
  animation: "gcSupportPulse 2.5s infinite",
};

const iconWrapper: React.CSSProperties = {
  position: "relative",
  width: 46,
  height: 46,
  borderRadius: "50%",
  background: "rgba(0,0,0,.12)",
  display: "grid",
  placeItems: "center",
};

const icon: React.CSSProperties = {
  fontSize: 24,
};

const onlineDot: React.CSSProperties = {
  position: "absolute",
  top: 2,
  right: 2,
  width: 11,
  height: 11,
  borderRadius: "50%",
  background: "#22c55e",
  border: "2px solid white",
};

const text: React.CSSProperties = {
  display: "grid",
  lineHeight: 1.2,
  color: "#05060f",
};
