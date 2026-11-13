import type { ComponentProps, ComponentType } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DiscoverScreen from '../screens/DiscoverScreen';
import EventsNavigator from './EventsNavigator';
import FriendsMapScreen from '../screens/FriendsMapScreen';
import ChatsScreen from '../screens/ChatsScreen';
import { colors } from '../theme/colors';

type IconName = ComponentProps<typeof Ionicons>['name'];

const Tab = createBottomTabNavigator();

const TABS: {
  name: string;
  title: string;
  component: ComponentType;
  icon: IconName;
  iconActive: IconName;
}[] = [
  { name: 'Events', title: 'Evenimente', component: EventsNavigator, icon: 'calendar-outline', iconActive: 'calendar' },
  { name: 'Discover', title: 'Descoperă', component: DiscoverScreen, icon: 'heart-outline', iconActive: 'heart' },
  { name: 'Map', title: 'Hartă', component: FriendsMapScreen, icon: 'map-outline', iconActive: 'map' },
  { name: 'Chats', title: 'Chat', component: ChatsScreen, icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
];

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.muted,
        }}
      >
        {TABS.map((t) => (
          <Tab.Screen
            key={t.name}
            name={t.name}
            component={t.component}
            options={{
              title: t.title,
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons name={focused ? t.iconActive : t.icon} size={size} color={color} />
              ),
            }}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}
