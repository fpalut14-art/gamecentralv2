# GameCentral Vercel Yayın Rehberi

## Lokal Kontrol

```powershell
npm install
npx tsc --noEmit
npm run build
npm start
```

## Vercel Environment Variables

Vercel > Project > Settings > Environment Variables bölümüne şunları ekle:

```txt
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_SITE_URL=https://domainin.com
```

## Firebase

1. Authentication > Email/Password aktif olmalı.
2. Firestore Database açık olmalı.
3. `FIRESTORE_RULES.txt` içeriği Firestore Tüzük bölümüne yayınlanmalı.
4. Admin kullanıcı için `users/{uid}` altında `role: admin` olmalı.

## Faz 1 Beta Notu

Bu sürüm şirket kurmadan yayınlanabilir beta modelidir. Gerçek ödeme, komisyon veya escrow yoktur. Satın Al butonu sipariş talebi + sohbet başlatır.
