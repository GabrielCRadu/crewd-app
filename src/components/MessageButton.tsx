import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';

import { tr } from '../i18n';
import { colors, onThemeChange } from '../theme/colors';
import { glass, radii } from '../theme/shape';

/**
 * „Mesaj”, lângă butonul de prietenie (doar pentru prieteni): deschide conversația directă cu persoana,
 * în tab-ul Chat. Dacă există deja, se deschide aceeași; altfel începe una nouă, la primul mesaj.
 */
export default function MessageButton({ personId }: { personId: string }) {
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>();
  // Ecranele de profil stau în stivele tab-urilor; părintele lor e bara de tab-uri.
  const open = () =>
    (navigation.getParent() ?? navigation).navigate('Chats', { screen: 'DirectChat', params: { personId }, initial: false });

  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
      <Ionicons name="chatbubble-outline" size={18} color={colors.text} />
      <Text style={styles.text}>{tr('Mesaj')}</Text>
    </Pressable>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    pill: {
      ...glass,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderRadius: radii.pill,
    },
    text: { color: colors.text, fontSize: 15, fontWeight: '600' },
    pressed: { opacity: 0.75 },
  });

let styles = makeStyles();
// Tema se poate schimba din mers (Setări → Temă): stilurile se refac din noile culori.
onThemeChange(() => {
  styles = makeStyles();
});
