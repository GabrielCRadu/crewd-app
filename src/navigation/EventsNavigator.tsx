import { createNativeStackNavigator } from '@react-navigation/native-stack';

import EventsScreen from '../screens/EventsScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import PersonProfileScreen from '../screens/PersonProfileScreen';
import RateEventScreen from '../screens/RateEventScreen';
import { colors } from '../theme/colors';
import type { EventsStackParamList } from './eventsTypes';

const Stack = createNativeStackNavigator<EventsStackParamList>();

/**
 * Navigarea din interiorul tab-ului Evenimente: ecranul principal → detalii → evaluare / profilul unei persoane.
 * Ecranele își desenează singure antetul (butonul „înapoi” e un GlassIconButton).
 */
export default function EventsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="EventsHome" component={EventsScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
      <Stack.Screen name="RateEvent" component={RateEventScreen} />
      <Stack.Screen name="PersonProfile" component={PersonProfileScreen} />
    </Stack.Navigator>
  );
}
