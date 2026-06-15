export default function ToplulukKurallariPage() {
  return (
    <main style={page}>
      <section style={card}>
        <h1>Topluluk Kuralları</h1>

        <p>
          GameCentral, güvenli, saygılı ve sürdürülebilir bir oyuncu pazaryeri
          oluşturmayı hedefler. Tüm kullanıcıların aşağıdaki kurallara uyması
          gerekir.
        </p>

        <h2>1. Saygılı İletişim</h2>
        <p>
          Kullanıcılar birbirlerine karşı saygılı davranmalıdır. Hakaret, tehdit,
          aşağılama, taciz, nefret söylemi ve saldırgan iletişim yasaktır.
        </p>

        <h2>2. Sahte İlan Yasağı</h2>
        <p>
          Gerçek dışı ürün bilgisi, sahte görsel, yanıltıcı fiyat veya stokta
          olmayan ürün ilanı yayınlamak yasaktır.
        </p>

        <h2>3. Dolandırıcılık Yasağı</h2>
        <p>
          Kullanıcıları yanıltmaya, haksız para almaya veya ürün teslim etmeden
          ödeme talep etmeye yönelik davranışlar yasaktır.
        </p>

        <h2>4. Spam ve Rahatsız Edici Mesajlar</h2>
        <p>
          Aynı mesajın tekrar tekrar gönderilmesi, reklam amaçlı rahatsız edici
          iletişim kurulması veya kullanıcıların izinsiz yönlendirilmesi yasaktır.
        </p>

        <h2>5. Platform Dışı Riskli Yönlendirme</h2>
        <p>
          Kullanıcıların güvenliğini riske atacak şekilde şüpheli bağlantılara,
          sahte ödeme sayfalarına veya kimlik avı içeriklerine yönlendirme yapmak
          yasaktır.
        </p>

        <h2>6. Şikayet ve Raporlama</h2>
        <p>
          Kullanıcılar şüpheli ilan, kullanıcı veya sohbetleri rapor edebilir.
          GameCentral, raporları inceleyerek gerekli aksiyonları alabilir.
        </p>

        <h2>7. Yaptırımlar</h2>
        <ul>
          <li>İlan kaldırma</li>
          <li>Geçici hesap kısıtlama</li>
          <li>Kalıcı hesap kapatma</li>
          <li>Gerekli hallerde resmi makamlara bildirim</li>
        </ul>
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