import { Alert, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import GlassIconButton from '../GlassIconButton';
import SegmentedControl from '../SegmentedControl';
import { deleteMemory, isMyMemory, setMemoryVisibility } from '../../services/memoriesService';
import { colors } from '../../theme/colors';
import type { Memory } from '../../types/memories';
import { formatLongDay } from '../../utils/dates';
import { tr } from '../../i18n';

interface Props {
  /** Amintirea deschisă; null = închis. */
  memory: Memory | null;
  onClose: () => void;
}

/**
 * O amintire deschisă mare, pe tot ecranul, cu numele evenimentului și data.
 * La amintirile tale poți schimba cine le vede și le poți șterge.
 */
export default function MemoryViewer({ memory, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const mine = memory ? isMyMemory(memory) : false;

  const confirmDelete = (target: Memory) =>
    Alert.alert(tr('Ștergi amintirea?'), tr('Poza dispare de pe profilul tău. Nu se poate anula.'), [
      { text: tr('Renunță'), style: 'cancel' },
      {
        text: tr('Șterge'),
        style: 'destructive',
        onPress: () => {
          void deleteMemory(target.id);
          onClose();
        },
      },
    ]);

  return (
    <Modal visible={memory !== null} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {memory ? (
        <View style={styles.screen}>
          <Image source={{ uri: memory.photoUri }} style={styles.photo} resizeMode="contain" />

          <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
            <GlassIconButton icon="close" round onPress={onClose} />
          </View>

          <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={styles.title}>{memory.eventTitle}</Text>
            <Text style={styles.meta}>{formatLongDay(memory.eventDate)}</Text>

            {mine ? (
              <>
                <Text style={styles.label}>{tr('Cine o vede')}</Text>
                <SegmentedControl
                  options={[
                    { value: 'everyone', label: tr('Toți') },
                    { value: 'friends', label: tr('Doar prietenii') },
                  ]}
                  value={memory.visibility}
                  onChange={(visibility) => void setMemoryVisibility(memory.id, visibility)}
                />
                <Pressable onPress={() => confirmDelete(memory)} hitSlop={8} style={styles.deleteButton}>
                  <Ionicons name="trash-outline" size={16} color={colors.nope} />
                  <Text style={styles.deleteText}>{tr('Șterge amintirea')}</Text>
                </Pressable>
              </>
            ) : memory.visibility === 'friends' ? (
              <View style={styles.visibilityRow}>
                <Ionicons name="lock-closed-outline" size={14} color={colors.muted} />
                <Text style={styles.meta}>{tr('Doar pentru prieteni')}</Text>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  photo: { flex: 1 },
  top: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 20 },
  bottom: { gap: 8, paddingHorizontal: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  title: { color: colors.text, fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  meta: { color: colors.muted, fontSize: 14 },
  label: { color: colors.muted, fontSize: 13, marginTop: 8 },
  visibilityRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'center', marginTop: 8, paddingVertical: 6 },
  deleteText: { color: colors.nope, fontSize: 14, fontWeight: '500' },
});
