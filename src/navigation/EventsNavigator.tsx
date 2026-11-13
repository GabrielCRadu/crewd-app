import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import { colors } from '../theme/colors';
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

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="EventsHome" component={EventsScreen} />
      <Stack.Screen name="EventsList" component={EventsListScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
    </Stack.Navigator>
  );
}
