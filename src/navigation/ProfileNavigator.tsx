import { createNativeStackNavigator } from '@react-navigation/native-stack';

import EditProfileScreen from '../screens/EditProfileScreen';
import FriendsListScreen from '../screens/FriendsListScreen';
import PersonProfileScreen from '../screens/PersonProfileScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme/colors';
import type { ProfileStackParamList } from './profileTypes';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

/** Navigarea din tab-ul Profil: profilul → „Editează profilul” / prietenii → profilul unei persoane. */
export default function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="FriendsList" component={FriendsListScreen} />
      <Stack.Screen name="PersonProfile" component={PersonProfileScreen} />
    </Stack.Navigator>
  );
}
