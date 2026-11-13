import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import GroupCard from './GroupCard';
import { allProfileTags, useAuth } from '../../context/AuthContext';
import { useEventGroups } from '../../hooks/useEventGroups';
import { useNow } from '../../hooks/useNow';
import { joinGroup } from '../../services/groupsService';
import { colors } from '../../theme/colors';
import { glass, radii } from '../../theme/shape';
import type { Event } from '../../types/events';
import type { CrewGroup } from '../../types/groups';
import { commonTags, sortGroupsForUser } from '../../utils/groupMatch';
import { REPORT_BLOCK_THRESHOLD, groupStatus, isVisibleTo, joinBlockReason, profileAge } from '../../utils/groupRules';
import { getMyRatings, getReputation } from '../../services/ratingsService';
import { ME_ID } from '../../data/mockRatings';

interface Props {
  event: Event;
  joined: boolean;
  /** Grupulețul meu la acest eveniment, dacă sunt într-unul. */
  myGroup: CrewGroup | null;
  onPropose: () => void;
}

/**
 * Grupulețele evenimentului (docs/superpowers/specs/2026-11-13-grupulete-design.md → Fluxul):
 * apar abia după „Înscrie-te”, doar cele în care te încadrezi, ordonate după potrivire.
 */
export default function EventGroupsSection({ event, joined, myGroup, onPropose }: Props) {
  const { profile, user } = useAuth();
  const { groups, loading, error } = useEventGroups(event.id);
  const now = useNow();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!joined) {
    return (
      <View style={styles.locked}>
        <Ionicons name="people-outline" size={20} color={colors.muted} />
        <Text style={styles.lockedText}>Înscrie-te ca să vezi grupulețele celor care merg.</Text>
      </View>
    );
  }
  if (!profile) return null;

  const uid = user?.uid ?? profile.uid;
  const myAge = profileAge(profile, now);
  const myTags = allProfileTags(profile);
  const isBlocked = getReputation(getMyRatings(), ME_ID).reportsCount >= REPORT_BLOCK_THRESHOLD;
  const visible = sortGroupsForUser(
    groups.filter((g) => isVisibleTo(g, { uid, age: myAge }, now)),
    myTags,
    myAge,
    now,
  );

  const doJoin = async (g: CrewGroup) => {
    setBusyId(g.id);
    try {
      await joinGroup(event.id, g.id, profile);
    } catch (e) {
      Alert.alert('Nu ai putut intra', (e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const join = (g: CrewGroup) => {
    if (myGroup && myGroup.id !== g.id) {
      Alert.alert('Schimbi grupulețul?', 'Poți fi într-un singur grupuleț la un eveniment. Ieși din cel actual și intri aici?', [
        { text: 'Rămân', style: 'cancel' },
        { text: 'Schimb', onPress: () => void doJoin(g) },
      ]);
      return;
    }
    void doJoin(g);
  };

  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator color={colors.text} /> : null}
      {error ? <Text style={styles.muted}>{error}</Text> : null}
      {!loading && visible.length === 0 ? (
        <Text style={styles.muted}>Încă nu s-a format niciun grupuleț pe gustul tău.</Text>
      ) : null}

      {visible.map((g) => (
        <GroupCard
          key={g.id}
          group={g}
          status={groupStatus(g, now)}
          common={commonTags(g, myTags)}
          isMine={myGroup?.id === g.id}
          blockReason={joinBlockReason(
            g,
            { age: myAge, isRegistered: joined, currentGroupId: myGroup?.id ?? null, isBlocked },
            now,
          )}
          busy={busyId === g.id}
          onJoin={() => join(g)}
        />
      ))}

      <Pressable onPress={onPropose} style={({ pressed }) => [styles.propose, pressed && styles.pressed]}>
        <Ionicons name="add-circle-outline" size={18} color={colors.text} />
        <Text style={styles.proposeText}>Niciunul nu ți se potrivește? Propune unul</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  locked: { ...glass, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radii.inner },
  lockedText: { flex: 1, color: colors.muted, fontSize: 14 },
  muted: { color: colors.muted, fontSize: 13 },
  propose: {
    ...glass,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: radii.pill,
    borderStyle: 'dashed',
  },
  proposeText: { color: colors.text, fontSize: 14, fontWeight: '500' },
  pressed: { opacity: 0.8 },
});
