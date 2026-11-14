import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { loadLanguage, useLanguage } from './src/i18n';
import RootNavigator from './src/navigation/RootNavigator';
import { appearance } from './src/theme/colors';
import { loadThemeChoice, useActiveScheme } from './src/theme/themeChoice';

export default function App() {
  // Limba și tema salvate se citesc înainte de primul ecran, ca să nu clipească întâi altfel.
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const language = useLanguage();
  const scheme = useActiveScheme();
  useEffect(() => {
    void Promise.all([loadLanguage(), loadThemeChoice()]).finally(() => setSettingsLoaded(true));
  }, []);
  if (!settingsLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        {/* La schimbarea limbii sau a temei, ecranele se redesenează (navigarea rămâne unde era) */}
        <RootNavigator key={`${language}-${scheme}`} />
      </AuthProvider>
      {/* Textul barei de sus: alb pe tema închisă, negru pe cea deschisă (src/theme/colors.ts) */}
      <StatusBar style={appearance.isDark ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}
