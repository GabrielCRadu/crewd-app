import { useState } from 'react';
import type { ComponentProps, ComponentType } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  DarkTheme,
  NavigationContainer,
  createNavigationContainerRef,
  getFocusedRouteNameFromRoute,
} from '@react-navigation/native';
import type { Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EventsNavigator from './EventsNavigator';
import FriendsMapScreen from '../screens/FriendsMapScreen';
import ChatsNavigator from './ChatsNavigator';
import ProfileNavigator from './ProfileNavigator';
import EventReminders from '../components/EventReminders';
import FriendRequestPopup from '../components/FriendRequestPopup';
import InviteLinkHandler from '../components/InviteLinkHandler';
import GradientButton from '../components/GradientButton';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';
import { AuthNavigator, OnboardingNavigator } from './AuthNavigator';

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
const FULLSCREEN_ROUTES = ['ChatRoom', 'EventDetails', 'RateEvent', 'PersonProfile', 'EditProfile', 'FriendsList', 'EventGroups', 'ProposeGroup', 'PersonFriends', 'DirectChat'];

/** Evenimente · Hartă · Chat · Profil (Descoperă a fost scos: recomandările sunt grupulețele de la evenimente). Primul tab e cel implicit. */
const TABS: {
  name: string;
  title: string;
  component: ComponentType;
  icon: IconName;
  iconActive: IconName;
}[] = [
  { name: 'Events', title: 'Evenimente', component: EventsNavigator, icon: 'calendar-outline', iconActive: 'calendar' },
  { name: 'Map', title: 'Hartă', component: FriendsMapScreen, icon: 'location-outline', iconActive: 'location' },
  { name: 'Chats', title: 'Chat', component: ChatsNavigator, icon: 'chatbubble-outline', iconActive: 'chatbubble' },
  { name: 'Profile', title: 'Profil', component: ProfileNavigator, icon: 'person-outline', iconActive: 'person' },
];

/** Navigarea din afara ecranelor (ex. notificarea de cerere de prietenie). */
const navigationRef = createNavigationContainerRef<Record<string, object | undefined>>();

/** Deschide profilul unei persoane în tab-ul Profil (cu profilul tău dedesubt, pentru „înapoi”). */
function openPersonProfile(personId: string) {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Profile', { screen: 'PersonProfile', params: { personId }, initial: false });
  }
}

/** Deschide un eveniment (ex. din reamintire), cu lista de evenimente dedesubt pentru „înapoi”. */
function openEvent(eventId: string) {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Events', { screen: 'EventDetails', params: { eventId }, initial: false });
  }
}

/** Deschide lista de prieteni (cererile primite sunt sus). */
function openFriendRequests() {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Profile', { screen: 'FriendsList', initial: false });
  }
}

/**
 * Ecranele pe care stă butonul mic cu cererile de prietenie: cele principale, unde colțul din
 * dreapta sus e liber. (Pe Profil ai deja badge-ul de la „prieteni”.)
 */
const REQUESTS_PILL_ROUTES = ['EventsHome', 'Map', 'ChatsHome'];

/**
 * Alege ce vede utilizatorul după starea sesiunii (src/context/AuthContext.tsx):
 * se verifică sesiunea → login / creare cont → onboarding → tab-uri.
 */
export default function RootNavigator() {
  const { status, error, retry, signOut } = useAuth();
  // Ecranul curent (pornim pe Evenimente, primul tab), ca să știm unde arătăm butonul de cereri.
  const [routeName, setRouteName] = useState('EventsHome');
  const updateRoute = () => setRouteName(navigationRef.getCurrentRoute()?.name ?? 'EventsHome');

  return (
    <NavigationContainer theme={theme} ref={navigationRef} onReady={updateRoute} onStateChange={updateRoute}>
      {status === 'ready' ? (
        <>
          <MainTabs />
          {/* Cererile de prietenie: notificarea mare, apoi butonul mic cu numărul lor */}
          <FriendRequestPopup
            onOpenProfile={openPersonProfile}
            onOpenRequests={openFriendRequests}
            showPill={REQUESTS_PILL_ROUTES.includes(routeName)}
          />
          {/* Reamintirile cu o oră înainte de evenimentele la care ești înscris */}
          <EventReminders onOpenEvent={openEvent} />
        </>
      ) : status === 'signedOut' ? (
        <AuthNavigator />
      ) : status === 'needsProfile' ? (
        <OnboardingNavigator />
      ) : (
        <LoadingScreen error={error} onRetry={retry} onSignOut={signOut} />
      )}
      {/* Linkurile de invitație (codul QR de pe profil): montat mereu, ca să supraviețuiască înregistrării */}
      <InviteLinkHandler onOpenProfile={openPersonProfile} />
    </NavigationContainer>
  );
}

/** Cât timp verificăm sesiunea salvată și încărcăm profilul. */
function LoadingScreen({ error, onRetry, onSignOut }: { error: string | null; onRetry: () => void; onSignOut: () => void }) {
  return (
    <View style={styles.loading}>
      <Text style={styles.logo}>crewd</Text>
      {error ? (
        <View style={styles.loadingError}>
          <Text style={styles.loadingText}>{error}</Text>
          <GradientButton label="Încearcă din nou" icon="refresh" onPress={onRetry} compact />
          <Pressable onPress={onSignOut} hitSlop={8}>
            <Text style={styles.loadingLink}>Ieși din cont</Text>
          </Pressable>
        </View>
      ) : (
        <ActivityIndicator color={colors.text} />
      )}
    </View>
  );
}

/** Cele 5 tab-uri ale aplicației (după login și onboarding). */
/** Înălțimea barei de jos, fără zona de siguranță a telefonului (standardul React Navigation e ~49). */
const TAB_BAR_HEIGHT = 64;

function MainTabs() {
  const insets = useSafeAreaInsets();
  // Bara de jos mai înaltă: înălțimea noastră + zona de siguranță (bara de gesturi / butoanele telefonului).
  const tabBarStyle = [styles.tabBar, { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom + 6 }];
  return (
    <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.faint,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
          tabBarStyle,
          tabBarItemStyle: styles.tabBarItem,
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
                : tabBarStyle,
              tabBarIcon: ({ focused, color }) => (
                <View style={[styles.iconPill, focused && styles.iconPillActive]}>
                  <Ionicons name={focused ? t.iconActive : t.icon} size={20} color={color} />
                </View>
              ),
            })}
          />
        ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 32, backgroundColor: colors.background },
  logo: { fontSize: 44, fontWeight: '600', letterSpacing: -1.5, color: colors.text },
  loadingError: { alignItems: 'center', gap: 16 },
  loadingText: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  loadingLink: { color: colors.faint, fontSize: 13, textDecorationLine: 'underline' },
  tabBar: { backgroundColor: colors.background, borderTopColor: colors.border, paddingTop: 8 },
  tabBarItem: { gap: 4 },
  iconPill: { width: 48, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconPillActive: { backgroundColor: colors.cardStrong },
});
