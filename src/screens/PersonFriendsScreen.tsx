import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NavigationProp, RouteProp } from '@react-navigation/native';

import Avatar from '../components/Avatar';
import GlassIconButton from '../components/GlassIconButton';
import SegmentedControl from '../components/SegmentedControl';
import { useFriends } from '../hooks/useFriends';
import { idsWithStatus } from '../services/friendsService';
import { friendsOfPerson, getPerson } from '../services/peopleService';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import { tr } from '../i18n';

/** Ruta e înregistrată în toate stivele unde există profilul unei persoane, cu același parametru. */
type PersonFriendsParams = { PersonFriends: { personId: string } };
type Filter = 'all' | 'mutual';

/**
 * Prietenii unei persoane, deschiși din profilul ei („N prieteni”):
 * „Toți” sau doar „Comuni” (prietenii ei care sunt și ai tăi). Un rând deschide profilul.
 */
export default function PersonFriendsScreen() {
  const navigation = useNavigation<NavigationProp<Record<string, object | undefined>>>();
  const { personId } = useRoute<RouteProp<PersonFriendsParams, 'PersonFriends'>>().params;
  const person = getPerson(personId);
  const friends = useFriends();
  const myFriendIds = useMemo(() => idsWithStatus(friends, 'friends'), [friends]);
  const [filter, setFilter] = useState<Filter>('all');

  const all = useMemo(() => friendsOfPerson(personId), [personId]);
  const mutual = all.filter((p) => myFriendIds.includes(p.id));
  const shown = filter === 'all' ? all : mutual;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <GlassIconButton icon="chevron-back" onPress={() => navigation.goBack()} />
        <View style={styles.headerText}>
          <Text style={styles.title}>{tr('Prietenii lui')}{' '}{person?.name ?? ''}</Text>
          <Text style={styles.subtitle}>
            {all.length} {all.length === 1 ? 'prieten' : 'prieteni'} · {mutual.length}{' '}{tr('comuni')}</Text>
        </View>
      </View>

      <View style={styles.filter}>
        <SegmentedControl
          options={[
            { value: 'all', label: tr('Toți · {length}', { length: all.length }) },
            { value: 'mutual', label: tr('Comuni · {length}', { length: mutual.length }) },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {shown.length === 0 ? (
          <Text style={styles.empty}>
            {filter === 'mutual' ? tr('Nu aveți prieteni comuni încă.') : tr('Nu are prieteni în aplicație încă.')}
          </Text>
        ) : (
          shown.map((p) => {
            const isMutual = myFriendIds.includes(p.id);
            return (
              <Pressable
                key={p.id}
                onPress={() => navigation.navigate('PersonProfile', { personId: p.id })}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <Avatar name={p.name} size={46} photoUrl={p.photoUrl} />
                <View style={styles.rowText}>
                  <Text style={styles.name}>{p.name}</Text>
                  <Text style={styles.muted}>{[p.age, p.city].filter(Boolean).join(' · ')}</Text>
                </View>
                {/* Prietenii comuni sunt marcați și în lista „Toți” */}
                {isMutual ? (
                  <View style={styles.mutualBadge}>
                    <Text style={styles.mutualText}>{tr('Prieten comun')}</Text>
                  </View>
                ) : null}
                <Ionicons name="chevron-forward" size={18} color={colors.faint} />
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  headerText: { flex: 1, gap: 2 },
  title: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5, color: colors.text },
  subtitle: { fontSize: 13, color: colors.muted },
  filter: { paddingHorizontal: 20, paddingBottom: 12 },
  content: { padding: 20, paddingTop: 4, paddingBottom: 32, gap: 10 },
  empty: { fontSize: 14, color: colors.muted },
  row: { ...glass, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radii.card },
  pressed: { backgroundColor: colors.cardStrong },
  rowText: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  muted: { fontSize: 13, color: colors.muted },
  mutualBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radii.pill, backgroundColor: colors.text },
  mutualText: { fontSize: 11, fontWeight: '700', color: colors.onLight },
});
