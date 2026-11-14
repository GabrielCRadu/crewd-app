import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from './src/context/AuthContext';
import { loadLanguage, useLanguage } from './src/i18n';
import RootNavigator from './src/navigation/RootNavigator';
import { isDark } from './src/theme/colors';

export default function App() {
  // Limba salvată se citește înainte de primul ecran, ca să nu clipească întâi în română.
  const [languageLoaded, setLanguageLoaded] = useState(false);
  const language = useLanguage();
  useEffect(() => {
    void loadLanguage().finally(() => setLanguageLoaded(true));
  }, []);
  if (!languageLoaded) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        {/* La schimbarea limbii, ecranele se redesenează în noua limbă (navigarea rămâne unde era) */}
        <RootNavigator key={language} />
      </AuthProvider>
      {/* Textul barei de sus: alb pe tema închisă, negru pe cea deschisă (src/theme/colors.ts) */}
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}
