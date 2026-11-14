import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import GlassBadge from '../events/GlassBadge';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/shape';
import type { Memory } from '../../types/memories';
import { formatShortDate } from '../../utils/dates';
import { isSharedMemory } from '../../utils/memoryRules';
import { tr } from '../../i18n';

interface Props {
  /** Amintirile, deja filtrate și ordonate. */
  memories: Memory[];
  /** Evenimentele la care ați fost amândoi: amintirile de la ele primesc eticheta „Împreună”. */
  sharedEventIds?: string[];
  /** Pe profilul tău: arată un lacăt pe amintirile „doar prieteni”. */
  showVisibility?: boolean;
  onOpen: (memory: Memory) => void;
}

/** Grila de amintiri de pe profil: poze pătrate pe două coloane, cu numele evenimentului și data dedesubt. */
export default function MemoriesGrid({ memories, sharedEventIds = [], showVisibility = false, onOpen }: Props) {
  return (
    <View style={styles.grid}>
      {memories.map((memory) => (
        <Pressable
          key={memory.id}
          onPress={() => onOpen(memory)}
          accessibilityRole="imagebutton"
          accessibilityLabel={tr('Amintire de la {eventTitle}', { eventTitle: memory.eventTitle })}
          style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
        >
          <View style={styles.photoFrame}>
            <Image source={{ uri: memory.photoUri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            {isSharedMemory(memory, sharedEventIds) ? (
              <View style={styles.topLeft}>
                <GlassBadge icon="people" label={tr('Împreună')} />
              </View>
            ) : null}
            {showVisibility && memory.visibility === 'friends' ? (
              <View style={styles.lock}>
                <Ionicons name="lock-closed" size={12} color={colors.text} />
              </View>
            ) : null}
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {memory.eventTitle}
          </Text>
          <Text style={styles.date}>{formatShortDate(memory.eventDate)}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 16 },
  tile: { width: '48%', gap: 4 },
  pressed: { opacity: 0.8 },
  photoFrame: {
    aspectRatio: 1,
    marginBottom: 4,
    borderRadius: radii.inner,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  topLeft: { position: 'absolute', top: 8, left: 8 },
  lock: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontSize: 14, fontWeight: '600' },
  date: { color: colors.muted, fontSize: 12 },
});
