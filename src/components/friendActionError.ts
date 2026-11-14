import { Alert } from 'react-native';

import { tr } from '../i18n';
import { FriendRequestError } from '../services/friendsService';

/**
 * Spune de ce n-a mers o acțiune de prietenie pe un cont real (starea revine singură la ce știe serverul).
 * Cererea anulată între timp de celălalt („not-found”) primește un mesaj al ei.
 */
export function showFriendActionError(e: unknown): void {
  const code = (e as { code?: string } | null)?.code;
  const message =
    e instanceof FriendRequestError
      ? e.message
      : code === 'not-found'
        ? tr('Cererea nu mai există.')
        : tr('Nu a mers. Verifică conexiunea și încearcă din nou.');
  Alert.alert(tr('Prietenie'), message);
}
