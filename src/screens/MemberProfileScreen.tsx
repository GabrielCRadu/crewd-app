import { StyleSheet, Text } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import UserProfileView from '../components/profile/UserProfileView';
import { useEvents } from '../hooks/useEvents';
import { useMyGroups } from '../hooks/useMyGroups';
import { useUserLocation } from '../hooks/useUserLocation';
import { tr } from '../i18n';
import type { ChatsStackParamList } from '../navigation/chatsTypes';
import { colors, onThemeChange } from '../theme/colors';

type Props = NativeStackScreenProps<ChatsStackParamList, 'MemberProfile'>;

/**
 * Profilul complet al unui membru (cont real), deschis din lista „Membri” a Detaliilor grupului
 * sau din avatarul lui din chat (spec 2026-11-14-profil-membru-tema-design.md).
 * Datele vin din profilul lui public; până se încarcă (sau dacă nu are încă unul), se arată ce știe grupul.
 * Cine a ieșit între timp din grup își păstrează profilul. @username-ul vine doar din profilul public
 * (regulile grupului nu verifică username-ul copiat în grup).
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
    <UserProfileView
      uid={uid}
      fallback={
        member
          ? { name: member.name || '?', age: member.age, photoUrl: member.photo ?? null, tags: member.tags }
          : null
      }
      onBack={() => navigation.goBack()}
    >
      {group && uid === group.proposerUid ? <Text style={styles.note}>{tr('A propus grupul')}</Text> : null}
      {member && event ? <Text style={styles.note}>{tr('În grupul tău pentru {event}', { event: event.title })}</Text> : null}
    </UserProfileView>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    note: { color: colors.muted, fontSize: 14 },
  });

let styles = makeStyles();
// Tema se poate schimba din mers (Setări → Temă): stilurile se refac din noile culori.
onThemeChange(() => {
  styles = makeStyles();
});
