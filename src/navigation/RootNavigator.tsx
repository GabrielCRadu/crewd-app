import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import DiscoverScreen from '../screens/DiscoverScreen';
import EventsScreen from '../screens/EventsScreen';
import FriendsMapScreen from '../screens/FriendsMapScreen';
import ChatsScreen from '../screens/ChatsScreen';

const Tab = createBottomTabNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator>
        <Tab.Screen name="Discover" component={DiscoverScreen} options={{ title: 'Descoperă' }} />
        <Tab.Screen name="Events" component={EventsScreen} options={{ title: 'Evenimente' }} />
        <Tab.Screen name="Map" component={FriendsMapScreen} options={{ title: 'Hartă' }} />
        <Tab.Screen name="Chats" component={ChatsScreen} options={{ title: 'Chat' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
