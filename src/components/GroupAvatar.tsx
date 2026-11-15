import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { colors, onThemeChange } from '../theme/colors';
import type { Event } from '../types/events';
import type { CrewGroup } from '../types/groups';
import { groupInitials, toneIndex } from '../utils/chatListRules';

interface Props {
  group: Pick<CrewGroup, 'photo'>;
  /** Evenimentul grupului (din useEvents, după group.eventId), pentru afiș; nu se salvează nicăieri. */
  event?: Pick<Event, 'imageUrl'> | null;
  /** Titlul afișat (al evenimentului), pentru inițiale și ton. */
  title: string;
  size?: number;
}

/**
 * Imaginea unui grup: poza grupului, altfel afișul evenimentului, altfel două inițiale
 * pe un gri închis ales după titlu (mereu același pentru același grup).
 */
export default function GroupAvatar({ group, event, title, size = 48 }: Props) {
  const uri = group.photo || event?.imageUrl || null;
  // Dacă poza nu se încarcă, rămân inițialele.
  const [failed, setFailed] = useState<string | null>(null);
  const box = { width: size, height: size, borderRadius: size * 0.3 };

  if (uri && failed !== uri) {
    return <Image source={{ uri }} resizeMode="cover" style={[box, styles.image]} onError={() => setFailed(uri)} />;
  }
  const tone = colors.groupTones[toneIndex(title, colors.groupTones.length)]!;
  return (
    <View style={[box, styles.base, { backgroundColor: tone }]}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{groupInitials(title)}</Text>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    base: { alignItems: 'center', justifyContent: 'center' },
    image: { backgroundColor: colors.backgroundAlt },
    text: { color: colors.groupToneText, fontWeight: '600' },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
