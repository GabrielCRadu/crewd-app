import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Avatar from '../Avatar';
import { colors, onThemeChange } from '../../theme/colors';
import { glass, radii } from '../../theme/shape';
import type { CrewGroup, GroupStatus } from '../../types/groups';
import { formatTime } from '../../utils/dates';
import { MIN_FORM_MEMBERS } from '../../utils/groupRules';
import { tr, trPlural } from '../../i18n';

interface Props {
  group: CrewGroup;
  status: GroupStatus;
  /** Tag-urile mele găsite la grup (commonTags). */
  common: string[];
  isMine: boolean;
  /** De ce nu pot intra (null = pot); butonul „Intră” apare doar fără motiv. */
  blockReason: string | null;
  busy?: boolean;
  onJoin: () => void;
  /** Doar pe grupul tău format: butonul „Deschide chat-ul” din card. */
  onOpenChat?: () => void;
  /** Un rând de stare sub card (ex. „Așteptăm încă 1 persoană…” pe grupul tău). */
  note?: string | null;
}

/**
 * Cardul unui grupuleț în detaliile evenimentului: ora și locul, vârsta, vibe-ul,
 * tag-urile comune, membrii și starea (se formează / complet / ești aici).
 */
export default function GroupCard({ group, status, common, isMine, blockReason, busy = false, onJoin, onOpenChat, note }: Props) {
  const missing = Math.max(0, MIN_FORM_MEMBERS - group.memberUids.length);
  const members = Object.values(group.members);

  const badge = isMine
    ? tr('Ești aici')
    : status === 'forming'
      ? tr('Se formează · mai e nevoie de {missing}', { missing: missing })
      : status === 'full'
        ? 'Complet'
        : status === 'closed'
          ? tr('Închis')
          : status === 'expired'
            ? tr('Nu s-a format')
            : null;

  return (
    <View style={[styles.card, isMine && styles.cardMine]}>
      <View style={styles.topRow}>
        <View style={styles.meetup}>
          <Ionicons name="location-outline" size={15} color={colors.muted} />
          <Text style={styles.meetupText} numberOfLines={1}>
            {formatTime(group.meetupAt)} · {group.meetupPlace}
          </Text>
        </View>
        {badge ? (
          <View style={[styles.badge, isMine && styles.badgeMine]}>
            <Text style={[styles.badgeText, isMine && styles.badgeTextMine]}>{badge}</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.vibe}>„{group.vibe}”</Text>

      <Text style={styles.meta}>
        {tr('{min}–{max} ani · {count}/{size} persoane', { min: group.minAge, max: group.maxAge, count: group.memberUids.length, size: group.maxSize })}
        {common.length > 0 ? ` · ${trPlural(common.length, '{n} tag comun', '{n} tag-uri comune')}` : ''}
      </Text>

      <View style={styles.bottomRow}>
        <View style={styles.avatars}>
          {members.slice(0, 5).map((m, i) => (
            <View key={`${m.name}-${i}`} style={[styles.avatarRing, i > 0 && styles.avatarOverlap]}>
              <Avatar name={m.name} size={30} photoUrl={m.photo ?? null} />
            </View>
          ))}
        </View>
        {!isMine && !blockReason ? (
          <Pressable
            onPress={onJoin}
            disabled={busy}
            style={({ pressed }) => [styles.join, (pressed || busy) && styles.pressed]}
            accessibilityRole="button"
          >
            <Text style={styles.joinText}>{busy ? '…' : tr('Intră|grup')}</Text>
          </Pressable>
        ) : null}
        {isMine && onOpenChat ? (
          <Pressable
            onPress={onOpenChat}
            style={({ pressed }) => [styles.join, styles.openChat, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Ionicons name="chatbubbles" size={16} color={colors.onLight} />
            <Text style={styles.joinText}>{tr('Deschide chat-ul')}</Text>
          </Pressable>
        ) : null}
      </View>
      {note ? <Text style={styles.meta}>{note}</Text> : null}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    card: { ...glass, padding: 16, gap: 10, borderRadius: radii.card },
    cardMine: { borderColor: colors.text },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
    meetup: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
    meetupText: { color: colors.text, fontSize: 14, fontWeight: '600', flexShrink: 1 },
    badge: { backgroundColor: colors.cardStrong, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radii.pill },
    badgeMine: { backgroundColor: colors.text },
    badgeText: { color: colors.text, fontSize: 11, fontWeight: '600' },
    badgeTextMine: { color: colors.onLight },
    vibe: { color: colors.text, fontSize: 15, lineHeight: 21 },
    meta: { color: colors.muted, fontSize: 13 },
    bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    avatars: { flexDirection: 'row' },
    avatarRing: { borderRadius: radii.pill, borderWidth: 2, borderColor: colors.background },
    avatarOverlap: { marginLeft: -10 },
    join: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: radii.pill, backgroundColor: colors.text },
    joinText: { color: colors.onLight, fontWeight: '600' },
    openChat: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16 },
    pressed: { opacity: 0.8 },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
