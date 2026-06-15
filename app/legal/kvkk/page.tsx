export default function KvkkPage() {
  return (
    <main style={page}>
      <section style={card}>
        <h1>KVKK Aydınlatma Metni</h1>
        <p>
          GameCentral, kullanıcı verilerini 6698 sayılı Kişisel Verilerin
          Korunması Kanunu kapsamında işler.
        </p>

        <h2>İşlenen Veriler</h2>
        <p>
          E-posta adresi, kullanıcı adı, profil bilgileri, ilan bilgileri,
          destek talepleri, mesajlaşma kayıtları ve teknik oturum bilgileri
          işlenebilir.
        </p>

        <h2>İşleme Amaçları</h2>
        <p>
          Üyelik yönetimi, ilan süreçleri, güvenlik, destek talepleri,
          şikayetlerin incelenmesi ve platform hizmetlerinin sunulması.
        </p>

        <h2>Başvuru Hakları</h2>
        <p>
          Kullanıcılar KVKK kapsamındaki hakları için GameCentral iletişim
          kanalları üzerinden başvuru yapabilir.
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
  maxWidth: 900,
  margin: "0 auto",
  background: "#0f172a",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 24,
  padding: 34,
  lineHeight: 1.8,
};