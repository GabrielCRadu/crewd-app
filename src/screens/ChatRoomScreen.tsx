import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Aurora from '../components/Aurora';
import Avatar from '../components/Avatar';
import GlassIconButton from '../components/GlassIconButton';
import { MESSAGES, getGroup } from '../data/mockSocial';
import type { ChatsStackParamList } from '../navigation/chatsTypes';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import type { ChatMessage } from '../types/social';

type Props = NativeStackScreenProps<ChatsStackParamList, 'ChatRoom'>;

/** Conversația unui grup: antet, banner „Ne vedem”, mesaje, bara de scriere (vezi docs/layout-guide.md). */
export default function ChatRoomScreen({ navigation, route }: Props) {
  const group = getGroup(route.params.groupId);
  const [messages, setMessages] = useState<ChatMessage[]>(MESSAGES[route.params.groupId] ?? []);
  const [draft, setDraft] = useState('');

  if (!group) return null;

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
            {group.name}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {group.membersCount} persoane · {group.eventTitle}
          </Text>
        </View>
      </View>

      <View style={styles.banner}>
        <Aurora style={StyleSheet.absoluteFill} />
        <View style={styles.bannerScrim} />
        <Ionicons name="location-outline" size={22} color={colors.text} />
        <View style={styles.bannerText}>
          <Text style={styles.bannerLabel}>NE VEDEM</Text>
          <Text style={styles.bannerWhen}>
            {group.meetupWhen} · {group.meetupWhere}
          </Text>
        </View>
        <Pressable style={styles.bannerButton}>
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
