import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Avatar from '../Avatar';
import EventPoster from './EventPoster';
import { useFriends } from '../../hooks/useFriends';
import { sendEventToFriend } from '../../services/directMessagesService';
import { idsWithStatus } from '../../services/friendsService';
import { getPerson } from '../../services/peopleService';
import { colors } from '../../theme/colors';
import { glass, radii } from '../../theme/shape';
import type { Event } from '../../types/events';
import type { Person } from '../../types/social';
import { formatEventDate } from '../../utils/dates';

interface Props {
  event: Event;
  visible: boolean;
  onClose: () => void;
  /** După trimitere (ex. deschide conversația cu prietenul). */
  onSent: (personId: string) => void;
}

/**
 * Foaia de jos „Trimite unui prieten”: evenimentul (afiș mic), un mesaj opțional și lista
 * prietenilor. Apeși pe un prieten și evenimentul ajunge în conversația voastră directă.
 */
export default function ShareEventSheet({ event, visible, onClose, onSent }: Props) {
  const insets = useSafeAreaInsets();
  const friends = useFriends();
  const [note, setNote] = useState('');

  const people = useMemo(
    () =>
      idsWithStatus(friends, 'friends')
        .map(getPerson)
        .filter((p): p is Person => p !== undefined)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [friends],
  );

  const send = async (personId: string) => {
    await sendEventToFriend(personId, event.id, note);
    setNote('');
    onSent(personId);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Închide" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>Trimite unui prieten</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Închide">
              <Ionicons name="close" size={22} color={colors.muted} />
            </Pressable>
          </View>

          {/* Evenimentul care se trimite */}
          <View style={styles.eventRow}>
            <EventPoster imageUrl={event.imageUrl} category={event.category} iconSize={18} style={styles.poster} />
            <View style={styles.eventText}>
              <Text style={styles.eventTitle} numberOfLines={1}>
                {event.title}
              </Text>
              <Text style={styles.muted}>{formatEventDate(event.startsAt)}</Text>
            </View>
          </View>

          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Adaugă un mesaj (opțional)"
            placeholderTextColor={colors.faint}
            selectionColor={colors.text}
            maxLength={200}
            style={styles.input}
          />

          <Text style={styles.label}>PRIETENII TĂI</Text>
          {people.length === 0 ? (
            <Text style={styles.muted}>Încă nu ai prieteni. Adaugă oameni din profilul lor.</Text>
          ) : (
            <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
              {people.map((p) => (
                <Pressable key={p.id} onPress={() => send(p.id)} style={({ pressed }) => [styles.friend, pressed && styles.pressed]}>
                  <Avatar name={p.name} size={42} photoUrl={p.photoUrl} />
                  <Text style={styles.friendName}>{p.name}</Text>
                  <View style={styles.sendPill}>
                    <Ionicons name="paper-plane" size={14} color={colors.onLight} />
                    <Text style={styles.sendText}>Trimite</Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopLeftRadius: radii.card,
    borderTopRightRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: radii.pill, backgroundColor: colors.cardStrong },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  poster: { width: 52, height: 52, borderRadius: radii.inner },
  eventText: { flex: 1, gap: 2 },
  eventTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  input: { ...glass, height: 46, paddingHorizontal: 16, borderRadius: radii.pill, fontSize: 15, color: colors.text },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 1.6, color: colors.muted },
  list: { maxHeight: 280 },
  listContent: { gap: 8 },
  friend: { ...glass, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radii.card },
  pressed: { backgroundColor: colors.cardStrong },
  friendName: { flex: 1, fontSize: 16, fontWeight: '600', color: colors.text },
  sendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.text,
  },
  sendText: { color: colors.onLight, fontSize: 13, fontWeight: '600' },
});
