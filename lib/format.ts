export function money(value?: number) {
  return `₺${Number(value || 0).toLocaleString('tr-TR')}`;
}

export function now() {
  return new Date().toISOString();
}

export function formatDate(value?: string) {
  if (!value) return 'Tarih yok';
  try {
    return new Date(value).toLocaleString('tr-TR');
  } catch {
    return value;
  }
}
