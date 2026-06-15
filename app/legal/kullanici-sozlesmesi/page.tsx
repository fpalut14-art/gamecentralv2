export default function KullaniciSozlesmesiPage() {
  return (
    <main style={page}>
      <section style={card}>
        <h1>Kullanıcı Sözleşmesi</h1>

        <p>
          Bu sözleşme, GameCentral platformunu kullanan tüm üyeler için geçerlidir.
          Platforma kayıt olan veya platformu kullanan kullanıcılar bu şartları
          kabul etmiş sayılır.
        </p>

        <h2>1. Platformun Niteliği</h2>
        <p>
          GameCentral, oyuncu ekipmanları, dijital oyun ürünleri ve ilgili
          kategorilerde ilan yayınlama, kullanıcılar arasında iletişim kurma ve
          sipariş talebi oluşturma imkanı sağlayan beta marketplace platformudur.
        </p>

        <h2>2. Faz 1 Beta İşlem Modeli</h2>
        <p>
          Faz 1 aşamasında GameCentral ödeme almaz, para tutmaz, komisyon tahsil
          etmez ve escrow hizmeti sunmaz. Satın Al butonu yalnızca sipariş talebi
          oluşturur ve alıcı ile satıcı arasında sohbet başlatır.
        </p>

        <h2>3. Üyelik ve Hesap Güvenliği</h2>
        <p>
          Kullanıcı, hesap bilgilerinin doğruluğundan ve güvenliğinden sorumludur.
          Hesabın üçüncü kişiler tarafından kullanılmasından doğabilecek sonuçlar
          kullanıcıya aittir.
        </p>

        <h2>4. İlan Kuralları</h2>
        <ul>
          <li>Yanıltıcı, sahte veya eksik bilgi içeren ilan yayınlanamaz.</li>
          <li>Çalıntı, sahte, yasadışı veya lisanssız ürünler ilan edilemez.</li>
          <li>Ürün görselleri ve açıklamaları gerçeğe uygun olmalıdır.</li>
          <li>GameCentral, gerekli gördüğü ilanları kaldırabilir veya incelemeye alabilir.</li>
        </ul>

        <h2>5. Kullanıcılar Arası İşlemler</h2>
        <p>
          Faz 1 beta döneminde ödeme ve teslimat süreçleri kullanıcıların kendi
          aralarında belirleyeceği yöntemlerle gerçekleşir. GameCentral, kullanıcılar
          arasındaki ödeme, teslimat veya ürün uyuşmazlıklarında doğrudan taraf
          değildir.
        </p>

        <h2>6. Yasaklı Davranışlar</h2>
        <ul>
          <li>Dolandırıcılık girişimi</li>
          <li>Sahte hesap kullanımı</li>
          <li>Spam mesaj gönderimi</li>
          <li>Hakaret, tehdit veya taciz</li>
          <li>Yasadışı ürün veya hizmet tanıtımı</li>
        </ul>

        <h2>7. Hesap Kısıtlama ve Askıya Alma</h2>
        <p>
          GameCentral, platform güvenliğini korumak amacıyla şüpheli hesapları,
          sahte ilanları veya kurallara aykırı davranışları geçici ya da kalıcı
          olarak kısıtlayabilir.
        </p>

        <h2>8. Sorumluluk Sınırı</h2>
        <p>
          GameCentral, Faz 1 beta döneminde ilan ve iletişim altyapısı sağlar.
          Kullanıcılar arası para transferi, ürün teslimatı, kargo ve benzeri
          işlemlerden kullanıcılar sorumludur.
        </p>

        <h2>9. Değişiklik Hakkı</h2>
        <p>
          GameCentral, bu sözleşmede değişiklik yapma hakkını saklı tutar.
          Güncel metin platform üzerinde yayımlandığı anda geçerlilik kazanır.
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