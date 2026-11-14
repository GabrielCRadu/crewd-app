import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import UserProfileView from '../components/profile/UserProfileView';
import type { ProfileStackParamList } from '../navigation/profileTypes';

type Props = NativeStackScreenProps<ProfileStackParamList, 'UserProfile'>;

/** Profilul complet al unui cont real, deschis din lista de prieteni sau dintr-o cerere de prietenie. */
export default function UserProfileScreen({ navigation, route }: Props) {
  return <UserProfileView uid={route.params.uid} fallback={null} onBack={() => navigation.goBack()} />;
}
