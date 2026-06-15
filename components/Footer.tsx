import Link from "next/link";
import React from "react";

export default function Footer() {
  return (
    <footer style={footer}>
      <div style={inner}>
        <div>
          <h2 style={logo}>
            GAME<span style={{ color: "#ffd400" }}>CENTRAL</span>
          </h2>

          <p style={desc}>
            Oyuncu ekipmanları, dijital ürünler ve gaming topluluğu için beta
            marketplace platformu.
          </p>
        </div>

        <div style={links}>
          <Link href="/legal/kvkk" style={link}>KVKK</Link>
          <Link href="/legal/gizlilik" style={link}>Gizlilik Politikası</Link>
          <Link href="/legal/cerez" style={link}>Çerez Politikası</Link>
          <Link href="/legal/kullanici-sozlesmesi" style={link}>Kullanıcı Sözleşmesi</Link>
          <Link href="/legal/topluluk-kurallari" style={link}>Topluluk Kuralları</Link>
          <Link href="/legal/yasakli-urunler" style={link}>Yasaklı Ürünler</Link>
          <Link href="/support" style={link}>Destek</Link>
          <Link href="/ad-request" style={link}>Reklam Ver</Link>
        </div>
      </div>

      <div style={bottom}>
        © {new Date().getFullYear()} GameCentral. Tüm hakları saklıdır.
      </div>
    </footer>
  );
}

const footer: React.CSSProperties = {
  marginTop: 60,
  background: "#03040a",
  borderTop: "1px solid rgba(255,255,255,0.08)",
  color: "white",
};

const inner: React.CSSProperties = {
  width: "min(1500px, calc(100% - 60px))",
  margin: "0 auto",
  padding: "42px 0",
  display: "grid",
  gridTemplateColumns: "1fr 2fr",
  gap: 30,
};

const logo: React.CSSProperties = {
  margin: 0,
  fontSize: 28,
  fontWeight: 900,
};

const desc: React.CSSProperties = {
  marginTop: 12,
  color: "#94a3b8",
  maxWidth: 420,
  lineHeight: 1.6,
};

const links: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 14,
};

const link: React.CSSProperties = {
  color: "#cbd5e1",
  textDecoration: "none",
  fontWeight: 800,
};

const bottom: React.CSSProperties = {
  borderTop: "1px solid rgba(255,255,255,0.06)",
  textAlign: "center",
  color: "#64748b",
  padding: 18,
};