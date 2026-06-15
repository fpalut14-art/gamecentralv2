export default function GizlilikPage() {
  return (
    <main style={page}>
      <section style={card}>
        <h1>Gizlilik Politikası</h1>

        <p>
          GameCentral kullanıcı bilgilerinin gizliliğini korumayı taahhüt eder.
        </p>

        <h2>Toplanan Veriler</h2>

        <ul>
          <li>Üyelik Bilgileri</li>
          <li>İlan Bilgileri</li>
          <li>Mesajlaşma Verileri</li>
          <li>IP ve Oturum Verileri</li>
        </ul>

        <h2>Verilerin Korunması</h2>

        <p>
          Veriler yetkisiz erişimlere karşı korunur ve yalnızca hizmet
          sunumu amacıyla kullanılır.
        </p>

        <h2>Üçüncü Taraflar</h2>

        <p>
          Yasal zorunluluklar dışında kullanıcı verileri üçüncü kişilerle
          paylaşılmaz.
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