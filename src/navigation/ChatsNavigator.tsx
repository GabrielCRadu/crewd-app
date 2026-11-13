import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ChatsScreen from '../screens/ChatsScreen';
import ChatRoomScreen from '../screens/ChatRoomScreen';
import DirectChatScreen from '../screens/DirectChatScreen';
import PersonFriendsScreen from '../screens/PersonFriendsScreen';
import PersonProfileScreen from '../screens/PersonProfileScreen';
import { colors } from '../theme/colors';
import type { ChatsStackParamList } from './chatsTypes';

const Stack = createNativeStackNavigator<ChatsStackParamList>();

/** Tab-ul Chat: lista de grupuri → conversația unui grup. Ambele își desenează singure antetul. */
export default function ChatsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="ChatsHome" component={ChatsScreen} />
      <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
      <Stack.Screen name="PersonProfile" component={PersonProfileScreen} />
      <Stack.Screen name="PersonFriends" component={PersonFriendsScreen} />
      <Stack.Screen name="DirectChat" component={DirectChatScreen} />
    </Stack.Navigator>
  );
}
