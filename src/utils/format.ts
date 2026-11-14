import { tr } from '../i18n';
/** Ex: „Maria merge”, „Maria și Andrei merg și ei”, „Maria, Andrei și încă 2 merg și ei”. */
export function formatFriendsGoing(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return `${names[0]} merge`;
  if (names.length <= 3) return tr('{p} și {p2} merg și ei', { p: names.slice(0, -1).join(', '), p2: names[names.length - 1] });
  return tr('{p} și încă {p2} merg și ei', { p: names.slice(0, 2).join(', '), p2: names.length - 2 });
}

/** După eveniment. Ex: „Ai fost cu Maria”, „Ai fost cu Maria și Andrei”. */
export function formatWentWith(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return tr('Ai fost cu {p}', { p: names[0] });
  return tr('Ai fost cu {p} și {p2}', { p: names.slice(0, -1).join(', '), p2: names[names.length - 1] });
}
