import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, onThemeChange } from '../../theme/colors';
import { glass, radii } from '../../theme/shape';
import type { AutoBadgeInfo, AutoBadgeProgress, VotedBadgeInfo } from '../../types/badges';
import { BADGE_THRESHOLD } from '../../utils/badgeRules';
import BadgePill from './BadgePill';
import { tr } from '../../i18n';

interface Props {
  /** Badge-urile votate care au atins pragul. */
  voted: VotedBadgeInfo[];
  /** Badge-urile automate deja câștigate. */
  auto: AutoBadgeInfo[];
  /** Doar pe profilul tău: cât mai ai până la badge-urile automate necâștigate încă. */
  progress?: AutoBadgeProgress[];
  /** Textul afișat când nu există niciun badge. */
  emptyText: string;
}

/**
 * Cardul de badge-uri de pe profil: cele primite de la oameni și cele din activitate.
 * Se văd doar badge-urile câștigate; voturile de sub prag nu apar nicăieri.
 */
export default function BadgesCard({ voted, auto, progress, emptyText }: Props) {
  const upcoming = progress?.filter((p) => !p.earned) ?? [];
  const isEmpty = voted.length === 0 && auto.length === 0;

  return (
    <View style={styles.card}>
      {isEmpty ? <Text style={styles.hint}>{emptyText}</Text> : null}

      {voted.length > 0 ? (
        <View style={styles.group}>
          <Text style={styles.groupLabel}>{tr('De la oameni')}</Text>
          <View style={styles.pills}>
            {voted.map((badge) => (
              <BadgePill key={badge.id} label={badge.label} icon={badge.icon} />
            ))}
          </View>
        </View>
      ) : null}

      {auto.length > 0 ? (
        <View style={styles.group}>
          <Text style={styles.groupLabel}>{tr('Din activitate')}</Text>
          <View style={styles.pills}>
            {auto.map((badge) => (
              <BadgePill key={badge.id} label={badge.label} icon={badge.icon} />
            ))}
          </View>
        </View>
      ) : null}

      {upcoming.length > 0 ? (
        <View style={[styles.group, !isEmpty && styles.divided]}>
          <Text style={styles.groupLabel}>{tr('Urmează')}</Text>
          {upcoming.map(({ badge, current, target }) => (
            <View key={badge.id} style={styles.progressRow}>
              <Ionicons name={badge.icon} size={16} color={colors.muted} />
              <View style={styles.progressText}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>{badge.label}</Text>
                  <Text style={styles.progressCount}>
                    {tr('{current} din {target} {unit}', { current, target, unit: badge.unit })}
                  </Text>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${(current / target) * 100}%` }]} />
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.hint}>{tr('Un badge de la oameni apare abia când {n} persoane diferite l-au propus. Nu se vede cine.', { n: BADGE_THRESHOLD })}</Text>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    card: { ...glass, gap: 16, padding: 18, borderRadius: radii.card },
    group: { gap: 10 },
    divided: { paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
    groupLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    progressText: { flex: 1, gap: 6 },
    progressHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
    progressLabel: { flexShrink: 1, fontSize: 14, color: colors.text },
    track: { height: 4, borderRadius: radii.pill, backgroundColor: colors.cardStrong, overflow: 'hidden' },
    fill: { height: 4, borderRadius: radii.pill, backgroundColor: colors.text },
    progressCount: { fontSize: 12, color: colors.muted },
    hint: { fontSize: 13, lineHeight: 18, color: colors.muted },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
