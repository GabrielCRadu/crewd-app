import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Chip from '../Chip';
import FormMessage from '../FormMessage';
import GradientButton from '../GradientButton';
import SegmentedControl from '../SegmentedControl';
import { addMemory } from '../../services/memoriesService';
import { PhotoPermissionError, pickMemoryPhoto } from '../../services/photoService';
import type { PhotoSource } from '../../services/photoService';
import { colors, onThemeChange } from '../../theme/colors';
import { glass, radii } from '../../theme/shape';
import { type } from '../../theme/typography';
import type { Event } from '../../types/events';
import type { MemoryVisibility } from '../../types/memories';
import { formatShortDate } from '../../utils/dates';
import { tr } from '../../i18n';

interface Props {
  visible: boolean;
  /** Evenimentele la care ai fost și s-au terminat: doar la ele poți adăuga amintiri. */
  events: Event[];
  /** Evenimentul ales dinainte (când deschizi foaia de pe un eveniment anume). */
  initialEventId?: string | null;
  onClose: () => void;
}

/**
 * Foaia de jos „Adaugă amintire”: alegi evenimentul, poza (galerie sau cameră) și cine o vede.
 * Amintește să nu pui fețele altora fără acordul lor.
 */
export default function AddMemorySheet({ visible, events, initialEventId = null, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={tr('Închide')} />
      {/* Conținutul se montează la fiecare deschidere, ca foaia să pornească mereu goală. */}
      {visible ? <SheetContent events={events} initialEventId={initialEventId} onClose={onClose} /> : null}
    </Modal>
  );
}

function SheetContent({ events, initialEventId, onClose }: Omit<Props, 'visible'>) {
  const insets = useSafeAreaInsets();
  const [eventId, setEventId] = useState<string | null>(initialEventId ?? (events.length === 1 ? events[0]!.id : null));
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<MemoryVisibility>('everyone');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const event = events.find((e) => e.id === eventId) ?? null;

  const pick = async (source: PhotoSource) => {
    setError(null);
    try {
      const picked = await pickMemoryPhoto(source);
      if (picked) setPhotoUri(picked);
    } catch (e) {
      setError(e instanceof PhotoPermissionError ? e.message : tr('Nu am putut încărca poza.'));
    }
  };

  const save = async () => {
    if (!event || !photoUri) return;
    setSaving(true);
    await addMemory(event, photoUri, visibility);
    onClose();
  };

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.handle} />
      <View style={styles.header}>
        <Text style={styles.title}>{tr('Adaugă amintire')}</Text>
        <Pressable onPress={onClose} hitSlop={10} accessibilityLabel={tr('Închide')}>
          <Ionicons name="close" size={22} color={colors.muted} />
        </Pressable>
      </View>

      {events.length === 0 ? (
        <Text style={styles.muted}>{tr('Amintirile se adaugă la evenimentele la care ai fost. După primul eveniment terminat, îl găsești aici.')}</Text>
      ) : (
        <>
          <Text style={styles.label}>{tr('De la ce eveniment')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.events}>
            {events.map((e) => (
              <Chip
                key={e.id}
                label={`${e.title} · ${formatShortDate(e.startsAt)}`}
                active={e.id === eventId}
                onPress={() => setEventId(e.id)}
              />
            ))}
          </ScrollView>

          <Text style={styles.label}>{tr('Poza')}</Text>
          {photoUri ? (
            <View style={styles.previewRow}>
              <Image source={{ uri: photoUri }} style={styles.preview} resizeMode="cover" />
              <Pressable onPress={() => setPhotoUri(null)} hitSlop={8}>
                <Text style={styles.link}>{tr('Alege altă poză')}</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.sources}>
              <Pressable onPress={() => pick('library')} style={({ pressed }) => [styles.source, pressed && styles.pressed]}>
                <Ionicons name="images-outline" size={20} color={colors.text} />
                <Text style={styles.sourceText}>{tr('Din galerie')}</Text>
              </Pressable>
              <Pressable onPress={() => pick('camera')} style={({ pressed }) => [styles.source, pressed && styles.pressed]}>
                <Ionicons name="camera-outline" size={20} color={colors.text} />
                <Text style={styles.sourceText}>{tr('Fă o poză')}</Text>
              </Pressable>
            </View>
          )}

          <Text style={styles.label}>{tr('Cine o vede')}</Text>
          <SegmentedControl
            options={[
              { value: 'everyone', label: tr('Toți') },
              { value: 'friends', label: tr('Doar prietenii') },
            ]}
            value={visibility}
            onChange={setVisibility}
          />

          <View style={styles.notice}>
            <Ionicons name="people-outline" size={16} color={colors.text} />
            <Text style={styles.noticeText}>{tr('Nu pune poze în care se văd fețele altora fără acordul lor.')}</Text>
          </View>

          {error ? <FormMessage text={error} /> : null}

          <GradientButton
            label={tr('Adaugă amintirea')}
            icon="checkmark"
            onPress={save}
            disabled={!event || !photoUri}
            loading={saving}
          />
        </>
      )}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: colors.backdrop },
    sheet: {
      gap: 12,
      paddingHorizontal: 20,
      paddingTop: 10,
      borderTopLeftRadius: radii.card,
      borderTopRightRadius: radii.card,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: radii.pill, backgroundColor: colors.cardStrong },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { ...type.screenTitle, fontSize: 22 },
    label: { ...type.label, marginTop: 4 },
    muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
    events: { gap: 8 },
    sources: { flexDirection: 'row', gap: 10 },
    source: {
      ...glass,
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      height: 54,
      borderRadius: radii.pill,
    },
    sourceText: { color: colors.text, fontSize: 15, fontWeight: '500' },
    pressed: { backgroundColor: colors.cardStrong },
    previewRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    preview: { width: 96, height: 96, borderRadius: radii.inner, backgroundColor: colors.backgroundAlt },
    link: { color: colors.muted, fontSize: 14, textDecorationLine: 'underline' },
    notice: {
      ...glass,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: radii.inner,
    },
    noticeText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 18 },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
