import { useSyncExternalStore } from 'react';

import { getLocationVisible, setLocationVisible, subscribeToLocationVisible } from '../services/friendsService';

/** „Locația mea e vizibilă pentru prieteni”: valoarea salvată și funcția care o schimbă. */
export function useLocationVisibility(): [boolean, (next: boolean) => void] {
  const visible = useSyncExternalStore(subscribeToLocationVisible, getLocationVisible);
  return [visible, setLocationVisible];
}
