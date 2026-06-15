export default function YasakliUrunlerPage() {
  return (
    <main style={page}>
      <section style={card}>
        <h1>Yasaklı Ürünler Politikası</h1>

        <p>
          GameCentral üzerinde kullanıcı güvenliğini, yasal uyumu ve platform
          kalitesini korumak amacıyla bazı ürün ve hizmetlerin ilan edilmesi
          yasaktır.
        </p>

        <h2>1. Yasadışı Ürünler</h2>
        <p>
          Türkiye Cumhuriyeti mevzuatına aykırı her türlü ürün, hizmet, içerik
          veya dijital varlık ilanı yasaktır.
        </p>

        <h2>2. Çalıntı veya Sahte Ürünler</h2>
        <ul>
          <li>Çalıntı olduğu bilinen veya şüphelenilen ürünler</li>
          <li>Sahte marka ürünleri</li>
          <li>Taklit lisans anahtarları</li>
          <li>Faturasız ve kaynağı belirsiz ticari ürünler</li>
        </ul>

        <h2>3. Lisanssız Dijital İçerikler</h2>
        <p>
          Korsan yazılım, kırılmış oyun, izinsiz lisans anahtarı, yetkisiz dijital
          ürün veya telif hakkı ihlali oluşturan içerikler yasaktır.
        </p>

        <h2>4. Hesap Satışı Riskleri</h2>
        <p>
          Oyun hesabı, sosyal medya hesabı veya üçüncü taraf platform hesaplarının
          satışında ilgili platformların kullanım şartları ihlal edilebilir.
          GameCentral bu tür ilanları inceleyebilir, kısıtlayabilir veya kaldırabilir.
        </p>

        <h2>5. Tehlikeli veya Regüle Ürünler</h2>
        <p>
          Silah, patlayıcı, tehlikeli kimyasal, yasa dışı elektronik cihaz,
          kişisel verileri ele geçirmeye yönelik araçlar ve benzeri ürünler
          yasaktır.
        </p>

        <h2>6. Yanıltıcı Hizmetler</h2>
        <ul>
          <li>Hile yazılımı</li>
          <li>Ban garantisi olmayan hesap yükseltme vaatleri</li>
          <li>Kimlik avı veya phishing hizmetleri</li>
          <li>Bot, spam veya sahte trafik hizmetleri</li>
        </ul>

        <h2>7. İhlal Durumunda</h2>
        <p>
          GameCentral, yasaklı ürün veya hizmet ilanlarını kaldırabilir, hesabı
          askıya alabilir ve gerekli görülürse ilgili kurumlarla paylaşım yapabilir.
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