import { createNativeStackNavigator } from '@react-navigation/native-stack';

import EditProfileScreen from '../screens/EditProfileScreen';
import FriendsListScreen from '../screens/FriendsListScreen';
import PersonFriendsScreen from '../screens/PersonFriendsScreen';
import PersonProfileScreen from '../screens/PersonProfileScreen';
import PublicProfileScreen from '../screens/PublicProfileScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import SettingsScreen from '../screens/SettingsScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
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
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="PersonFriends" component={PersonFriendsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </Stack.Navigator>
  );
}
