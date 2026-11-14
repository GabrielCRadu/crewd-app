# Prieteni și amintiri pe Firestore — plan de implementare

> **Actualizare:** amintirile au fost abandonate de utilizator după Task 3. Task 4 a fost anulat (revert), Task 5 și partea de amintiri din Task 6 nu se mai fac; amintirile de test au fost scoase din aplicație. Rămân: ștergerea prieteniilor la ștergerea contului (Task 6) și verificarea finală (Task 7).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prietenii (cerere, acceptare, blocare, „în comun”) și amintirile (poze cu vizibilitate) pentru conturile reale, în Firestore, vizibile pe profilul complet deschis de alții.

**Architecture:** Logica pură (id-ul perechii, starea din documente, cererile noi, câmpurile amintirilor) stă în `src/utils/` și e testată. Accesul la Firestore stă în două servicii noi (`friendshipsFirestore.ts`, `memoriesFirestore.ts`). `friendsService.ts` și `memoriesService.ts` își păstrează interfața pentru ecrane și combină datele de test (în memorie) cu cele reale (din `onSnapshot`), pornite/oprite din AuthContext la login/logout.

**Tech Stack:** Expo SDK 58, React Native 0.88, Firebase JS SDK (Firestore), `expo-image-manipulator`, Jest.

**Spec:** `docs/superpowers/specs/2026-11-14-prieteni-amintiri-design.md`

## Global Constraints

- Fără Cloud Functions, fără Firebase Storage; pozele ca data URI JPEG în documente (≤ 1 MB pe document).
- Expo Go: fără module native noi.
- Ecranele nu vorbesc cu Firestore: servicii în `src/services/`, hook-uri în `src/hooks/`.
- Text nou în UI doar prin `tr('text românesc')`, cu cheia adăugată în `src/i18n/en.ts`.
- Culori doar din `src/theme/`.
- `firestore.rules` și `docs/firebase.md` se actualizează; regulile le publică utilizatorul.
- Persoanele de test (`PEOPLE`, id-uri `p1`…, `ME_ID = 'me'`) rămân în memorie, ca acum. Un id e „real” dacă `getPerson(id)` e `undefined`.
- Limite: miniatura amintirii ≤ 40 000 caractere (~320px), poza mare ≤ 700 000 caractere (~1080px); cel mult 50 de amintiri pe cont (verificat în aplicație).
- Blocarea se folosește în reguli doar pentru cereri; o cerere refuzată arată în aplicație: „Nu am putut trimite cererea. Încearcă mai târziu.”

## Review Focus

1. Reguli care nu pot fi dovedite pentru o interogare (`list` pe `friendships` cu `array-contains`, `list` pe `memories/{X}/items` cu filtrul `visibility`): interogarea din aplicație trebuie să aibă exact filtrul pe care îl cer regulile, altfel tot ecranul primește „permission denied”.
2. Logout / schimbarea contului cât timp ascultătorii `onSnapshot` sunt pornți: starea reală a contului vechi nu trebuie să rămână vizibilă contului nou (testul `resets real state on stop` în Task 2).
3. Același snapshot primit de două ori (sau primul snapshot la login) nu trebuie să arate notificarea „cerere nouă” pentru cererile vechi (testele `newIncomingRequests` din Task 1).
4. Poza unei amintiri prea mare pentru limită (telefon cu cameră mare): se recomprimă până intră, altfel eroare clară, nu un document refuzat în tăcere (testul `fitsLimit` din Task 5).
5. Ștergerea contului cu prietenii și amintiri reale: totul se șterge înainte de profil, iar o ștergere reluată după eșec nu se blochează pe documente deja șterse (Task 6).

---

### Task 1: Logica prieteniilor (pură)

**Files:**
- Create: `src/utils/friendshipRules.ts`
- Test: `src/utils/__tests__/friendshipRules.test.ts`

**Interfaces:**
- Produces:
  - `pairId(a: string, b: string): string` — uid-urile sortate, unite cu `_`.
  - `type FriendshipDoc = { id: string; users: [string, string]; status: 'pending' | 'friends'; requestedBy: string }`
  - `realFriendsState(me: string, friendships: FriendshipDoc[], blockedUids: string[]): FriendsState` — `pending` cerut de mine → `outgoing`, de celălalt → `incoming`; `friends` → `friends`; uid-urile blocate → `blocked` (au prioritate).
  - `newIncomingRequests(prev: FriendsState | null, next: FriendsState): string[]` — uid-urile care sunt `incoming` în `next` și nu erau în `prev`; `prev === null` (primul snapshot) → `[]`.

- [ ] **Step 1: Write the failing tests**

```ts
it('builds the same pair id in both orders', () => {
  expect(pairId('b', 'a')).toBe('a_b');
  expect(pairId('a', 'b')).toBe('a_b');
});
it('maps pending requests by who asked', () => {
  const docs = [
    { id: 'a_me', users: ['a', 'me'], status: 'pending', requestedBy: 'me' },
    { id: 'b_me', users: ['b', 'me'], status: 'pending', requestedBy: 'b' },
    { id: 'c_me', users: ['c', 'me'], status: 'friends', requestedBy: 'c' },
  ];
  expect(realFriendsState('me', docs, [])).toEqual({ a: 'outgoing', b: 'incoming', c: 'friends' });
});
it('lets a block win over any friendship', () => {
  expect(realFriendsState('me', [{ id: 'c_me', users: ['c', 'me'], status: 'friends', requestedBy: 'c' }], ['c'])).toEqual({ c: 'blocked' });
});
it('announces no request on the first snapshot', () => {
  expect(newIncomingRequests(null, { b: 'incoming' })).toEqual([]);
});
it('announces only requests that are new', () => {
  expect(newIncomingRequests({ b: 'incoming' }, { b: 'incoming', d: 'incoming', c: 'friends' })).toEqual(['d']);
});
it('does not announce the same snapshot twice', () => {
  const s = { b: 'incoming' as const };
  expect(newIncomingRequests(s, s)).toEqual([]);
});
```

- [ ] **Step 2:** `npx jest src/utils/__tests__/friendshipRules.test.ts` → FAIL (modulul lipsește).
- [ ] **Step 3:** Implementează în `src/utils/friendshipRules.ts` (importă `FriendsState` ca tip din `../services/friendsService`).
- [ ] **Step 4:** Același test → PASS.
- [ ] **Step 5:** Commit `Friendship rules: pair id, real friends state, new incoming requests`.

### Task 2: Prieteniile reale în Firestore + reguli

**Files:**
- Create: `src/services/friendshipsFirestore.ts`
- Modify: `src/services/friendsService.ts`, `src/context/AuthContext.tsx`, `src/components/FriendButton.tsx`, `firestore.rules`, `docs/firebase.md`
- Test: `src/services/__tests__/friendsService.test.ts` (create or extend)

**Interfaces:**
- Consumes: Task 1.
- Produces (`friendshipsFirestore.ts`):
  - `subscribeToMyFriendships(me, onChange: (docs: FriendshipDoc[], blockedUids: string[]) => void): () => void` — `onSnapshot` pe `friendships` cu `where('users', 'array-contains', me)` și pe `blocks` cu `where('blocker', '==', me)`.
  - `requestFriendship(me, other)`, `acceptFriendship(me, other)`, `deleteFriendship(me, other)`, `blockUser(me, other)` (batch: `blocks/{me_other}` + ștergerea `friendships/{pairId}`), `unblockUser(me, other)`.
  - `isFriendshipVisible(viewerFriend: string, target: string): Promise<boolean>` — `get` pe `friendships/{pairId}`; `true` doar dacă există și are `status == 'friends'`; refuz sau lipsă → `false`.
  - `deleteMyFriendData(me): Promise<void>` — șterge toate prieteniile și blocările tale.
- Produces (`friendsService.ts`, pe lângă exporturile existente, cu aceleași semnături):
  - `startFriendsSync(me: string): void`, `stopFriendsSync(): void` — `stop` golește starea reală.
  - `class FriendRequestError extends Error` (mesajul neutru din Global Constraints).
  - `getFriendsState()` întoarce starea de test + cea reală, combinate (același obiect cât timp nimic nu se schimbă, pentru `useSyncExternalStore`).
  - Acțiunile existente (`sendFriendRequest`, `acceptFriendRequest`, …, `blockPerson`, `unblockPerson`) primesc un id; id de test → memorie, ca acum; uid real → Firestore (cu stare optimistă locală până vine snapshot-ul). `sendFriendRequest` pe uid real aruncă `FriendRequestError` la eșec.
  - Cererile noi primite live (Task 1, `newIncomingRequests`) → `announce({ kind: 'request', personId })`.

- [ ] **Step 1: Write the failing tests** (`friendsService.test.ts`; Firestore e înlocuit cu `jest.mock('../friendshipsFirestore')`, cu un `subscribeToMyFriendships` care reține callback-ul):
  - `merges real friendships with test people` — după `startFriendsSync('me')` și callback-ul cu `[{ id: 'me_u1', users: ['me','u1'], status: 'friends', requestedBy: 'u1' }]`, `getFriendsState().u1 === 'friends'`, iar `p1` (test) rămâne `friends`.
  - `resets real state on stop` — după `stopFriendsSync()`, `getFriendsState().u1 === undefined`.
  - `announces a request that arrives after the first snapshot` — primul callback cu `incoming` de la `u2` nu anunță; al doilea, cu `u3` nou, anunță `{ kind: 'request', personId: 'u3' }`.
  - `routes a real request to Firestore` — `sendFriendRequest('u9')` apelează `requestFriendship('me', 'u9')`.
  - `throws a neutral error when a real request is refused` — mock-ul respinge → `FriendRequestError`.
- [ ] **Step 2:** `npx jest src/services/__tests__/friendsService.test.ts` → FAIL.
- [ ] **Step 3:** Implementează `friendshipsFirestore.ts` și extinde `friendsService.ts`. În `AuthContext`: `startFriendsSync(uid)` când statusul devine `ready` cu Firebase, `stopFriendsSync()` la logout. În `FriendButton`: `sendFriendRequest` prinde `FriendRequestError` → `Alert.alert(tr('Cerere de prietenie'), e.message)`.
- [ ] **Step 4:** Reguli în `firestore.rules` (blocurile `match /friendships/{pairId}` și `match /blocks/{blockId}`), exact ca în spec, secțiunile „friendships” și „blocks”. Uid-urile perechii: `pairId.split('_')[0]` și `[1]`; `create` cere `pairId == users[0] + '_' + users[1]`, `users[0] < users[1]`, `request.auth.uid in users`, `requestedBy == request.auth.uid`, `status == 'pending'`, `!exists(blocks/{a_b})` și `!exists(blocks/{b_a})`. `get` pentru terți: `resource.data.status == 'friends'` și `exists` + `get(...).data.status == 'friends'` pe prietenia `pairId(request.auth.uid, a)` sau `pairId(request.auth.uid, b)` (construită cu ternar pe comparația uid-urilor). `list`: `request.auth.uid in resource.data.users`. Documentează ambele colecții în `docs/firebase.md`.
- [ ] **Step 5:** Testul → PASS; `npx tsc --noEmit` curat; `npx jest` tot verde.
- [ ] **Step 6:** Commit `Real friendships in Firestore (requests, accept, block) merged with test people`.

### Task 3: Prietenii pe profilul complet, în listă și în notificare

**Files:**
- Create: `src/hooks/useMutualFriends.ts`, `src/hooks/usePublicProfiles.ts`, `src/screens/UserProfileScreen.tsx`
- Modify: `src/components/profile/UserProfileView.tsx`, `src/screens/FriendsListScreen.tsx`, `src/components/FriendRequestPopup.tsx`, `src/navigation/profileTypes.ts`, `src/navigation/ProfileNavigator.tsx`, `src/navigation/RootNavigator.tsx`, `src/screens/PublicProfileScreen.tsx`, `src/i18n/en.ts`
- Test: `src/utils/__tests__/friendshipRules.test.ts` (extend)

**Interfaces:**
- Consumes: Task 2 (`isFriendshipVisible`, `useFriends`, acțiunile din `friendsService`), `usePublicProfile` / `getPublicProfile` (existente).
- Produces:
  - `mutualCandidates(friends: FriendsState, target: string): string[]` în `friendshipRules.ts` — uid-urile reale cu status `friends`, fără `target` (cele de test se exclud cu un predicat `isReal` dat ca parametru: `mutualCandidates(friends, target, isReal)`).
  - `useMutualFriends(uid: string | null): { count: number; loading: boolean }`.
  - `usePublicProfiles(uids: string[]): Record<string, PublicProfile | null>`.
  - Rută `UserProfile: { uid: string }` în stiva Profil, ecranul `UserProfileScreen` (folosește `UserProfileView`); adăugată în `FULLSCREEN_ROUTES`.
  - `openPersonProfile(personId)` din `RootNavigator`: id de test → `PersonProfile`, altfel `UserProfile`.

- [ ] **Step 1: Failing test** `mutualCandidates`: din `{ p1: 'friends', u1: 'friends', u2: 'incoming', u3: 'friends' }`, cu ținta `u3` și `isReal = id => id.startsWith('u')` → `['u1']`.
- [ ] **Step 2:** Rulează → FAIL. **Step 3:** Implementează. **Step 4:** → PASS.
- [ ] **Step 5:** `UserProfileView`: sub identitate, pentru un `uid` real care nu ești tu, `FriendButton` (cu `personId = uid`), rândul `tr('{count} prieteni în comun', { count })` (ascuns la 0) și butonul „…” din antet cu `tr('Blochează')` / `tr('Deblochează')` (aceleași texte și confirmări ca în `PersonProfileScreen`). Pe `PublicProfileScreen` dispare nota „Adăugarea la prieteni vine în curând.”
- [ ] **Step 6:** `FriendsListScreen`: pentru id-urile reale din cele trei liste, numele și poza vin din `usePublicProfiles`; apăsarea deschide `UserProfile`. `FriendRequestPopup`: pentru un expeditor real, citește `getPublicProfile` și arată notificarea cu numele și poza lui; `onOpenProfile` merge prin `openPersonProfile` (care alege ruta).
- [ ] **Step 7:** Adaugă cheile noi în `en.ts`; `npx tsc --noEmit` și `npx jest` → curate.
- [ ] **Step 8:** Commit `Friend button, mutual friends and blocking on the full profile; real accounts in friends list and request popup`.

### Task 4: Pozele amintirilor (pur + compresie)

**Files:**
- Create: `src/utils/memoryPhotos.ts`
- Modify: `src/services/photoService.ts`
- Test: `src/utils/__tests__/memoryPhotos.test.ts`

**Interfaces:**
- Produces:
  - `MEMORY_THUMB_MAX = 40_000`, `MEMORY_PHOTO_MAX = 700_000`, `MEMORY_THUMB_WIDTH = 320`.
  - `fitsLimit(dataUri: string, max: number): boolean`.
  - `nextQuality(current: number): number | null` — pașii `0.75 → 0.6 → 0.45 → 0.3`, apoi `null` (renunță).
  - `makeMemoryImages(fileUri: string): Promise<{ photo: string; thumb: string }>` în `photoService.ts` — poza mare (≤ 1080px) și miniatura (320px) ca data URI JPEG; recomprimă cu `nextQuality` până intră în limite; altfel aruncă `Error(tr('Poza e prea mare. Încearcă alta.'))`.

- [ ] **Step 1: Failing tests:** `fitsLimit('data:image/jpeg;base64,' + 'A'.repeat(10), 40)` → `true`, iar cu `'A'.repeat(40)` → `false`; `nextQuality(0.75) === 0.6`, `nextQuality(0.3) === null`.
- [ ] **Step 2:** → FAIL. **Step 3:** Implementează (`makeMemoryImages` cu `ImageManipulator.manipulate(...).resize(...).renderAsync()` și `saveAsync({ format: JPEG, compress, base64: true })`, ca `makeThumbnail`). **Step 4:** → PASS.
- [ ] **Step 5:** Commit `Memory photos: full photo and preview as data URIs within size limits`.

### Task 5: Amintirile reale în Firestore + reguli

**Files:**
- Create: `src/services/memoriesFirestore.ts`
- Modify: `src/types/memories.ts`, `src/services/memoriesService.ts`, `src/hooks/useMemories.ts` (dacă e nevoie), `src/components/memories/AddMemorySheet.tsx`, `src/components/memories/MemoryViewer.tsx`, `src/context/AuthContext.tsx`, `firestore.rules`, `docs/firebase.md`, `src/i18n/en.ts`
- Test: `src/services/__tests__/memoriesService.test.ts` (create or extend)

**Interfaces:**
- Consumes: Task 4 (`makeMemoryImages`), Task 2 (`statusOf` pentru „suntem prieteni”).
- Produces:
  - `Memory` primește `remote?: boolean` (amintire din Firestore: `photoUri` e miniatura, poza mare se cere separat).
  - `memoriesFirestore.ts`: `subscribeToMyMemories(me, onChange: (m: Memory[]) => void): () => void` (`memories/{me}/items`), `addRemoteMemory(me, event: Event, images: { photo; thumb }, visibility): Promise<void>` (batch pe `items` + `photos`), `deleteRemoteMemory(me, id)`, `setRemoteVisibility(me, id, visibility)` (batch pe ambele), `fetchMemoriesOf(owner, isFriend: boolean): Promise<Memory[]>` (interogarea `visibility == 'everyone'`, plus `== 'friends'` doar dacă `isFriend`), `fetchMemoryPhoto(owner, id): Promise<string | null>`, `deleteMyMemories(me)`.
  - `memoriesService.ts`: `startMemoriesSync(me)`, `stopMemoriesSync()`; `myMemories(all)` folosește `currentOwnerId()` (uid-ul real dacă e pornit, altfel `ME_ID`); `isMyMemory` la fel; `addMemory(event, fileUri, visibility)` — real: `makeMemoryImages` + `addRemoteMemory`, cu limita de 50 (`tr('Ai ajuns la 50 de amintiri. Șterge una ca să adaugi alta.')`).
  - `useMemoriesOf(uid: string, isFriend: boolean): { memories: Memory[]; loading: boolean }` (hook nou în `src/hooks/useMemoriesOf.ts`).

- [ ] **Step 1: Failing tests** (Firestore mock-uit): `lists my real memories after sync starts`; `resets my real memories on stop`; `refuses the 51st memory` (cu 50 deja în snapshot, `addMemory` aruncă eroarea cu mesajul de limită și nu apelează `addRemoteMemory`).
- [ ] **Step 2:** → FAIL. **Step 3:** Implementează serviciile și hook-ul; `AuthContext` pornește/oprește sincronizarea lângă cea a prietenilor. `AddMemorySheet`: arată eroarea (`FormMessage`) dacă `addMemory` aruncă, și nu închide foaia. `MemoryViewer`: pentru `remote`, încarcă `fetchMemoryPhoto` și arată miniatura până atunci.
- [ ] **Step 4:** Reguli `match /memories/{ownerUid}/items/{memoryId}` și `.../photos/{memoryId}` ca în spec (citire: proprietarul / `everyone` / `friends` cu `get` pe `friendships/{pairId(request.auth.uid, ownerUid)}`; scriere doar proprietarul; câmpuri fixe și limite; `getAfter` ca `visibility` să fie egal în ambele). Documentează în `docs/firebase.md`.
- [ ] **Step 5:** → PASS; `npx tsc --noEmit`; `npx jest`.
- [ ] **Step 6:** Commit `Real memories in Firestore: preview and full photo, visibility, 50 per account`.

### Task 6: Amintirile pe profilul complet + ștergerea contului

**Files:**
- Modify: `src/components/profile/UserProfileView.tsx`, `src/context/AuthContext.tsx`, `src/i18n/en.ts`

**Interfaces:**
- Consumes: Task 5 (`useMemoriesOf`, `deleteMyMemories`), Task 2 (`deleteMyFriendData`, `useFriends`, `statusOf`).

- [ ] **Step 1:** `UserProfileView`: secțiunea `tr('AMINTIRI')` cu `MemoriesGrid` și `MemoryViewer` pentru un `uid` real, cu `isFriend = statusOf(friends, uid) === 'friends'`; ascunsă dacă nu e nicio amintire vizibilă.
- [ ] **Step 2:** `deleteAccount`: după parolă și ieșirea din grupuri, `deleteMyMemories(uid)` și `deleteMyFriendData(uid)`, apoi pașii existenți. Ambele funcții ignoră documentele deja șterse (reluarea după eșec).
- [ ] **Step 3:** `npx tsc --noEmit` și `npx jest` → curate.
- [ ] **Step 4:** Commit `Memories on the full profile; account deletion removes friendships, blocks and memories`.

### Task 7: Verificare finală

- [ ] **Step 1:** Recenzie a întregului branch (subagent, cel mai capabil model), cu Review Focus de mai sus.
- [ ] **Step 2:** Corecturile Critical/Important, fiecare cu test RED→GREEN; suita verde.
- [ ] **Step 3:** Utilizatorul publică `firestore.rules`; test pe telefon cu două conturi reale: cerere → acceptare → „în comun” → amintire „toți” și „doar prieteni” → blocare.
