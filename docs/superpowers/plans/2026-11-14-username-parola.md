# Username unic, parolă mai puternică, poză obligatorie — plan de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fiecare cont are un username unic cu litere mici (în codul QR), o parolă de minim 8 caractere cu literă mică și mare, și o poză de profil obligatorie care nu se poate șterge.

**Architecture:** Regulile pure (parolă, format/canonicalizare username, nume rezervate) stau în `src/utils/`, testate cu Jest. `src/services/usernamesService.ts` ține colecția publică `usernames/{key}` (cheia = forma canonică) și o scrie în aceeași tranzacție cu `users/{uid}`; fără Firebase, un depozit în memorie. `AuthContext` primește o stare nouă, `needsCompletion`, pentru conturile vechi fără username sau poză.

**Tech Stack:** Expo SDK 58, React Native, TypeScript, Firebase JS SDK (Auth + Firestore, `runTransaction`), `expo-image-manipulator`, React Navigation, Jest (`jest-expo`, `@jest/globals`).

**Spec:** `docs/superpowers/specs/2026-11-14-username-parola-design.md`

## Global Constraints

- Branch: `radu/username-parola`, adus la zi cu `main` **după** integrarea `cami/swipe-tabs` (rescrie `RootNavigator.tsx`). Push/merge doar la cererea utilizatorului.
- Ecranele nu vorbesc direct cu Firestore: doar `src/services/*` + `src/hooks/*`. Stil doar prin tokenii din `src/theme/`. Interfața în română.
- Parola: minim 8 caractere, cel puțin o literă mică `[a-z]`, cel puțin o literă mare `[A-Z]`.
- Username: regex `^[a-z0-9](?:[a-z0-9._]{1,18}[a-z0-9])$` (3–20 caractere, litere mici, cifre, `.`, `_`, nu începe/termină cu `.`/`_`). Canonic: `.` → `_`. Rezervate (canonic): `crewd`, `admin`, `support`, `moderator`, `official`, `help`, `system`.
- Username fix după alegere; `usernames/{key}` = `{ username, uid, name, photoThumb }`; `get` pentru logați, `list` interzis.
- Poza de profil: 400px (`PHOTO_SIZE = 400`, `compress: 0.7`), obligatorie la creare, nu se poate trece în `null`. Limita din reguli rămâne 600 000 de caractere.
- `firestore.rules` se modifică doar în fișier; **utilizatorul publică** după ce PR-ul e pe `main`.
- Teste: `import { describe, expect, it } from '@jest/globals'`, în `__tests__/*.test.ts`; serviciile se testează cu `jest.mock('../../lib/firebase', () => ({ db: null, auth: null, isFirebaseConfigured: false }))` (ca `chatService.test.ts`). Înainte de „gata”: `npx tsc --noEmit` și `npx jest`.

## Review Focus

1. Doi oameni aleg în aceeași secundă `radu.g` și `radu_g` → unul reușește, celălalt primește „Username-ul e deja luat.” (tranzacție + reguli; test pe depozitul din memorie în Task 3).
2. Utilizator vechi (fără username / fără poză) se loghează → vede „Completează-ți profilul”, nu tab-urile, și nu poate trece peste (test pentru `needsCompletion` în Task 4).
3. Scrii „Radu.G ” în câmpul de username → devine `radu.g` imediat; `radu..g`, `.radu`, `ra` → „format invalid”; `admin` → „rezervat” (Task 1).
4. Link de invitație cu propriul username → ignorat; username inexistent → „Contul nu mai există.”; persoană de test → profilul complet (Task 8).
5. Utilizator fără poză în „Editează profilul” → nu poate salva fără poză; cu poză → nu are „Șterge fotografia” (Task 4/6).

---

### Task 1: Regulile pure (parolă, username)

**Files:**
- Create: `src/utils/passwordRules.ts`, `src/utils/usernameRules.ts`
- Test: `src/utils/__tests__/passwordRules.test.ts`, `src/utils/__tests__/usernameRules.test.ts`

**Interfaces — Produces:**
```ts
// passwordRules.ts
export interface PasswordChecks { length: boolean; lower: boolean; upper: boolean }
export const PASSWORD_RULES: { key: keyof PasswordChecks; label: string }[]; // „Minim 8 caractere”, „O literă mică”, „O literă mare”
export function passwordChecks(password: string): PasswordChecks;
export function isStrongPassword(password: string): boolean;
// usernameRules.ts
export const USERNAME_MIN = 3, USERNAME_MAX = 20;
export const RESERVED_USERNAMES: string[];           // forme canonice
export function normalizeUsernameInput(raw: string): string; // lowercase, fără spații/caractere nepermise, max 20
export function canonicalUsername(username: string): string; // '.' → '_'
export function usernameError(username: string): string | null; // null = valid
export function usernameFromName(name: string): string;      // pentru persoanele de test: 'Maria' → 'maria'
```

- [ ] **Step 1: Teste care eșuează.**
  - `passwordChecks('abcdefgh')` → `{ length: true, lower: true, upper: false }`; `isStrongPassword('Abcdefgh')` → true; `'Abcdefg'` (7) → false; `'ABCDEFGH'` → false; `'abcdefgh'` → false.
  - `normalizeUsernameInput('Radu.G ')` → `'radu.g'`; `normalizeUsernameInput('ana maria!')` → `'anamaria'`; `'Ăla'` → `'la'` (doar ASCII); lungime tăiată la 20.
  - `canonicalUsername('radu.g')` → `'radu_g'`.
  - `usernameError`: `'radu.g'` → null; `'radu..g'` → null (permis de format); `'ra'` → mesaj cu „3”; `'a'.repeat(21)` → mesaj cu „20”; `'.radu'`, `'radu_'`, `'Radu'` → mesajul de format; `'admin'`, `'crewd'`, `'help'` → mesaj cu „rezervat”; `'sup.port'` → null (canonic `sup_port`, nerezervat).
  - `usernameFromName('Maria')` → `'maria'`; `usernameFromName('Ana-Maria')` → `'anamaria'`.
- [ ] **Step 2:** `npx jest src/utils/__tests__/passwordRules.test.ts src/utils/__tests__/usernameRules.test.ts` → FAIL (module lipsă).
- [ ] **Step 3:** Implementează. Mesajele: „Username-ul are cel puțin 3 caractere.”, „Username-ul are cel mult 20 de caractere.”, „Doar litere mici, cifre, punct și underscore; nu începe și nu se termină cu punct sau underscore.”, „Username-ul e rezervat.”.
- [ ] **Step 4:** aceeași comandă → PASS.
- [ ] **Step 5:** `git commit -m "Password and username rules (pure, tested)"`.

### Task 2: Regulile Firestore și schema

**Files:** Modify `firestore.rules`, `docs/firebase.md`.

- [ ] **Step 1:** `match /usernames/{key}`: `allow get: if request.auth != null; allow list: if false;`
  - `create`: `request.auth.uid == request.resource.data.uid`, `keys().hasOnly(['username','uid','name','photoThumb'])`, `username` string care `matches('^[a-z0-9](?:[a-z0-9._]{1,18}[a-z0-9])$')`, `request.resource.data.username.replace('\\.', '_') == key`, `!(key in [listele rezervate])`, `name` string 1–50, `photoThumb` null sau string ≤ 20000, `getAfter(/databases/$(database)/documents/users/$(request.auth.uid)).data.username == request.resource.data.username`.
  - `update`: doar `resource.data.uid == request.auth.uid`, `affectedKeys().hasOnly(['name','photoThumb'])`, aceleași limite.
  - `delete`: `resource.data.uid == request.auth.uid`.
- [ ] **Step 2:** în `users/{uid}`:
  - `validProfile`: `(!('username' in d) || (d.username is string && d.username.matches('^[a-z0-9](?:[a-z0-9._]{1,18}[a-z0-9])$')))`.
  - `create`: în plus `request.resource.data.username is string` și `request.resource.data.photoUrl is string` și `existsAfter(/databases/$(database)/documents/usernames/$(request.resource.data.username.replace('\\.', '_')))`.
  - `update`: în plus `(resource.data.get('username', null) == null || request.resource.data.get('username', null) == resource.data.username)` și `!(resource.data.get('photoUrl', null) is string && request.resource.data.get('photoUrl', null) == null)`; dacă `username` e setat acum (lipsea), `existsAfter(...usernames/<canonic>)`.
- [ ] **Step 3:** `docs/firebase.md`: `users.username`, colecția `usernames/{key}` (cheia canonică, câmpuri, cine citește/scrie), politica de parolă din consolă.
- [ ] **Step 4:** Citește blocul modificat (nu avem emulator); `npx jest` → PASS (nemodificat).
- [ ] **Step 5:** `git commit -m "Firestore rules: unique usernames (get only), username fixed once set, profile photo required"`.

### Task 3: `usernamesService` și profilul cu username

**Files:**
- Create: `src/services/usernamesService.ts`, `src/hooks/useUsernameAvailability.ts`, `src/hooks/usePublicCard.ts`
- Modify: `src/types/user.ts` (`username?: string | null` în `UserProfile`; `ProfileDraft` primește `username: string` și `photoUrl: string`), `src/services/profileService.ts` (`getProfile` citește `username`; `createProfile` scrie în tranzacție), `src/data/mockSocial.ts` (`username` pe `PEOPLE`, din `usernameFromName`), `src/types/social.ts` (`username?: string` în `Person`)
- Test: `src/services/__tests__/usernamesService.test.ts`

**Interfaces — Consumes:** Task 1. **Produces:**
```ts
export interface PublicCard { username: string; uid: string; name: string; photoThumb: string | null }
export class UsernameTakenError extends Error {}           // mesaj: „Username-ul e deja luat.”
export async function isUsernameAvailable(username: string): Promise<boolean>; // false și pentru rezervate/invalide
export async function lookupUsername(username: string): Promise<PublicCard | null>;
export async function claimUsername(uid: string, card: Omit<PublicCard, 'uid'>): Promise<void>;      // cont existent: tranzacție users.username + usernames/{key}
export async function updatePublicCard(username: string, changes: Partial<Pick<PublicCard, 'name' | 'photoThumb'>>): Promise<void>;
export async function releaseUsername(username: string): Promise<void>;
export type InviteTarget = { kind: 'self' } | { kind: 'person'; personId: string } | { kind: 'public'; username: string };
export function resolveInviteTarget(username: string, myUsername: string | null): InviteTarget; // persoană de test → 'person'
// hooks
export function useUsernameAvailability(username: string): 'idle' | 'checking' | 'available' | 'taken' | 'invalid'; // așteaptă 400 ms după ultima tastă
export function usePublicCard(username: string): { card: PublicCard | null; loading: boolean };
```
- `profileService.createProfile(uid, draft)` → în `runTransaction`: citește `usernames/{canonic}`; dacă există → `UsernameTakenError`; altfel scrie `users/{uid}` (cu `username`, `photoUrl`, `photoThumb`) și `usernames/{canonic}`.

- [ ] **Step 1: Teste care eșuează** (depozitul din memorie):
  - `isUsernameAvailable('maria')` → false (persoană de test); `isUsernameAvailable('radu.g')` → true; după `claimUsername('u1', { username: 'radu.g', name: 'Radu', photoThumb: null })`: `isUsernameAvailable('radu_g')` → false; `claimUsername('u2', { username: 'radu_g', … })` → respinge cu `UsernameTakenError`.
  - `isUsernameAvailable('admin')` → false; `isUsernameAvailable('Ra')` → false.
  - `lookupUsername('radu.g')` → `{ uid: 'u1', name: 'Radu', … }`; `lookupUsername('nimeni')` → null.
  - `updatePublicCard('radu.g', { photoThumb: 'data:x' })` → `lookupUsername` întoarce noua miniatură; `releaseUsername('radu.g')` → `isUsernameAvailable('radu.g')` → true.
  - `resolveInviteTarget('maria', 'radu.g')` → `{ kind: 'person', personId: 'p1' }`; `resolveInviteTarget('radu.g', 'radu.g')` → `{ kind: 'self' }`; `resolveInviteTarget('altcineva', 'radu.g')` → `{ kind: 'public', username: 'altcineva' }`.
- [ ] **Step 2:** `npx jest src/services/__tests__/usernamesService.test.ts` → FAIL.
- [ ] **Step 3:** Implementează serviciul, hook-urile, tipurile, `createProfile`, `getProfile`, `PEOPLE.username`.
- [ ] **Step 4:** testul → PASS; `npx tsc --noEmit` → fără erori (repară apelurile `createProfile` / `ProfileDraft` care nu mai compilează doar cât să compileze; UI-ul vine în Task 6).
- [ ] **Step 5:** `git commit -m "Usernames service: unique lowercase usernames in a transaction with the profile, public card lookup"`.

### Task 4: Starea de autentificare, poza și ștergerea contului

**Files:**
- Create: `src/utils/profileCompleteness.ts` + test `src/utils/__tests__/profileCompleteness.test.ts`
- Modify: `src/context/AuthContext.tsx`, `src/services/photoService.ts`, `src/screens/EditProfileScreen.tsx`, `src/services/groupsService.ts` (doar dacă e nevoie pentru miniatură)

**Interfaces — Produces:**
```ts
export function missingProfileParts(p: Pick<UserProfile, 'username' | 'photoUrl'>): { username: boolean; photo: boolean };
// AuthContext
export type AuthStatus = 'loading' | 'signedOut' | 'needsProfile' | 'needsCompletion' | 'ready';
completeProfile(parts: { username?: string; photoUrl?: string }): Promise<void>; // în AuthContextValue
```

- [ ] **Step 1: Test care eșuează:** `missingProfileParts({ username: null, photoUrl: 'x' })` → `{ username: true, photo: false }`; `{ username: 'radu', photoUrl: null }` → `{ username: false, photo: true }`; ambele prezente → ambele false; `username` lipsă (`undefined`) → `true`.
- [ ] **Step 2:** `npx jest src/utils/__tests__/profileCompleteness.test.ts` → FAIL.
- [ ] **Step 3:** Implementează:
  - `AuthContext`: după `getProfile`, `status = loaded ? (lipsește ceva ? 'needsCompletion' : 'ready') : 'needsProfile'`. `completeProfile`: poza → `updateProfile({ photoUrl })` (cu miniatura, ca acum); username → `claimUsername(uid, { username, name, photoThumb })`; apoi `status = 'ready'`. Fără Firebase: profilul demo primește `username: 'tu'` (deja complet).
  - `updateProfile`: dacă se schimbă poza sau numele și profilul are `username` → `updatePublicCard` (fără să blocheze salvarea; eroarea doar se loghează).
  - `deleteAccount`: `releaseUsername(profile.username)` înainte de `deleteProfile`.
  - `photoService.PHOTO_SIZE = 400`, `compress: 0.7`; comentariul de sus actualizat (400px).
  - `EditProfileScreen`: fără „Șterge fotografia” / `setPhotoUrl(null)`; textul de sub poză: „Poza ta e obligatorie; o poți înlocui oricând.”.
- [ ] **Step 4:** testul → PASS; `npx tsc --noEmit`; `npx jest` → PASS.
- [ ] **Step 5:** `git commit -m "Auth: needsCompletion for accounts without username or photo; photo can't be removed; 400px photos"`.

### Task 5: Creează cont — parola cu cerințe

**Files:** Modify `src/screens/auth/SignUpScreen.tsx`, `src/services/authService.ts` (scoate `MIN_PASSWORD_LENGTH` dacă nu mai e folosit).

- [ ] **Step 1:** Sub câmpul de parolă: cele 3 rânduri din `PASSWORD_RULES`, fiecare cu `checkmark-circle` (`colors.like`) când e îndeplinit, altfel `ellipse-outline` (`colors.faint`). Eroarea câmpului la trimitere: „Parola nu îndeplinește cerințele de mai jos.” cât timp `!isStrongPassword(password)`.
- [ ] **Step 2:** `npx tsc --noEmit`, `npx jest` → PASS. Pe telefon: `Abcdefg` → „Minim 8” nebifat, butonul refuză; `Abcdefgh` → toate bifate.
- [ ] **Step 3:** `git commit -m "Sign up: password needs 8+ characters, a lowercase and an uppercase letter, with a live checklist"`.

### Task 6: Onboarding — username, pasul de poză, confirmarea

**Files:**
- Create: `src/screens/onboarding/OnboardingPhotoScreen.tsx`, `src/components/UsernameField.tsx`, `src/components/ProfilePhotoPicker.tsx`
- Modify: `src/navigation/authTypes.ts`, `src/navigation/AuthNavigator.tsx`, `src/components/OnboardingHeader.tsx` (`step: 1 | 2 | 3`, „Pasul X din 3”, trei bare), `src/screens/onboarding/OnboardingIdentityScreen.tsx`, `src/screens/onboarding/OnboardingTagsScreen.tsx`

**Interfaces — Consumes:** `normalizeUsernameInput`, `usernameError` (Task 1), `useUsernameAvailability` (Task 3), `pickProfilePhoto` (existent). **Produces:**
```ts
// authTypes.ts
export interface IdentityDraft { name; birthDate; city; gender; username: string }
OnboardingIdentity: undefined; OnboardingPhoto: { identity: IdentityDraft }; OnboardingTags: { identity: IdentityDraft; photoUrl: string };
// UsernameField: { value: string; onChange: (v: string) => void; status: ReturnType<typeof useUsernameAvailability> }
// ProfilePhotoPicker: { photoUrl: string | null; onChange: (uri: string) => void } — Cameră / Galerie, fără „Șterge”
```

- [ ] **Step 1:** `UsernameField`: prefix `@`, `autoCapitalize="none"`, `autoCorrect={false}`, `onChangeText` trece prin `normalizeUsernameInput`; sub câmp: „Disponibil” (`colors.like`) / „Ocupat” sau mesajul din `usernameError` (`colors.nope`) / „Se verifică…”.
- [ ] **Step 2:** Identitate: câmpul „Username” sub „Nume”; „Continuă” cere `status === 'available'` (eroare: „Alege un username disponibil.”) → `OnboardingPhoto`.
- [ ] **Step 3:** `OnboardingPhotoScreen` (pas 2): titlu „Adaugă o poză cu tine”, text „Ceilalți te recunosc la întâlnire după ea.”, `ProfilePhotoPicker`, „Continuă” dezactivat fără poză → `OnboardingTags`.
- [ ] **Step 4:** Tag-uri (pas 3): înainte de `completeOnboarding`, `Alert.alert('Username-ul tău', 'Așa te vor găsi ceilalți: @<username>. Nu se mai poate schimba.', [{ text: 'Schimb', style: 'cancel', onPress: navighează la OnboardingIdentity }, { text: 'Confirm', onPress: salvează }])`. `UsernameTakenError` la salvare → `Alert` cu mesajul și înapoi la identitate.
- [ ] **Step 5:** `npx tsc --noEmit`, `npx jest` → PASS. Pe telefon: cont nou → 3 pași; username ocupat (`maria` în mock / unul existent în Firebase) → „Ocupat”.
- [ ] **Step 6:** `git commit -m "Onboarding: unique username with live availability, mandatory photo step, username confirmation"`.

### Task 7: „Completează-ți profilul” pentru conturile vechi

**Files:**
- Create: `src/screens/CompleteProfileScreen.tsx`
- Modify: `src/navigation/RootNavigator.tsx` (doar: `status === 'needsCompletion'` → `<CompleteProfileScreen />`)

- [ ] **Step 1:** Ecranul: titlu „Completează-ți profilul”, text „Avem nevoie de un username și o poză cu tine.”; doar părțile lipsă (`missingProfileParts`): `UsernameField` și/sau `ProfilePhotoPicker`; „Gata” activ când tot ce lipsea e completat (username disponibil); confirmarea username-ului ca în Task 6; apoi `completeProfile(...)`. Jos, link „Ieși din cont” (`signOut`). Fără buton de sărit peste.
- [ ] **Step 2:** `npx tsc --noEmit`, `npx jest` → PASS. Pe telefon, cu un cont vechi: ecranul apare după login; după „Gata” → tab-urile.
- [ ] **Step 3:** `git commit -m "Complete-your-profile screen for existing accounts without username or photo"`.

### Task 8: QR cu username, fișa publică, @username pe profil

**Files:**
- Create: `src/screens/PublicProfileScreen.tsx`
- Modify: `src/utils/inviteLink.ts` (+ testul existent `src/utils/__tests__/inviteLink.test.ts`), `src/services/inviteService.ts`, `src/components/InviteQrSheet.tsx`, `src/components/InviteLinkHandler.tsx`, `src/screens/ProfileScreen.tsx`, `src/navigation/profileTypes.ts` (`PublicProfile: { username: string }`), `src/navigation/ProfileNavigator.tsx`, `src/navigation/RootNavigator.tsx` (`openPublicProfile(username)`, `'PublicProfile'` în `FULLSCREEN_ROUTES`)

**Interfaces — Consumes:** `resolveInviteTarget`, `usePublicCard` (Task 3).

- [ ] **Step 1: Teste (actualizează `inviteLink.test.ts`):** `invitePath('radu.g')` → `'invite/radu.g'`; `usernameFromLink({ hostname: 'invite', path: 'radu.g' })` → `'radu.g'`; `exp` cu `path: '--/invite/radu.g'` → `'radu.g'`; un link cu username invalid (`'invite/AB'`) → null (trece prin `usernameError`). Redenumește `personIdFromLink` → `usernameFromLink`.
- [ ] **Step 2:** `npx jest src/utils/__tests__/inviteLink.test.ts` → FAIL, apoi implementează → PASS.
- [ ] **Step 3:** `inviteService`: `inviteUrl(username)`, `inviteMessage(username)` („Hai să fim prieteni pe Crewd! @<username> <link>”), `copyInvite`/`shareInvite(username)`, `usernameFromUrl(url)`. `InviteQrSheet`: primește `username` (în loc de `uid`), afișează `@username` sub cod. `ProfileScreen`: `@username` sub nume (`colors.muted`); trimite `profile.username` la QR (fără username → nu afișează butonul QR).
- [ ] **Step 4:** `InviteLinkHandler`: `resolveInviteTarget(username, profile?.username ?? null)` → `self`: ignorat; `person`: `onOpenProfile(personId)`; `public`: `onOpenPublic(username)` (prop nou).
- [ ] **Step 5:** `PublicProfileScreen`: înapoi; `usePublicCard(username)`; `Avatar` (miniatura, 112, pătrat), numele, `@username`, text „Adăugarea la prieteni vine în curând.”; card lipsă → „Contul nu mai există.” + „Înapoi”.
- [ ] **Step 6:** `npx tsc --noEmit`, `npx jest` → PASS. Pe telefon: QR arată `@username`; „Copiază linkul” conține `invite/<username>`.
- [ ] **Step 7:** `git commit -m "QR invite with the username, public card for scanned accounts, @username on the profile"`.

### Task 9: todo.md și verificarea finală

**Files:** Modify `todo.md`.

- [ ] **Step 1:** `todo.md`: username-urile persoanelor de test; „Adaugă prieten” pe fișa publică (cu prietenii pe Firestore); verificarea feței din poză (AI, mai târziu); moderarea username-urilor; schimbarea username-ului; poza mărită e 400px (Cami).
- [ ] **Step 2:** `npx tsc --noEmit`, `npx jest` → PASS.
- [ ] **Step 3:** Spune-i utilizatorului ce s-a schimbat în `firestore.rules` și să activeze politica de parolă în consolă (Authentication → Settings → Password policy: min 8, literă mică, literă mare; modul care nu blochează conturile existente) — **după** unirea pe `main`.
- [ ] **Step 4:** Test pe telefon cu utilizatorul: cont nou (parolă, username, poză, confirmare), cont vechi (completare), QR + fișa publică, „Editează profilul” fără ștergerea pozei.
- [ ] **Step 5:** `git commit -m "todo: usernames, mandatory photo and what's left"`.
