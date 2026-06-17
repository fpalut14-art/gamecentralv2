export const env = {
  firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  firebaseStorageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  firebaseMessagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  firebaseAppId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://gamecentral.vercel.app',
};

export function checkPublicEnv() {
  const missing = Object.entries(env)
    .filter(([key, value]) => key !== 'siteUrl' && !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.warn(`Eksik public env değerleri: ${missing.join(', ')}`);
  }
}
