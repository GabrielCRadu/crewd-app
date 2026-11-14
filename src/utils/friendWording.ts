import type { Gender } from '../types/user';

/** Textele ferestrei de confirmare „elimină din prieteni”. */
export interface RemoveFriendWording {
  title: string;
  message: string;
  /** Eticheta butonului care confirmă. */
  confirm: string;
}

const MESSAGE = 'Nu vă veți mai vedea evenimentele la care mergeți.';

/**
 * Cum întrebăm înainte de a elimina un prieten, după genul ales de persoana respectivă în profilul ei:
 * „prietena” pentru femei, „prietenul” pentru bărbați. Pentru „Altul” sau când nu știm genul,
 * formularea e neutră, ca să nu presupunem nimic.
 */
export function removeFriendWording(gender: Gender | null | undefined): RemoveFriendWording {
  if (gender === 'female') {
    return { title: 'Vrei să îți elimini prietena?', message: MESSAGE, confirm: 'Elimină prietena' };
  }
  if (gender === 'male') {
    return { title: 'Vrei să îți elimini prietenul?', message: MESSAGE, confirm: 'Elimină prietenul' };
  }
  return { title: 'Vrei să elimini această persoană din prieteni?', message: MESSAGE, confirm: 'Elimină din prieteni' };
}
