import { createNativeStackNavigator } from '@react-navigation/native-stack';

import EventsScreen from '../screens/EventsScreen';
import EventsListScreen from '../screens/EventsListScreen';
import EventDetailsScreen from '../screens/EventDetailsScreen';
import { colors } from '../theme/colors';
import type { EventsStackParamList } from './eventsTypes';

const Stack = createNativeStackNavigator<EventsStackParamList>();

/** Navigarea din interiorul tab-ului Evenimente. */
export default function EventsNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="EventsHome" component={EventsScreen} />
      <Stack.Screen name="EventsList" component={EventsListScreen} />
      <Stack.Screen name="EventDetails" component={EventDetailsScreen} />
    </Stack.Navigator>
  );
}
