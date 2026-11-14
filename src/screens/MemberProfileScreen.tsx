import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Avatar from '../components/Avatar';
import Chip from '../components/Chip';
import GlassIconButton from '../components/GlassIconButton';
import { useEvents } from '../hooks/useEvents';
import { useMyGroups } from '../hooks/useMyGroups';
import { useUserLocation } from '../hooks/useUserLocation';
import { tr } from '../i18n';
import type { ChatsStackParamList } from '../navigation/chatsTypes';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import { type } from '../theme/typography';

type Props = NativeStackScreenProps<ChatsStackParamList, 'MemberProfile'>;

/**
 * Profilul unui membru, deschis din lista „Membri” a Detaliilor grupului
 * (spec 2026-11-14-profil-membru-tema-design.md). Arată ce știe grupul despre el: poza, numele,
 * vârsta, @username, tag-urile; profilul lui complet rămâne privat.
 */
export default function MemberProfileScreen({ navigation, route }: Props) {
  const { eventId, groupId, uid } = route.params;
  const { groups } = useMyGroups();
  const location = useUserLocation();
  const { events } = useEvents(location.coords);
  const group = groups.find((g) => g.id === groupId) ?? null;
  const member = group?.members[uid] ?? null;
  const event = events.find((e) => e.id === eventId) ?? null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <GlassIconButton icon="chevron-back" onPress={() => navigation.goBack()} />
      </View>

      {!member ? (
        <View style={styles.center}>
          <Text style={styles.muted}>{tr('Persoana nu mai e în acest grup.')}</Text>
          <Pressable onPress={() => navigation.goBack()} style={styles.pill}>
            <Text style={styles.pillText}>{tr('Înapoi')}</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.identity}>
            <Avatar name={member.name || '?'} size={112} square photoUrl={member.photo ?? null} />
            <Text style={styles.name}>
              {member.name}, {member.age}
            </Text>
            {member.username ? <Text style={styles.username}>@{member.username}</Text> : null}
            {group && uid === group.proposerUid ? <Text style={styles.muted}>{tr('A propus grupul')}</Text> : null}
          </View>

          {member.tags.length > 0 ? (
            <View style={styles.card}>
              <Text style={type.label}>{tr('Îi place')}</Text>
              <View style={styles.chips}>
                {member.tags.map((t) => (
                  <Chip key={t} label={t} />
                ))}
              </View>
            </View>
          ) : null}

          {event ? (
            <Text style={styles.note}>{tr('În grupul tău pentru {event}', { event: event.title })}</Text>
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 10 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
  content: { paddingHorizontal: 16, paddingBottom: 32, gap: 18 },
  identity: { alignItems: 'center', gap: 6, marginTop: 8 },
  name: { ...type.screenTitle, fontSize: 30, marginTop: 8 },
  username: { color: colors.muted, fontSize: 17 },
  card: { ...glass, borderRadius: radii.card, padding: 16, gap: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  muted: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  note: { color: colors.faint, fontSize: 13, textAlign: 'center' },
  pill: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radii.pill, backgroundColor: colors.text },
  pillText: { color: colors.onLight, fontWeight: '600' },
});
