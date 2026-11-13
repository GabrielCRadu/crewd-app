import { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Avatar from '../components/Avatar';
import { MESSAGES, getGroup } from '../data/mockSocial';
import type { ChatsStackParamList } from '../navigation/chatsTypes';
import { colors } from '../theme/colors';
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
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={8}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
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
        <Ionicons name="location-outline" size={22} color="#fff" />
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
          <Pressable onPress={send} style={styles.sendButton}>
            <Ionicons name="arrow-forward" size={22} color="#fff" />
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text },
  headerSubtitle: { fontSize: 12, color: colors.muted },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.primary,
  },
  bannerText: { flex: 1 },
  bannerLabel: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5, opacity: 0.85 },
  bannerWhen: { color: '#fff', fontSize: 15, fontWeight: '800' },
  bannerButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.card },
  bannerButtonText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  messages: { paddingHorizontal: 16, paddingBottom: 12, gap: 10, flexGrow: 1, justifyContent: 'flex-end' },
  day: { alignSelf: 'center', color: colors.muted, fontSize: 12, marginBottom: 4 },
  messageRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '85%' },
  messageRowMine: { alignSelf: 'flex-end' },
  messageBody: { flexShrink: 1, gap: 4 },
  author: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  bubbleOther: { backgroundColor: colors.card, borderBottomLeftRadius: 4 },
  bubbleMine: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleText: { color: colors.text, fontSize: 15 },
  bubbleTextMine: { color: '#fff' },
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
    flex: 1,
    color: colors.text,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
});
