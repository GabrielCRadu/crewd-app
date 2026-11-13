import { createNativeStackNavigator } from '@react-navigation/native-stack';

import EventsScreen from '../screens/EventsScreen';
import EventsListScreen from '../screens/EventsListScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import { colors } from '../theme/colors';
import type { EventsStackParamList } from './eventsTypes';

const Stack = createNativeStackNavigator<EventsStackParamList>();

/**
 * Navigarea din interiorul tab-ului Evenimente:
 * pagina principală → lista → detalii (cu buton „înapoi” sus).
 */
export default function EventsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        contentStyle: { backgroundColor: colors.background },
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="EventsHome" component={EventsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EventsList" component={EventsListScreen} options={{ title: 'Evenimente' }} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} options={{ title: '' }} />
    </Stack.Navigator>
  );
}
