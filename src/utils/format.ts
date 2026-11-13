/** Ex: „Maria merge”, „Maria și Andrei merg și ei”, „Maria, Andrei și încă 2 merg și ei”. */
export function formatFriendsGoing(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return `${names[0]} merge`;
  if (names.length <= 3) return `${names.slice(0, -1).join(', ')} și ${names[names.length - 1]} merg și ei`;
  return `${names.slice(0, 2).join(', ')} și încă ${names.length - 2} merg și ei`;
}
