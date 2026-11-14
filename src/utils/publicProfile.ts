import type { Person } from '../types/social';
import type { PublicProfile, UserProfile } from '../types/user';

/** Câte tag-uri intră în profilul public (aceeași limită ca în firestore.rules). */
export const PUBLIC_TAGS_MAX = 60;

/** Câmpurile publice ale profilului tău (ce văd ceilalți în `profiles/{uid}`). */
export function toPublicProfile(profile: UserProfile): PublicProfile {
  return {
    uid: profile.uid,
    name: profile.name,
    age: profile.age,
    city: profile.city,
    bio: profile.bio,
    photoUrl: profile.photoUrl,
    username: profile.username ?? null,
    // Doar tag-urile alese; cele învățate vin din evenimentele la care te-ai înscris, deci rămân private.
    tags: [...new Set([...profile.chosenTags.events, ...profile.chosenTags.music, ...profile.chosenTags.hobbies])].slice(
      0,
      PUBLIC_TAGS_MAX,
    ),
  };
}

/** Amprenta profilului public: profilul se rescrie în Firestore doar când ea se schimbă. */
export function publicProfileKey(p: PublicProfile): string {
  return JSON.stringify([p.uid, p.name, p.age, p.city, p.bio, p.photoUrl, p.username, p.tags]);
}

/** Documentul `profiles/{uid}` citit din Firestore; null dacă nu are nici măcar nume. */
export function parsePublicProfile(uid: string, d: Record<string, unknown>): PublicProfile | null {
  if (typeof d.name !== 'string' || d.name.length === 0) return null;
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  return {
    uid,
    name: d.name,
    age: typeof d.age === 'number' ? d.age : null,
    city: str(d.city),
    bio: str(d.bio),
    photoUrl: typeof d.photoUrl === 'string' ? d.photoUrl : null,
    username: typeof d.username === 'string' ? d.username : null,
    tags: Array.isArray(d.tags) ? d.tags.filter((t): t is string => typeof t === 'string') : [],
  };
}

export type ProfileRoute =
  | { name: 'PersonProfile'; params: { personId: string } }
  | { name: 'MemberProfile'; params: { eventId: string; groupId: string; uid: string } };

/** Ce profil se deschide la apăsarea unui membru: persoanele de test au profilul lor complet, conturile reale pe cel public. */
export function profileRouteFor(uid: string, ctx: { isTestPerson: boolean; eventId: string; groupId: string }): ProfileRoute {
  return ctx.isTestPerson
    ? { name: 'PersonProfile', params: { personId: uid } }
    : { name: 'MemberProfile', params: { eventId: ctx.eventId, groupId: ctx.groupId, uid } };
}

/** Un cont real, arătat ca o persoană din listă (din profilul lui public; „…” până se încarcă). */
export function personFromPublic(uid: string, pub: PublicProfile | null | undefined): Person {
  return {
    id: uid,
    name: pub?.name ?? '…',
    age: pub?.age ?? 0,
    distanceKm: 0,
    tags: pub?.tags ?? [],
    goingTo: null,
    city: pub?.city,
    photoUrl: pub?.photoUrl ?? undefined,
  };
}
