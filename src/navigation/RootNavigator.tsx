import type { ComponentProps, ComponentType } from 'react';
import { StyleSheet, View } from 'react-native';
import { DarkTheme, NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import type { Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DiscoverScreen from '../screens/DiscoverScreen';
import EventsNavigator from './EventsNavigator';
import FriendsMapScreen from '../screens/FriendsMapScreen';
import ChatsNavigator from './ChatsNavigator';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme/colors';

type IconName = ComponentProps<typeof Ionicons>['name'];

const Tab = createBottomTabNavigator();

const theme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
  },
};

/** Ecranele care se deschid peste tab-uri și ascund bara de jos (vezi docs/layout-guide.md). */
const FULLSCREEN_ROUTES = ['ChatRoom', 'EventDetails', 'RateEvent', 'PersonProfile'];

/** Ordinea din ghidul de layout: Descoperă · Evenimente · Hartă · Chat · Profil. */
const TABS: {
  name: string;
  title: string;
  component: ComponentType;
  icon: IconName;
  iconActive: IconName;
}[] = [
  { name: 'Discover', title: 'Descoperă', component: DiscoverScreen, icon: 'albums-outline', iconActive: 'albums' },
  { name: 'Events', title: 'Evenimente', component: EventsNavigator, icon: 'calendar-outline', iconActive: 'calendar' },
  { name: 'Map', title: 'Hartă', component: FriendsMapScreen, icon: 'location-outline', iconActive: 'location' },
  { name: 'Chats', title: 'Chat', component: ChatsNavigator, icon: 'chatbubble-outline', iconActive: 'chatbubble' },
  { name: 'Profile', title: 'Profil', component: ProfileScreen, icon: 'person-outline', iconActive: 'person' },
];

export default function RootNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.faint,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
          tabBarStyle: styles.tabBar,
        }}
      >
        {TABS.map((t) => (
          <Tab.Screen
            key={t.name}
            name={t.name}
            component={t.component}
            options={({ route }) => ({
              title: t.title,
              tabBarStyle: FULLSCREEN_ROUTES.includes(getFocusedRouteNameFromRoute(route) ?? '')
                ? { display: 'none' }
                : styles.tabBar,
              tabBarIcon: ({ focused, color }) => (
                <View style={[styles.iconPill, focused && styles.iconPillActive]}>
                  <Ionicons name={focused ? t.iconActive : t.icon} size={20} color={color} />
                </View>
              ),
            })}
          />
        ))}
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: colors.background, borderTopColor: colors.border },
  iconPill: { width: 48, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconPillActive: { backgroundColor: colors.cardStrong },
});
