import LegalPage from '../components/LegalPage';
import { TERMS_RO } from '../legal/terms';

/** Termenii și condițiile (din Setări și de la crearea contului). */
export default function TermsScreen() {
  return <LegalPage markdown={TERMS_RO} />;
}
