"use client";

import { useState } from "react";

export default function MobileTestPage() {
  const [status, setStatus] = useState("HAZIR");

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#050505",
        color: "#fff",
        padding: 30,
      }}
    >
      <h1>MOBILE TEST</h1>
      <p>{status}</p>

      <button
        type="button"
        onClick={() => setStatus("BUTON ÇALIŞTI")}
        style={{
          width: "100%",
          height: 60,
          fontSize: 20,
        }}
      >
        TEST BUTONU
      </button>
    </main>
  );
}