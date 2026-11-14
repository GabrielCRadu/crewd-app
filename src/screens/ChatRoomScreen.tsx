import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Aurora from '../components/Aurora';
import GlassIconButton from '../components/GlassIconButton';
import MessageRow, { DayRow } from '../components/chat/MessageRow';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../hooks/useEvents';
import { useGroupMessages } from '../hooks/useGroupMessages';
import { useMyGroups } from '../hooks/useMyGroups';
import { useUserLocation } from '../hooks/useUserLocation';
import { isFirebaseConfigured } from '../lib/firebase';
import type { ChatsStackParamList } from '../navigation/chatsTypes';
import { LEFT_GROUP_MESSAGE, chatErrorMessage, sendGroupMessage } from '../services/chatService';
import { MOCK_UID } from '../services/groupsService';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import type { ChatRow } from '../types/chat';
import { MAX_MESSAGE_LENGTH, authorNameFor, buildChatRows, normalizeMessageText } from '../utils/chatRules';
import { formatDay, formatTime } from '../utils/dates';
import { canOpenChat } from '../utils/groupRules';

type Props = NativeStackScreenProps<ChatsStackParamList, 'ChatRoom'>;

/** Cât de aproape de capăt (în px) contează ca „ești jos” în conversație. */
const NEAR_BOTTOM_PX = 120;

/**
 * Conversația unui grup: antet (numele grupului deschide Detaliile), banner „Ne vedem”, mesajele din
 * Firestore în timp real, bara de scriere (docs/layout-guide.md, spec 2026-11-14-chat-grup-design.md).
 */
export default function ChatRoomScreen({ navigation, route }: Props) {
  const { eventId, groupId } = route.params;
  const { groups, loading } = useMyGroups();
  const { user, profile } = useAuth();
  const location = useUserLocation();
  const { events } = useEvents(location.coords);
  const { messages, error } = useGroupMessages(eventId, groupId);
  const [draft, setDraft] = useState('');
  const group = groups.find((g) => g.id === groupId) ?? null;
  const event = events.find((e) => e.id === eventId) ?? null;
  const uid = isFirebaseConfigured ? (user?.uid ?? null) : MOCK_UID;

  const members = group?.members;
  const rows = useMemo(() => buildChatRows(messages, uid ?? '', members ?? {}), [messages, uid, members]);

  // Lista coboară singură la ultimul mesaj: la deschidere, când trimiți și când vine un mesaj nou
  // cât timp ești deja jos (dacă ai urcat să citești mesaje mai vechi, nu te trage în jos).
  const listRef = useRef<FlatList<ChatRow>>(null);
  const nearBottom = useRef(true);
  const scrollAfterSend = useRef(false);
  useEffect(() => {
    nearBottom.current = true;
  }, [groupId]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    nearBottom.current = contentSize.height - (contentOffset.y + layoutMeasurement.height) < NEAR_BOTTOM_PX;
  };
  const scrollToBottomIfNeeded = () => {
    if (!nearBottom.current && !scrollAfterSend.current) return;
    scrollAfterSend.current = false;
    listRef.current?.scrollToEnd({ animated: true });
  };

  const leftGroup = error === LEFT_GROUP_MESSAGE;

  // Încă se încarcă, nu mai ești în grup, sau grupul nu s-a format: mesaj + „înapoi”, nu ecran gol.
  if (leftGroup || !group || !canOpenChat(group)) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]} edges={['top', 'bottom']}>
        {loading && !leftGroup ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <>
            <Text style={styles.emptyText}>
              {group && !leftGroup ? 'Chat-ul se deschide când grupul are cel puțin 3 persoane.' : LEFT_GROUP_MESSAGE}
            </Text>
            <Pressable onPress={() => navigation.goBack()} style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>Înapoi</Text>
            </Pressable>
          </>
        )}
      </SafeAreaView>
    );
  }

  // „Pe hartă”: deschide locul evenimentului în aplicația de hărți (Google Maps / Apple Maps).
  const openMap = () => {
    const query = event
      ? `${event.location.latitude},${event.location.longitude}`
      : encodeURIComponent(group.meetupPlace);
    void Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  const send = () => {
    const text = normalizeMessageText(draft);
    if (!text || !uid) return;
    setDraft('');
    // Mesajul tău apare imediat (scrierea locală a Firestore); lista coboară la el.
    scrollAfterSend.current = true;
    listRef.current?.scrollToEnd({ animated: true });
    sendGroupMessage(eventId, groupId, { uid, name: authorNameFor(group.members, uid, profile?.name ?? '') }, text).catch((e: unknown) => {
      // Textul nu se pierde: revine în câmp, ca să poți încerca din nou.
      setDraft((current) => current || text);
      Alert.alert('Mesajul nu s-a trimis', chatErrorMessage(e));
    });
  };

  const title = event?.title ?? 'Grup';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <GlassIconButton icon="chevron-back" size={40} onPress={() => navigation.goBack()} />
        <Pressable
          style={({ pressed }) => [styles.headerText, pressed && styles.pressed]}
          onPress={() => navigation.navigate('GroupDetails', { eventId, groupId })}
          accessibilityRole="button"
          accessibilityLabel={`${title}, detaliile grupului`}
          hitSlop={6}
        >
          <View style={styles.titleRow}>
            <Text style={[styles.headerTitle, styles.titleText]} numberOfLines={1}>
              {title}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.muted} />
          </View>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {group.memberUids.length} persoane{event ? ` · ${event.title}` : ''}
          </Text>
        </Pressable>
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

      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <FlatList
          ref={listRef}
          style={styles.flex}
          contentContainerStyle={styles.messages}
          data={rows}
          keyExtractor={(r) => r.key}
          renderItem={({ item }) => (item.kind === 'day' ? <DayRow label={item.label} /> : <MessageRow row={item} />)}
          onScroll={onScroll}
          scrollEventThrottle={100}
          onContentSizeChange={scrollToBottomIfNeeded}
          onLayout={scrollToBottomIfNeeded}
          keyboardShouldPersistTaps="handled"
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
            maxLength={MAX_MESSAGE_LENGTH}
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
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  titleText: { flexShrink: 1 },
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
  messages: { paddingHorizontal: 16, paddingBottom: 12, gap: 6, flexGrow: 1, justifyContent: 'flex-end' },
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
