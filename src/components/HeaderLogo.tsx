import { Pressable } from 'react-native';

import Logo from './Logo';
import { goToEventsHome } from '../navigation/navigationRef';
import { tr } from '../i18n';

/**
 * Logo-ul din bara de sus a tab-urilor: apăsat, duce la Evenimente (sau sus, dacă ești deja acolo).
 * Arată la fel ca logo-ul; doar se estompează ușor cât îl apeși.
 */
export default function HeaderLogo({ label }: { label: string }) {
  return (
    <Pressable
      onPress={goToEventsHome}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={tr('Du-mă la Evenimente')}
      style={({ pressed }) => [{ alignSelf: 'flex-start' }, pressed && { opacity: 0.6 }]}
    >
      <Logo height={30} accessibilityLabel={label} />
    </Pressable>
  );
}
