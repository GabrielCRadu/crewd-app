import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Aurora from '../components/Aurora';
import Avatar from '../components/Avatar';
import GlassIconButton from '../components/GlassIconButton';
import { MESSAGES } from '../data/mockSocial';
import { useEvents } from '../hooks/useEvents';
import { useMyGroups } from '../hooks/useMyGroups';
import { useUserLocation } from '../hooks/useUserLocation';
import { formatDay, formatTime } from '../utils/dates';
import { canOpenChat } from '../utils/groupRules';
import { useAuth } from '../context/AuthContext';
import { leaveGroup } from '../services/groupsService';
import type { ChatsStackParamList } from '../navigation/chatsTypes';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import type { ChatMessage } from '../types/social';

type Props = NativeStackScreenProps<ChatsStackParamList, 'ChatRoom'>;

/**
 * Conversația unui grupuleț: antet, banner „Ne vedem” (ora și locul din grupuleț), mesaje, bara de scriere
 * (docs/layout-guide.md). Mesajele sunt încă mock (vezi todo.md).
 */
export default function ChatRoomScreen({ navigation, route }: Props) {
  const { groups, loading } = useMyGroups();
  const { user, profile } = useAuth();
  const location = useUserLocation();
  const { events } = useEvents(location.coords);
  const group = groups.find((g) => g.id === route.params.groupId) ?? null;
  const event = events.find((e) => e.id === route.params.eventId) ?? null;
  const [messages, setMessages] = useState<ChatMessage[]>(MESSAGES[route.params.groupId] ?? []);
  const [draft, setDraft] = useState('');

  // Încă se încarcă, nu mai ești în grupuleț, sau grupulețul nu s-a format: mesaj + „înapoi”, nu ecran gol.
  if (!group || !canOpenChat(group)) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top', 'bottom']}>
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            <Text style={styles.emptyText}>
              {group ? 'Chat-ul se deschide când grupulețul are cel puțin 3 persoane.' : 'Nu mai ești în acest grupuleț.'}
            </Text>
            <Pressable onPress={() => navigation.goBack()} style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>Înapoi</Text>
            </Pressable>
          </>
        )}
      </SafeAreaView>
    );
  }

  // Ieși din grupuleț din conversație: rămâi înscris la eveniment.
  const confirmLeave = () => {
    const uid = user?.uid ?? profile?.uid;
    if (!uid) return;
    Alert.alert('Ieși din grupuleț?', 'Rămâi înscris la eveniment și poți alege alt grupuleț.', [
      { text: 'Rămân', style: 'cancel' },
      {
        text: 'Ies',
        style: 'destructive',
        onPress: () => {
          leaveGroup(group.eventId, group.id, uid)
            .then(() => navigation.goBack())
            .catch((e: Error) => Alert.alert('Nu ai ieșit din grupuleț', e.message));
        },
      },
    ]);
  };

  // „Pe hartă”: deschide locul evenimentului în aplicația de hărți (Google Maps / Apple Maps).
  const openMap = () => {
    const query = event
      ? `${event.location.latitude},${event.location.longitude}`
      : encodeURIComponent(group.meetupPlace);
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { id: `local-${Date.now()}`, author: null, text }]);
    setDraft('');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <GlassIconButton icon="chevron-back" size={40} onPress={() => navigation.goBack()} />
        <View style={styles.headerText}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {event?.title ?? 'Grupuleț'}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {group.memberUids.length} persoane ·{' '}
            {Object.values(group.members)
              .map((m) => m.name)
              .join(', ')}
          </Text>
        </View>
        <GlassIconButton icon="exit-outline" size={40} onPress={confirmLeave} />
      </View>

      <View style={styles.banner}>
        <Aurora style={StyleSheet.absoluteFill} />
        <View style={styles.bannerScrim} />
        <Ionicons name="location-outline" size={22} color={colors.text} />
        <View style={styles.bannerText}>
          <Text style={styles.bannerLabel}>NE VEDEM</Text>
          <Text style={styles.bannerWhen}>
            {formatDay(group.meetupAt)} la {formatTime(group.meetupAt)} · {group.meetupPlace}
          </Text>
        </View>
        <Pressable onPress={openMap} style={styles.bannerButton}>
          <Text style={styles.bannerButtonText}>Pe hartă</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          style={styles.flex}
          contentContainerStyle={styles.messages}
          data={messages}
          keyExtractor={(m) => m.id}
          ListHeaderComponent={<Text style={styles.day}>Azi</Text>}
          renderItem={({ item, index }) => {
            const isMine = item.author === null;
            const showName = !isMine && messages[index - 1]?.author !== item.author;
            return (
              <View style={[styles.messageRow, isMine && styles.messageRowMine]}>
                {!isMine ? <Avatar name={item.author!} size={30} /> : null}
                <View style={styles.messageBody}>
                  {showName ? <Text style={styles.author}>{item.author}</Text> : null}
                  <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
                    <Text style={[styles.bubbleText, isMine && styles.bubbleTextMine]}>{item.text}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Scrie un mesaj…"
            placeholderTextColor={colors.muted}
            style={styles.input}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable onPress={send} style={({ pressed }) => [styles.sendButton, pressed && styles.pressed]}>
            <Ionicons name="arrow-up" size={22} color={colors.onLight} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  emptyText: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  headerSubtitle: { fontSize: 12, color: colors.muted },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 16,
    padding: 16,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  bannerScrim: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(11,10,16,0.35)' },
  bannerText: { flex: 1 },
  bannerLabel: { color: colors.text, fontSize: 11, fontWeight: '600', letterSpacing: 0.8, opacity: 0.8 },
  bannerWhen: { color: colors.text, fontSize: 16, fontWeight: '600' },
  bannerButton: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radii.pill, backgroundColor: colors.text },
  bannerButtonText: { color: colors.onLight, fontWeight: '600', fontSize: 13 },
  messages: { paddingHorizontal: 16, paddingBottom: 12, gap: 10, flexGrow: 1, justifyContent: 'flex-end' },
  day: { alignSelf: 'center', color: colors.faint, fontSize: 12, marginBottom: 4 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '85%' },
  messageRowMine: { alignSelf: 'flex-end' },
  messageBody: { flexShrink: 1, gap: 4 },
  author: { color: colors.muted, fontSize: 12, fontWeight: '500' },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
  bubbleOther: { ...glass, borderBottomLeftRadius: 6 },
  bubbleMine: { backgroundColor: colors.text, borderBottomRightRadius: 6 },
  bubbleText: { color: colors.text, fontSize: 15 },
  bubbleTextMine: { color: colors.onLight },
  pressed: { opacity: 0.85 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    ...glass,
    flex: 1,
    color: colors.text,
    borderRadius: radii.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text,
  },
});
