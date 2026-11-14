import { useState } from 'react';
import { Alert, Appearance } from 'react-native';
import { reloadAppAsync } from 'expo';

import SegmentedControl from './SegmentedControl';
import { tr } from '../i18n';
import { getThemePreference, nativeColorScheme, saveThemePreference } from '../theme/themePreference';
import type { ThemePreference } from '../theme/themePreference';

/**
 * Alegerea temei în Setări: Luminoasă | Întunecată | Ca telefonul.
 * Culorile se calculează la pornire, așa că după alegere aplicația se reîncarcă imediat (rămâi logat).
 * Tema se dă și sistemului (dialoguri native, tastatură, calendare).
 */
export default function ThemeSwitch() {
  const [value, setValue] = useState<ThemePreference>(getThemePreference());

  const choose = async (next: ThemePreference) => {
    if (next === value) return;
    setValue(next);
    try {
      await saveThemePreference(next);
      Appearance.setColorScheme(nativeColorScheme(next));
      await reloadAppAsync(tr('Tema s-a schimbat'));
    } catch (e) {
      console.warn('Nu am putut aplica tema:', e);
      Alert.alert(tr('Tema'), tr('Tema nouă se vede la următoarea pornire a aplicației.'));
    }
  };

  return (
    <SegmentedControl
      options={[
        { value: 'light', label: tr('Luminoasă') },
        { value: 'dark', label: tr('Întunecată') },
        { value: 'system', label: tr('Ca telefonul') },
      ]}
      value={value}
      onChange={(next) => void choose(next)}
    />
  );
}
