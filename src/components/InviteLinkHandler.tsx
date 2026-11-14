import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';

import { useAuth } from '../context/AuthContext';
import { usernameFromUrl } from '../services/inviteService';
import { resolveInviteTarget } from '../services/usernamesService';

interface Props {
  /** Deschide profilul complet al unei persoane de test (de acolo o poți adăuga la prieteni). */
  onOpenProfile: (personId: string) => void;
  /** Deschide fișa publică a unui cont real (poza mică, numele, @username). */
  onOpenPublic: (username: string) => void;
}

/**
 * Fără interfață: când aplicația e deschisă dintr-un link de invitație (cod QR scanat sau link
 * primit pe altă aplicație, cu username-ul celui care invită), duce la el:
 * - persoană de test: profilul ei complet, cu „Adaugă prieten”;
 * - cont real: fișa lui publică;
 * - fără cont încă: linkul așteaptă până termini înregistrarea și onboarding-ul, apoi te duce acolo.
 * Stă montat tot timpul (și pe ecranele de login), ca să nu piardă linkul. Linkul cu propriul username e ignorat.
 */
export default function InviteLinkHandler({ onOpenProfile, onOpenPublic }: Props) {
  const url = Linking.useLinkingURL();
  const { status, profile } = useAuth();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!url || url === handled.current) return;
    const username = usernameFromUrl(url);
    if (!username) return;
    // Fără cont complet încă: păstrăm linkul până apar tab-urile.
    if (status !== 'ready') return;
    const target = resolveInviteTarget(username, profile?.username ?? null);
    if (target.kind === 'self') {
      handled.current = url;
      return;
    }
    // Lăsăm tab-urile să se monteze înainte de navigare (la pornire sau imediat după onboarding).
    const timer = setTimeout(() => {
      handled.current = url;
      if (target.kind === 'person') onOpenProfile(target.personId);
      else onOpenPublic(target.username);
    }, 400);
    return () => clearTimeout(timer);
  }, [url, status, profile?.username, onOpenProfile, onOpenPublic]);

  return null;
}
