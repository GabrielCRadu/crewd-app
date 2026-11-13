/** În română spunem „20 de prieteni”, dar „5 prieteni”. */
function withDe(n: number): string {
  const rest = n % 100;
  return n >= 20 && (rest === 0 || rest >= 20) ? `${n} de` : `${n}`;
}

/** Ex: „150 lei”, „Gratuit” sau '' dacă nu știm prețul. */
export function formatPrice(price: number | null): string {
  if (price === null) return '';
  if (price === 0) return 'Gratuit';
  return `${price} lei`;
}

/** Ex: „3 prieteni merg · 5 caută cu cine să meargă”. */
export function formatSocial(friendsCount: number, lookingCount: number): string {
  const parts: string[] = [];
  if (friendsCount === 1) parts.push('1 prieten merge');
  else if (friendsCount > 1) parts.push(`${withDe(friendsCount)} prieteni merg`);

  if (lookingCount === 1) parts.push('1 persoană caută companie');
  else if (lookingCount > 1) parts.push(`${withDe(lookingCount)} caută cu cine să meargă`);

  return parts.join(' · ');
}
