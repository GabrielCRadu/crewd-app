import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Avatar from '../components/Avatar';
import GlassIconButton from '../components/GlassIconButton';
import { allProfileTags, useAuth } from '../context/AuthContext';
import { useFriends } from '../hooks/useFriends';
import type { ProfileStackParamList } from '../navigation/profileTypes';
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  idsWithStatus,
} from '../services/friendsService';
import { commonTags, getPerson } from '../services/peopleService';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { glass, radii } from '../theme/shape';
import type { Person } from '../types/social';

type Props = NativeStackScreenProps<ProfileStackParamList, 'FriendsList'>;

/** Persoanele cu o anumită relație, în ordinea alfabetică a numelui. */
function peopleOf(ids: string[]): Person[] {
  return ids
    .map(getPerson)
    .filter((p): p is Person => p !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Prietenii tăi: sus cererile primite (Acceptă / Refuză), apoi prietenii,
 * apoi cererile trimise (Anulează). Un rând deschide profilul persoanei.
 */
export default function FriendsListScreen({ navigation }: Props) {
  const friends = useFriends();
  const { profile } = useAuth();
  const myTags = useMemo(() => allProfileTags(profile), [profile]);

  const incoming = peopleOf(idsWithStatus(friends, 'incoming'));
  const accepted = peopleOf(idsWithStatus(friends, 'friends'));
  const outgoing = peopleOf(idsWithStatus(friends, 'outgoing'));

  const openPerson = (personId: string) => navigation.navigate('PersonProfile', { personId });

  const subtitle = (p: Person) => {
    const shared = commonTags(p, myTags).length;
    return [p.age, p.city, shared > 0 ? `${shared} tag-uri comune` : null].filter(Boolean).join(' · ');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <GlassIconButton icon="chevron-back" onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Prieteni</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {incoming.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cereri de prietenie · {incoming.length}</Text>
            {incoming.map((p) => (
              <View key={p.id} style={[styles.row, styles.requestRow]}>
                <PersonInfo person={p} subtitle={subtitle(p)} onPress={() => openPerson(p.id)} />
                <View style={styles.requestActions}>
                  <Pressable
                    onPress={() => acceptFriendRequest(p.id)}
                    style={({ pressed }) => [styles.acceptButton, pressed && styles.pressedLight]}
                  >
                    <Text style={styles.acceptText}>Acceptă</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => declineFriendRequest(p.id)}
                    style={({ pressed }) => [styles.declineButton, pressed && styles.pressed]}
                  >
                    <Text style={styles.declineText}>Refuză</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prietenii tăi · {accepted.length}</Text>
          {accepted.length === 0 ? (
            <Text style={styles.muted}>Încă nu ai prieteni. Adaugă oamenii cunoscuți la evenimente din profilul lor.</Text>
          ) : (
            accepted.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => openPerson(p.id)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <PersonInfo person={p} subtitle={subtitle(p)} />
                <Ionicons name="chevron-forward" size={18} color={colors.faint} />
              </Pressable>
            ))
          )}
        </View>

        {outgoing.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cereri trimise</Text>
            {outgoing.map((p) => (
              <View key={p.id} style={styles.row}>
                <PersonInfo person={p} subtitle="Așteaptă răspuns" onPress={() => openPerson(p.id)} />
                <Pressable onPress={() => cancelFriendRequest(p.id)} hitSlop={8}>
                  <Text style={styles.link}>Anulează</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Avatarul, numele și o linie dedesubt; opțional apăsabil (deschide profilul). */
function PersonInfo({ person, subtitle, onPress }: { person: Person; subtitle: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={styles.info}>
      <Avatar name={person.name} size={46} photoUrl={person.photoUrl} />
      <View style={styles.infoText}>
        <Text style={styles.name} numberOfLines={1}>
          {person.name}
        </Text>
        <Text style={styles.muted} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { ...type.screenTitle, flex: 1, fontSize: 28 },
  content: { padding: 20, paddingTop: 8, paddingBottom: 32, gap: 24 },
  section: { gap: 10 },
  sectionTitle: { ...type.label },
  row: {
    ...glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radii.card,
  },
  requestRow: { flexWrap: 'wrap' },
  info: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, minWidth: 180 },
  infoText: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  requestActions: { flexDirection: 'row', gap: 8 },
  acceptButton: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radii.pill, backgroundColor: colors.text },
  acceptText: { color: colors.onLight, fontWeight: '600' },
  declineButton: { ...glass, paddingHorizontal: 16, paddingVertical: 9, borderRadius: radii.pill },
  declineText: { color: colors.text, fontWeight: '500' },
  pressed: { backgroundColor: colors.cardStrong },
  pressedLight: { opacity: 0.85 },
  link: { color: colors.muted, fontSize: 14, textDecorationLine: 'underline' },
});
