# GameCentral Faz 1 Beta Production Entegrasyonu

## Yapılanlar

- Mevcut Next.js App Router ve Firebase yapısı korundu.
- Production mimarisi için `types`, `constants`, `lib` dosyaları güçlendirildi.
- `lib/env.ts` eklendi; Vercel public env değişkenleri merkezi hale getirildi.
- `app/robots.ts` ve `app/sitemap.ts` eklendi.
- `app/layout.tsx` SEO metadata/OpenGraph/Twitter kartları ile güncellendi.
- `Satın Al` akışı ödeme almayan beta sipariş talebi modeline çevrildi.
- Sipariş sonrası otomatik alıcı-satıcı chat oluşturma eklendi.
- Aynı alıcı/satıcı/ürün için mevcut chat varsa yeni chat açmadan mevcut chate yönlendirme eklendi.
- İlk sistem mesajı `messages` koleksiyonuna yazılıyor.
- Satıcıya yeni sipariş bildirimi gönderiliyor.
- Canlı destek kullanıcı sayfası `/support` tamamlandı.
- Admin canlı destek yönetimi `/admin/support` tamamlandı.
- Admin destek cevabı `support_messages` koleksiyonuna yazılıyor ve kullanıcıya bildirim gidiyor.
- Rapor/şikayet sistemi `/report` ve `/admin/reports` ile tamamlandı.
- Admin rapor durumları `reviewed`, `resolved`, `rejected` olarak yönetiliyor.
- Admin log kayıtları `logs` koleksiyonuna yazılıyor.
- Admin dashboard metrikleri geliştirildi.
- Satıcı paneli sipariş talepleri ve bilgi amaçlı gelir istatistiği ile güçlendirildi.
- Firestore rules Faz 1 beta akışına göre güncellendi.
- `npx tsc --noEmit` kontrolü başarıyla geçti.

## Ödeme Modeli

Faz 1 içinde gerçek ödeme, komisyon veya para tutma yoktur. `Satın Al` butonu beta sipariş talebi oluşturur ve alıcı-satıcı sohbetini başlatır.

## Kullanılan Firestore Koleksiyonları

- users
- products
- orders
- ads
- notifications
- logs
- chats
- messages
- support_tickets
- support_messages
- reports

## Yayın Notu

Vercel ortam değişkenleri `.env.example` dosyasındaki değerlere göre girilmelidir. Firebase Firestore Rules için `FIRESTORE_RULES.txt` içeriği Firebase Console > Firestore Database > Tüzük bölümüne yapıştırılmalıdır.
