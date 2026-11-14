import LegalPage from '../components/LegalPage';
import { PRIVACY_POLICY_RO } from '../legal/privacyPolicy';

/** Politica de confidențialitate (din Setări și de la crearea contului). */
export default function PrivacyPolicyScreen() {
  return <LegalPage markdown={PRIVACY_POLICY_RO} />;
}
