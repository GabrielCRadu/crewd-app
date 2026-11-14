import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Avatar from '../Avatar';
import { useEventGroups } from '../../hooks/useEventGroups';
import { useFriends } from '../../hooks/useFriends';
import { idsWithStatus } from '../../services/friendsService';
import { getPerson } from '../../services/peopleService';
import { colors, onThemeChange } from '../../theme/colors';
import { glass, radii } from '../../theme/shape';
import { type } from '../../theme/typography';
import type { Event } from '../../types/events';
import type { Person } from '../../types/social';
import { friendsAtEvent, groupOwnerName } from '../../utils/friendsAtEvent';
import { tr } from '../../i18n';

/** Câți prieteni se văd până apeși „Vezi toți”. */
const VISIBLE = 5;

interface Props {
  event: Event;
  /** Deschide profilul prietenului (rutele de profil existente). */
  onOpenPerson: (personId: string) => void;
}

/**
 * „Prieteni care participă” (jos în detaliile evenimentului): prietenii acceptați înscriși la eveniment,
 * întâi cei dintr-un grup, apoi alfabetic. Grupurile vin dintr-o singură abonare la evenimentul acesta
 * (nu câte o cerere pe prieten); până sosesc, se vede un schelet, restul paginii nu așteaptă.
 */
export default function FriendsGoingSection({ event, onOpenPerson }: Props) {
  const friendsState = useFriends();
  const { groups, loading } = useEventGroups(event.id);
  const [expanded, setExpanded] = useState(false);

  const going = useMemo(() => {
    // Doar prieteniile acceptate: cererile și persoanele blocate au alt status, deci nu intră.
    const friends = idsWithStatus(friendsState, 'friends')
      .map(getPerson)
      .filter((p): p is Person => p !== undefined);
    return friendsAtEvent({ friends, goingNames: event.friendsGoing, groups });
  }, [friendsState, event.friendsGoing, groups]);

  const shown = expanded ? going : going.slice(0, VISIBLE);

  return (
    <View style={styles.section}>
      <Text style={styles.title}>
        {loading ? tr('Prieteni care participă') : tr('Prieteni care participă ({n})', { n: going.length })}
      </Text>

      {loading ? (
        <View style={styles.card}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.row, i > 0 && styles.rowBorder]}>
              <View style={styles.skeletonAvatar} />
              <View style={styles.skeletonText} />
            </View>
          ))}
        </View>
      ) : going.length === 0 ? (
        <Text style={styles.empty}>{tr('Niciun prieten nu s-a înscris încă. Fii primul! 🙌')}</Text>
      ) : (
        <View style={styles.card}>
          {shown.map(({ person, group }, i) => {
            const owner = group ? groupOwnerName(group) : null;
            return (
              <Pressable
                key={person.id}
                onPress={() => onOpenPerson(person.id)}
                style={({ pressed }) => [styles.row, i > 0 && styles.rowBorder, pressed && styles.pressed]}
              >
                <Avatar name={person.name} size={40} photoUrl={person.photoUrl} />
                <View style={styles.text}>
                  <Text style={styles.name} numberOfLines={1}>
                    {person.name}
                  </Text>
                  {group ? (
                    <Text style={styles.subtitle} numberOfLines={1}>
                      {owner ? tr('în grupul lui {name}', { name: owner }) : tr('într-un grup')}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.faint} />
              </Pressable>
            );
          })}
          {!expanded && going.length > VISIBLE ? (
            <Pressable
              onPress={() => setExpanded(true)}
              style={({ pressed }) => [styles.more, styles.rowBorder, pressed && styles.pressed]}
            >
              <Text style={styles.moreText}>{tr('Vezi toți ({n})', { n: going.length })}</Text>
            </Pressable>
          ) : null}
        </View>
      )}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    section: { gap: 10 },
    title: { ...type.label, marginTop: 8 },
    card: { ...glass, borderRadius: radii.inner, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
    rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
    text: { flex: 1, gap: 2 },
    name: { fontSize: 15, fontWeight: '600', color: colors.text },
    subtitle: { fontSize: 13, color: colors.muted },
    empty: { fontSize: 14, color: colors.muted },
    more: { alignItems: 'center', paddingVertical: 12 },
    moreText: { fontSize: 14, fontWeight: '600', color: colors.text },
    pressed: { opacity: 0.7 },
    skeletonAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.border },
    skeletonText: { height: 12, width: '45%', borderRadius: 6, backgroundColor: colors.border },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
