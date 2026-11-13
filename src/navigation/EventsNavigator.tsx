import { useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { setStatusBarStyle } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from '@expo-google-fonts/nunito';

import EventsScreen from '../screens/EventsScreen';
import EventsListScreen from '../screens/EventsListScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import { palette } from '../theme/eventsTheme';
import type { EventsStackParamList } from './eventsTypes';

const Stack = createNativeStackNavigator<EventsStackParamList>();

/**
 * Navigarea din interiorul tab-ului Evenimente:
 * pagina principală → lista → detalii.
 * Fiecare ecran își desenează singur bara de sus (buton pătrat „înapoi”, ca în machetă).
 */
export default function EventsNavigator() {
  // Încărcăm fonturile din machetă. Până se încarcă, arătăm un spinner.
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_800ExtraBold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
  });

  // Fundalul acestui tab e deschis, deci ora/bateria de sus trebuie să fie închise la culoare.
  // Când ieșim din tab, revenim la stilul restului aplicației (deschis, pe temă închisă).
  useFocusEffect(
    useCallback(() => {
      setStatusBarStyle('dark');
      return () => setStatusBarStyle('light');
    }, []),
  );

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background }}>
        <ActivityIndicator color={palette.ink} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }}>
      <Stack.Screen name="EventsHome" component={EventsScreen} />
      <Stack.Screen name="EventsList" component={EventsListScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
    </Stack.Navigator>
  );
}
