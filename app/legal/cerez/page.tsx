export default function CerezPage() {
  return (
    <main style={page}>
      <section style={card}>
        <h1>Çerez Politikası</h1>

        <p>
          GameCentral kullanıcı deneyimini geliştirmek amacıyla çerez
          teknolojilerinden yararlanabilir.
        </p>

        <h2>Kullanılan Çerezler</h2>

        <ul>
          <li>Oturum Çerezleri</li>
          <li>Güvenlik Çerezleri</li>
          <li>Tercih Çerezleri</li>
          <li>Analitik Çerezler</li>
        </ul>

        <h2>Çerez Yönetimi</h2>

        <p>
          Kullanıcılar tarayıcı ayarlarından çerez tercihlerini değiştirebilir.
        </p>
      </section>
    </main>
  );
}

const page = {
  minHeight: "100vh",
  background: "#05060f",
  color: "white",
  padding: 40,
};

const card = {
  maxWidth: 1100,
  margin: "0 auto",
  background: "#0f172a",
  padding: 35,
  borderRadius: 24,
  lineHeight: 1.9,
};