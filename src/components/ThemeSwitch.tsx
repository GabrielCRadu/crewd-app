import SegmentedControl from './SegmentedControl';
import { setThemeChoice, useThemeChoice } from '../theme/themeChoice';
import type { ThemeChoice } from '../theme/themeChoice';

const OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: 'system', label: 'Automat' },
  { value: 'light', label: 'Deschisă' },
  { value: 'dark', label: 'Închisă' },
];

/** Alegerea temei (Automat | Deschisă | Închisă), din Setări: toată aplicația se schimbă pe loc. */
export default function ThemeSwitch() {
  const choice = useThemeChoice();
  return <SegmentedControl options={OPTIONS} value={choice} onChange={(c) => void setThemeChoice(c)} />;
}
