/** Cine poate vedea o amintire. */
export type MemoryVisibility = 'everyone' | 'friends';

/**
 * O amintire: o poză de la un eveniment la care ai fost.
 * Numele și data evenimentului se păstrează în amintire, ca grila să le poată arăta
 * și când evenimentul nu mai e în lista încărcată.
 */
export interface Memory {
  id: string;
  /** Al cui e (uid; în mock: ME_ID sau id-ul persoanei). */
  ownerId: string;
  eventId: string;
  eventTitle: string;
  eventDate: Date;
  /** Poza: fișier local (adăugată de tine) sau URL (mock). */
  photoUri: string;
  visibility: MemoryVisibility;
  createdAt: Date;
}

/** Cine se uită la amintirile cuiva. */
export interface MemoryViewer {
  /** E propriul profil. */
  isOwner: boolean;
  /** E prieten cu proprietarul. */
  isFriend: boolean;
}
