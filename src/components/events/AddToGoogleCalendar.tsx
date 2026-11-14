import { Alert, Linking, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import { glass, radii } from '../../theme/shape';
import type { Event } from '../../types/events';
import { googleCalendarUrl } from '../../utils/googleCalendar';

/** Deschide Google Calendar (aplicația sau site-ul) cu evenimentul completat, gata de salvat. */
export async function openInGoogleCalendar(event: Event): Promise<void> {
  try {
    await Linking.openURL(googleCalendarUrl(event));
  } catch {
    Alert.alert('Nu am putut deschide Google Calendar', 'Verifică dacă ai un browser sau aplicația Google Calendar.');
  }
}

interface Props {
  event: Event;
  /** Doar iconița (în lista din „Calendarul meu”), fără text. */
  compact?: boolean;
}

/** Butonul „Adaugă în Google Calendar”: pastilă secundară sau, compact, o iconiță rotundă. */
export default function AddToGoogleCalendar({ event, compact = false }: Props) {
  return (
    <Pressable
      onPress={() => void openInGoogleCalendar(event)}
      hitSlop={compact ? 8 : 0}
      accessibilityRole="button"
      accessibilityLabel={`Adaugă ${event.title} în Google Calendar`}
      style={({ pressed }) => [compact ? styles.icon : styles.pill, pressed && styles.pressed]}
    >
      <Ionicons name="logo-google" size={compact ? 15 : 17} color={colors.text} />
      {compact ? null : <Text style={styles.label}>Adaugă în Google Calendar</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    ...glass,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: radii.pill,
  },
  icon: {
    ...glass,
    width: 34,
    height: 34,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { color: colors.text, fontSize: 15, fontWeight: '500' },
  pressed: { backgroundColor: colors.cardStrong },
});
