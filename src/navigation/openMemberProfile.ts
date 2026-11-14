import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { getPerson } from '../services/peopleService';
import { profileRouteFor } from '../utils/publicProfile';
import type { ChatsStackParamList } from './chatsTypes';

/**
 * Deschide profilul unui membru din grup (lista de membri, avatarul din chat): persoanele de test
 * au profilul lor complet, conturile reale profilul public (spec 2026-11-14-profil-membru-tema-design.md).
 */
export function openMemberProfile(
  navigation: NativeStackNavigationProp<ChatsStackParamList>,
  uid: string,
  eventId: string,
  groupId: string,
): void {
  const route = profileRouteFor(uid, { isTestPerson: !!getPerson(uid), eventId, groupId });
  if (route.name === 'PersonProfile') navigation.navigate('PersonProfile', route.params);
  else navigation.navigate('MemberProfile', route.params);
}
