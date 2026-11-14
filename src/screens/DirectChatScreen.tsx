import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Avatar from '../components/Avatar';
import GlassIconButton from '../components/GlassIconButton';
import EventPoster from '../components/events/EventPoster';
import { useDirectThreads } from '../hooks/useDirectThreads';
import { useEvents } from '../hooks/useEvents';
import { useUserLocation } from '../hooks/useUserLocation';
import type { ChatsStackParamList } from '../navigation/chatsTypes';
import { sendDirectText } from '../services/directMessagesService';
import type { DirectMessage } from '../services/directMessagesService';
import { getPerson } from '../services/peopleService';
import { colors, onThemeChange } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import type { Event } from '../types/events';
import { formatEventDate, formatTime } from '../utils/dates';
import { tr } from '../i18n';

type Props = NativeStackScreenProps<ChatsStackParamList, 'DirectChat'>;

/**
 * Conversația doar între tine și un prieten. Evenimentele trimise apar ca un card cu afiș;
 * apeși pe card și se deschide evenimentul. Antetul (poza, numele) deschide profilul prietenului.
 */
export default function DirectChatScreen({ navigation, route }: Props) {
  const { personId } = route.params;
  const person = getPerson(personId);
  const threads = useDirectThreads();
  const messages = threads[personId] ?? [];
  const location = useUserLocation();
  const { events } = useEvents(location.coords);
  const [draft, setDraft] = useState('');

  const send = () => {
    void sendDirectText(personId, draft);
    setDraft('');
  };

  // Evenimentul se deschide în tab-ul Evenimente, cu lista dedesubt pentru „înapoi”.
  const openEvent = (eventId: string) =>
    navigation.getParent()?.navigate('Events', { screen: 'EventDetails', params: { eventId }, initial: false });

  const renderMessage = ({ item }: { item: DirectMessage }) => {
    const event = item.eventId ? events.find((e) => e.id === item.eventId) : undefined;
    return (
      <View style={[styles.messageRow, item.fromMe && styles.messageRowMine]}>
        {event ? <EventCard event={event} onOpen={() => openEvent(event.id)} /> : null}
        {item.text ? (
          <View style={[styles.bubble, item.fromMe ? styles.bubbleMine : styles.bubbleOther]}>
            <Text style={[styles.bubbleText, item.fromMe && styles.bubbleTextMine]}>{item.text}</Text>
          </View>
        ) : null}
        <Text style={styles.time}>{formatTime(item.sentAt)}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <GlassIconButton icon="chevron-back" size={40} onPress={() => navigation.goBack()} />
        <Pressable
          onPress={() => navigation.navigate('PersonProfile', { personId })}
          style={({ pressed }) => [styles.headerPerson, pressed && styles.pressed]}
        >
          <Avatar name={person?.name ?? '?'} size={38} photoUrl={person?.photoUrl} />
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {person?.name ?? 'Prieten'}
            </Text>
            <Text style={styles.headerSubtitle}>{tr('Doar voi doi')}</Text>
          </View>
        </Pressable>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <FlatList
          style={styles.flex}
          contentContainerStyle={styles.messages}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderMessage}
          ListEmptyComponent={
            <Text style={styles.empty}>{person ? tr('Trimite-i lui {name} un eveniment sau un mesaj.', { name: person.name }) : tr('Trimite-i prietenului tău un eveniment sau un mesaj.')}</Text>
          }
        />

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={tr('Scrie un mesaj…')}
            placeholderTextColor={colors.muted}
            selectionColor={colors.text}
            style={styles.input}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <Pressable onPress={send} style={({ pressed }) => [styles.sendButton, pressed && styles.pressed]} accessibilityLabel={tr('Trimite')}>
            <Ionicons name="arrow-up" size={22} color={colors.onLight} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Un eveniment trimis în conversație: afișul, numele și data. */
function EventCard({ event, onOpen }: { event: Event; onOpen: () => void }) {
  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.eventCard, pressed && styles.pressed]}>
      <EventPoster imageUrl={event.imageUrl} category={event.category} style={styles.eventPoster} />
      <View style={styles.eventInfo}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.eventMeta}>
          {formatEventDate(event.startsAt)} · {event.venueName}
        </Text>
        <View style={styles.eventLink}>
          <Text style={styles.eventLinkText}>{tr('Vezi evenimentul')}</Text>
          <Ionicons name="arrow-forward" size={14} color={colors.text} />
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
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
    headerPerson: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerText: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
    headerSubtitle: { fontSize: 12, color: colors.muted },
    messages: { padding: 16, gap: 12, flexGrow: 1, justifyContent: 'flex-end' },
    empty: { alignSelf: 'center', textAlign: 'center', color: colors.muted, fontSize: 14 },
    messageRow: { alignItems: 'flex-start', gap: 4, maxWidth: '85%' },
    messageRowMine: { alignSelf: 'flex-end', alignItems: 'flex-end' },
    bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20 },
    bubbleOther: { ...glass, borderBottomLeftRadius: 6 },
    bubbleMine: { backgroundColor: colors.text, borderBottomRightRadius: 6 },
    bubbleText: { color: colors.text, fontSize: 15 },
    bubbleTextMine: { color: colors.onLight },
    time: { fontSize: 11, color: colors.faint },
    eventCard: { ...glass, width: 250, borderRadius: radii.card, overflow: 'hidden' },
    eventPoster: { width: '100%', height: 130 },
    eventInfo: { padding: 12, gap: 4 },
    eventTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
    eventMeta: { fontSize: 12, color: colors.muted },
    eventLink: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    eventLinkText: { fontSize: 13, fontWeight: '600', color: colors.text },
    pressed: { opacity: 0.8 },
    composer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    input: { ...glass, flex: 1, color: colors.text, borderRadius: radii.pill, paddingHorizontal: 18, paddingVertical: 12, fontSize: 15 },
    sendButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.text },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
