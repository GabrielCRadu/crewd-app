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
import { type } from '../../theme/typography';
import type { Event } from '../../types/events';
import type { CrewGroup } from '../../types/groups';
import { commonTags, sortGroupsForUser } from '../../utils/groupMatch';
import {
  MIN_FORM_MEMBERS,
  REPORT_BLOCK_THRESHOLD,
  canOpenChat,
  groupStatus,
  isVisibleTo,
  joinBlockReason,
  otherGroupsOpenByDefault,
  profileAge,
} from '../../utils/groupRules';
import { getMyRatings, getReputation } from '../../services/ratingsService';
import { ME_ID } from '../../data/mockRatings';
import { tr, trPlural } from '../../i18n';

interface Props {
  event: Event;
  joined: boolean;
  /** Grupulețul meu la acest eveniment, dacă sunt într-unul. */
  myGroup: CrewGroup | null;
  onPropose: () => void;
  /** Deschide conversația grupului tău (butonul din cardul lui). */
  onOpenChat: () => void;
}

/**
 * Grupulețele evenimentului (docs/superpowers/specs/2026-11-13-grupulete-design.md → Fluxul):
 * apar abia după „Înscrie-te”, doar cele în care te încadrezi, ordonate după potrivire.
 * Grupul tău e primul, cu „Deschide chat-ul” în card; celelalte stau sub „Alte grupuri”, închis
 * cât timp ești într-un grup (ca să nu sari dintr-unul în altul). Ieșirea din grup e în chat → Detalii.
 */
export default function EventGroupsSection({ event, joined, myGroup, onPropose, onOpenChat }: Props) {
  const { profile, user } = useAuth();
  const { groups, loading, error } = useEventGroups(event.id);
  const now = useNow();
  const [busyId, setBusyId] = useState<string | null>(null);
  // null = cum e implicit (otherGroupsOpenByDefault); altfel ce a ales utilizatorul.
  const [showOthers, setShowOthers] = useState<boolean | null>(null);

  if (!joined) {
    return (
      <View style={styles.locked}>
        <Ionicons name="people-outline" size={20} color={colors.muted} />
        <Text style={styles.lockedText}>{tr('Înscrie-te ca să vezi grupurile celor care merg.')}</Text>
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
  // Grupul meu din lista ascultată (mai proaspătă), sau cel din useMyGroups dacă nu mai e vizibil în listă.
  const mine = myGroup ? (groups.find((g) => g.id === myGroup.id) ?? myGroup) : null;
  const others = visible.filter((g) => g.id !== mine?.id);
  const othersOpen = showOthers ?? otherGroupsOpenByDefault(mine, now);
  const mineStatus = mine ? groupStatus(mine, now) : null;
  const missing = mine ? Math.max(0, MIN_FORM_MEMBERS - mine.memberUids.length) : 0;
  const mineNote = !mine || canOpenChat(mine)
    ? null
    : mineStatus === 'expired'
      ? tr('Nu s-au strâns 3 persoane la timp. Alege alt grup de mai jos sau propune unul.')
      : trPlural(missing, 'Așteptăm încă o persoană. Chat-ul se deschide când sunteți cel puțin {min}.', 'Așteptăm încă {n} persoane. Chat-ul se deschide când sunteți cel puțin {min}.', { min: MIN_FORM_MEMBERS });

  const cardFor = (g: CrewGroup) => (
    <GroupCard
      key={g.id}
      group={g}
      status={groupStatus(g, now)}
      common={commonTags(g, myTags)}
      isMine={mine?.id === g.id}
      blockReason={joinBlockReason(g, { age: myAge, isRegistered: joined, currentGroupId: mine?.id ?? null, isBlocked }, now)}
      busy={busyId === g.id}
      onJoin={() => join(g)}
      onOpenChat={mine?.id === g.id && canOpenChat(g) ? onOpenChat : undefined}
      note={mine?.id === g.id ? mineNote : null}
    />
  );

  const doJoin = async (g: CrewGroup) => {
    setBusyId(g.id);
    try {
      await joinGroup(event.id, g.id, profile);
    } catch (e) {
      Alert.alert(tr('Nu ai putut intra'), (e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  const join = (g: CrewGroup) => {
    if (myGroup && myGroup.id !== g.id) {
      Alert.alert(tr('Schimbi grupul?'), tr('Poți fi într-un singur grup la un eveniment. Ieși din cel actual și intri aici?'), [
        { text: tr('Rămân'), style: 'cancel' },
        { text: tr('Schimb'), onPress: () => void doJoin(g) },
      ]);
      return;
    }
    void doJoin(g);
  };

  return (
    <View style={styles.container}>
      {loading ? <ActivityIndicator color={colors.text} /> : null}
      {error ? <Text style={styles.muted}>{error}</Text> : null}

      {mine ? (
        <>
          <Text style={type.label}>{tr('Grupul tău')}</Text>
          {cardFor(mine)}
          <Pressable
            onPress={() => setShowOthers(!othersOpen)}
            style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityState={{ expanded: othersOpen }}
          >
            <Text style={type.label}>{tr('Alte grupuri · {n}', { n: others.length })}</Text>
            <Ionicons name={othersOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.muted} />
          </Pressable>
        </>
      ) : null}

      {othersOpen ? (
        <>
          {!loading && others.length === 0 ? (
            <Text style={styles.muted}>
              {mine ? tr('Nu mai sunt alte grupuri pe gustul tău.') : tr('Încă nu s-a format niciun grup pe gustul tău.')}
            </Text>
          ) : null}
          {others.map(cardFor)}
          <Pressable onPress={onPropose} style={({ pressed }) => [styles.propose, pressed && styles.pressed]}>
            <Ionicons name="add-circle-outline" size={18} color={colors.text} />
            <Text style={styles.proposeText}>{tr('Niciunul nu ți se potrivește? Propune unul')}</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  locked: { ...glass, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radii.inner },
  lockedText: { flex: 1, color: colors.muted, fontSize: 14 },
  muted: { color: colors.muted, fontSize: 13 },
  toggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, marginTop: 4 },
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
