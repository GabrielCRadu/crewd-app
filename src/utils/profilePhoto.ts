import type { ProfileChanges } from '../types/user';

/**
 * Salvarea din „Editează profilul” aduce o poză nouă (sau o scoate)? „Editează profilul” trimite mereu
 * `photoUrl`, chiar și când schimbi doar descrierea: atunci nu refacem miniatura și nu rescriem grupurile.
 */
export function isNewPhoto(changes: ProfileChanges, currentPhotoUrl: string | null): boolean {
  return changes.photoUrl !== undefined && changes.photoUrl !== currentPhotoUrl;
}
