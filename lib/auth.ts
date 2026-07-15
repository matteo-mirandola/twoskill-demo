export function getValidAccessKeys(): string[] {
  const raw = process.env.ACCESS_KEYS ?? "";
  return raw
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

export function isValidAccessKey(key: string | null | undefined): boolean {
  if (!key) return false;
  return getValidAccessKeys().includes(key);
}
