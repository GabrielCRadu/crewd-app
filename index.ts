import { createElement, useEffect, useState } from 'react';
import type { ComponentType } from 'react';
import { registerRootComponent } from 'expo';

import { loadThemePreference } from './src/theme/themePreference';

/*
 * Pornirea aplicației: întâi citim tema aleasă în Setări, apoi încărcăm restul (App și ecranele).
 * src/theme/colors.ts își calculează culorile o singură dată, la încărcare, deci trebuie să știe tema
 * înainte ca vreun ecran să fie încărcat. De aceea App se încarcă abia aici, cu `require`.
 */
function Root() {
  const [App, setApp] = useState<ComponentType | null>(null);
  useEffect(() => {
    void loadThemePreference().finally(() => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const loaded = require('./App').default as ComponentType;
      setApp(() => loaded);
    });
  }, []);
  return App ? createElement(App) : null;
}

// registerRootComponent calls AppRegistry.registerComponent('main', () => Root);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(Root);
