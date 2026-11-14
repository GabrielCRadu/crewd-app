import SegmentedControl from './SegmentedControl';
import { LANGUAGES, setLanguage, useLanguage } from '../i18n';

/** Alegerea limbii (Română | English): la login și în Setări. Toată aplicația trece pe limba aleasă. */
export default function LanguageSwitch() {
  const language = useLanguage();
  return <SegmentedControl options={LANGUAGES} value={language} onChange={(l) => void setLanguage(l)} />;
}
