import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Avatar from '../components/Avatar';
import { MY_GROUPS, SUGGESTED_GROUPS } from '../data/mockSocial';
import type { ChatsStackParamList } from '../navigation/chatsTypes';
import { colors } from '../theme/colors';
import type { ChatGroup } from '../types/social';

type Props = NativeStackScreenProps<ChatsStackParamList, 'ChatsHome'>;

/** Tab-ul Chat: grupurile tale + grupuri sugerate (vezi docs/layout-guide.md). */
export default function ChatsScreen({ navigation }: Props) {
  const open = (group: ChatGroup) => navigation.navigate('ChatRoom', { groupId: group.id });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Chat-uri</Text>

        <Text style={styles.sectionTitle}>Grupurile tale</Text>
        {MY_GROUPS.map((g) => (
          <Pressable key={g.id} onPress={() => open(g)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            <View style={styles.groupRow}>
              <Avatar name={g.name} size={48} square initials={2} />
              <View style={styles.groupText}>
                <View style={styles.lineBetween}>
                  <Text style={styles.groupName} numberOfLines={1}>
                    {g.name}
                  </Text>
                  <Text style={styles.time}>{g.lastMessage?.time}</Text>
                </View>
                <View style={styles.lineBetween}>
                  <Text style={styles.lastMessage} numberOfLines={1}>
                    {g.lastMessage ? `${g.lastMessage.author}: ${g.lastMessage.text}` : ''}
                  </Text>
                  {g.unreadCount > 0 ? (
                    <View style={styles.unread}>
                      <Text style={styles.unreadText}>{g.unreadCount}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>
            <View style={styles.meetupBand}>
              <Text style={styles.meetupText}>
                {g.eventTitle} · ne vedem {g.meetupWhen}
              </Text>
            </View>
          </Pressable>
        ))}

        <Text style={styles.sectionTitle}>Sugerate pentru tine</Text>
        <Text style={styles.sectionHint}>Oameni cu gusturi ca ale tale, la evenimentele la care mergi.</Text>
        {SUGGESTED_GROUPS.map((g) => (
          <View key={g.id} style={[styles.card, styles.suggestedRow]}>
            <View style={styles.groupText}>
              <Text style={styles.groupName}>{g.name}</Text>
              <Text style={styles.lastMessage}>
                {g.eventTitle} · {g.membersCount} persoane
              </Text>
              <Text style={styles.common}>{g.commonTagsCount} tag-uri comune</Text>
            </View>
            <Pressable onPress={() => open(g)} style={styles.joinButton}>
              <Text style={styles.joinText}>Intră</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 32, gap: 12 },
  title: { fontSize: 32, fontWeight: '900', color: colors.text, marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 12 },
  sectionHint: { fontSize: 13, color: colors.muted, marginTop: -6 },
  card: {
    padding: 14,
    gap: 12,
    borderRadius: 18,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85 },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  groupText: { flex: 1, gap: 3 },
  lineBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  groupName: { flexShrink: 1, fontSize: 16, fontWeight: '800', color: colors.text },
  time: { fontSize: 12, color: colors.muted },
  lastMessage: { flexShrink: 1, fontSize: 13, color: colors.muted },
  unread: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.nope,
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  meetupBand: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: colors.background },
  meetupText: { fontSize: 12, fontWeight: '700', color: colors.text },
  suggestedRow: { flexDirection: 'row', alignItems: 'center' },
  common: { fontSize: 12, fontWeight: '700', color: colors.text },
  joinButton: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, backgroundColor: colors.primary },
  joinText: { color: '#fff', fontWeight: '800' },
});
