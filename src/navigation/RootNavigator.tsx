import { useState } from 'react';
import type { ComponentProps, ComponentType } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  createNavigationContainerRef,
  getFocusedRouteNameFromRoute,
} from '@react-navigation/native';
import type { NavigationState, Theme } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import type { MaterialTopTabBarProps } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import EventsNavigator from './EventsNavigator';
import FriendsMapScreen from '../screens/FriendsMapScreen';
import ChatsNavigator from './ChatsNavigator';
import ProfileNavigator from './ProfileNavigator';
import CompleteProfileScreen from '../screens/CompleteProfileScreen';
import EventReminders from '../components/EventReminders';
import FriendRequestPopup from '../components/FriendRequestPopup';
import InviteLinkHandler from '../components/InviteLinkHandler';
import GradientButton from '../components/GradientButton';
import { useAuth } from '../context/AuthContext';
import { colors, isDark } from '../theme/colors';
import { AuthNavigator, OnboardingNavigator } from './AuthNavigator';
import { tr } from '../i18n';

type IconName = ComponentProps<typeof Ionicons>['name'];

/**
 * Tab-urile de jos se pot și trage stânga / dreapta (ca paginile): navigatorul „material top tabs”
 * cu bara pusă jos (`tabBarPosition="bottom"`) și bara noastră (MainTabBar), la fel ca înainte.
 */
const Tab = createMaterialTopTabNavigator();

/** Pe Hartă nu schimbăm tab-ul trăgând: acolo degetul mută harta. */
const NO_SWIPE_TABS = ['Map'];

// Tema navigării urmează tema telefonului, ca restul aplicației (src/theme/colors.ts).
const baseTheme = isDark ? DarkTheme : DefaultTheme;
const theme: Theme = {
  ...baseTheme,
  colors: {
    ...baseTheme.colors,
    primary: colors.primary,
    background: colors.background,
    card: colors.card,
    text: colors.text,
    border: colors.border,
  },
};

/** Ecranele care se deschid peste tab-uri și ascund bara de jos (vezi docs/layout-guide.md). */
const FULLSCREEN_ROUTES = ['ChatRoom', 'EventDetails', 'RateEvent', 'PersonProfile', 'EditProfile', 'FriendsList', 'EventGroups', 'ProposeGroup', 'PersonFriends', 'DirectChat', 'GroupDetails', 'MemberProfile', 'PublicProfile', 'Settings', 'PrivacyPolicy'];

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

/** Ultima stare a navigării (vezi `onStateChange`): se refolosește după schimbarea limbii. */
let savedNavigationState: NavigationState | undefined;

/** Navigarea din afara ecranelor (ex. notificarea de cerere de prietenie). */
const navigationRef = createNavigationContainerRef<Record<string, object | undefined>>();

/** Deschide profilul unei persoane în tab-ul Profil (cu profilul tău dedesubt, pentru „înapoi”). */
function openPersonProfile(personId: string) {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Profile', { screen: 'PersonProfile', params: { personId }, initial: false });
  }
}

/** Fișa publică a cuiva (din codul lui QR). */
function openPublicProfile(username: string) {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Profile', { screen: 'PublicProfile', params: { username }, initial: false });
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
 * dreapta sus e liber. (Pe Profil colțul e ocupat de codul QR și „Editează”.)
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
  // Ținem minte unde ești, ca după schimbarea limbii (care redesenează tot) să rămâi pe același ecran.
  const onStateChange = (state: NavigationState | undefined) => {
    savedNavigationState = state;
    updateRoute();
  };

  return (
    <NavigationContainer
      theme={theme}
      ref={navigationRef}
      initialState={savedNavigationState}
      onReady={updateRoute}
      onStateChange={onStateChange}
    >
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
      ) : status === 'needsCompletion' ? (
        <CompleteProfileScreen />
      ) : (
        <LoadingScreen error={error} onRetry={retry} onSignOut={signOut} />
      )}
      {/* Linkurile de invitație (codul QR de pe profil): montat mereu, ca să supraviețuiască înregistrării */}
      <InviteLinkHandler onOpenProfile={openPersonProfile} onOpenPublic={openPublicProfile} />
    </NavigationContainer>
  );
}

/** Cât timp verificăm sesiunea salvată și încărcăm profilul. */
function LoadingScreen({ error, onRetry, onSignOut }: { error: string | null; onRetry: () => void; onSignOut: () => void }) {
  return (
    <View style={styles.loading}>
      <Text style={styles.logo}>{tr('crewd')}</Text>
      {error ? (
        <View style={styles.loadingError}>
          <Text style={styles.loadingText}>{error}</Text>
          <GradientButton label={tr('Încearcă din nou')} icon="refresh" onPress={onRetry} compact />
          <Pressable onPress={onSignOut} hitSlop={8}>
            <Text style={styles.loadingLink}>{tr('Ieși din cont')}</Text>
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
  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      tabBar={(props) => <MainTabBar {...props} />}
      screenOptions={{ lazy: true, lazyPreloadDistance: 1, sceneStyle: { backgroundColor: colors.background } }}
    >
      {TABS.map((t) => (
        <Tab.Screen
          key={t.name}
          name={t.name}
          component={t.component}
          options={({ route }) => ({
            title: tr(t.title),
            // Tragi doar pe ecranele principale: nu pe Hartă și nu pe ecranele deschise peste tab-uri.
            swipeEnabled:
              !NO_SWIPE_TABS.includes(t.name) &&
              !FULLSCREEN_ROUTES.includes(getFocusedRouteNameFromRoute(route) ?? ''),
          })}
        />
      ))}
    </Tab.Navigator>
  );
}

/**
 * Bara de jos: iconița (în pastilă când e activă) și eticheta, pentru fiecare tab.
 * Se ascunde pe ecranele care se deschid peste tab-uri (FULLSCREEN_ROUTES).
 */
function MainTabBar({ state, navigation }: MaterialTopTabBarProps) {
  const insets = useSafeAreaInsets();
  const focusedTab = state.routes[state.index];
  if (focusedTab && FULLSCREEN_ROUTES.includes(getFocusedRouteNameFromRoute(focusedTab) ?? '')) return null;

  return (
    // Bara de jos mai înaltă: înălțimea noastră + zona de siguranță (bara de gesturi / butoanele telefonului).
    <View style={[styles.tabBar, { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: insets.bottom + 6 }]}>
      {state.routes.map((route, index) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        const focused = state.index === index;
        const color = focused ? colors.text : colors.faint;
        const onPress = () => {
          // Ca la tab-urile obișnuite: apăsat din nou pe tab-ul activ, stiva lui revine la început.
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };
        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={tr(tab.title)}
            style={styles.tabBarItem}
          >
            <View style={[styles.iconPill, focused && styles.iconPillActive]}>
              <Ionicons name={focused ? tab.iconActive : tab.icon} size={20} color={color} />
            </View>
            <Text style={[styles.tabLabel, { color }]}>{tr(tab.title)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 24, padding: 32, backgroundColor: colors.background },
  logo: { fontSize: 44, fontWeight: '600', letterSpacing: -1.5, color: colors.text },
  loadingError: { alignItems: 'center', gap: 16 },
  loadingText: { color: colors.muted, fontSize: 15, textAlign: 'center' },
  loadingLink: { color: colors.faint, fontSize: 13, textDecorationLine: 'underline' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: 8,
  },
  tabBarItem: { flex: 1, alignItems: 'center', gap: 4 },
  tabLabel: { fontSize: 11, fontWeight: '500' },
  // `overflow: hidden`: pe Android, fără el, fundalul pastilei active ieșea cu colțuri drepte.
  iconPill: { width: 48, height: 28, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  iconPillActive: { backgroundColor: colors.cardStrong },
});
