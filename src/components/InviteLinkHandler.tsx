import { useEffect, useRef } from 'react';
import * as Linking from 'expo-linking';

import { useAuth } from '../context/AuthContext';
import { personIdFromUrl } from '../services/inviteService';

interface Props {
  /** Deschide profilul persoanei din link (de acolo o poți adăuga la prieteni). */
  onOpenProfile: (personId: string) => void;
}

/**
 * Fără interfață: când aplicația e deschisă dintr-un link de invitație (cod QR scanat sau link
 * primit pe altă aplicație), duce la profilul persoanei care a invitat.
 * - logat: direct pe profilul ei, cu „Adaugă prieten”;
 * - fără cont: linkul așteaptă până termini înregistrarea și onboarding-ul, apoi te duce acolo.
 * Stă montat tot timpul (și pe ecranele de login), ca să nu piardă linkul.
 * Linkul către propriul profil e ignorat.
 */
export default function InviteLinkHandler({ onOpenProfile }: Props) {
  const url = Linking.useLinkingURL();
  const { status, profile } = useAuth();
  const handled = useRef<string | null>(null);

  useEffect(() => {
    if (!url || url === handled.current) return;
    const personId = personIdFromUrl(url);
    if (!personId) return;
    // Fără cont încă: păstrăm linkul până apar tab-urile.
    if (status !== 'ready') return;
    if (personId === profile?.uid) {
      handled.current = url;
      return;
    }
    // Lăsăm tab-urile să se monteze înainte de navigare (la pornire sau imediat după onboarding).
    const timer = setTimeout(() => {
      handled.current = url;
      onOpenProfile(personId);
    }, 400);
    return () => clearTimeout(timer);
  }, [url, status, profile?.uid, onOpenProfile]);

  return null;
}
