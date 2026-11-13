# Grupulețe la evenimente: plan de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recomandările de oameni se mută din tab-ul Descoperă (care dispare) în grupulețe la fiecare eveniment: după „Înscrie-te” vezi grupulețele potrivite, intri într-unul sau propui unul nou, care se formează la 3 membri.

**Architecture:**
- **Regulile grupulețelor sunt funcții pure, testate cu Jest:** stare, termene, cine poate vedea și intra, validarea propunerii, scorul de potrivire.
- **Datele stau în Firestore,** în `events/{eventId}/groups/{groupId}`. Intrarea și ieșirea se fac prin tranzacții care actualizează în același timp grupulețul și `users/{uid}.groupByEvent`. Regulile Firestore verifică aceleași limite pe server.
- **Ecranele folosesc doar serviciul și hook-urile.** Fără Firebase configurat, serviciul folosește un depozit în memorie, ca restul aplicației.

**Tech Stack:** Expo SDK 58 (Expo Go), React Native 0.88, TypeScript strict, React Navigation 7, Firebase JS SDK (Firestore, Auth), Jest prin `jest-expo` (nou, doar pentru logica pură).

**Spec:** `docs/superpowers/specs/2026-11-13-grupulete-design.md`

## Global Constraints

- Rulează în Expo Go (SDK 58): fără cod nativ nou; pachete doar cu `npx expo install`.
- Firebase pe planul gratuit: fără Cloud Functions; toată logica în aplicație și în `firestore.rules`.
- Regulile Firestore le publică **utilizatorul**, manual, din consolă. Fiecare schimbare a lui `firestore.rules` se anunță explicit la final.
- Interfața în română, cu diacritice. Aspectul doar din `src/theme/` și componentele comune (`docs/design-language.md`), fără culori scrise direct în ecrane.
- Navigarea: React Navigation (nu Expo Router).
- Fără grupuri „doar femei”: grupulețele nu au criterii de gen.
- Valori din spec: minim **3** membri ca să se formeze; maxim **10** membri; mărimea aleasă de cel care propune între **3–10**, implicit **6**; ora implicită a întâlnirii cu **15 min** înainte de începutul evenimentului; locul implicit **„în fața intrării”**; interval de vârstă implicit vârsta celui care propune **±4**, minim **18**; vibe obligatoriu, maxim **120** de caractere; termen de formare **2 h** înainte de întâlnire, sau **30 min** pentru grupulețele propuse după acel moment; propunerile se blochează cu **< 30 min** înainte de întâlnire; intrarea se închide la ora întâlnirii; un singur grupuleț per eveniment per utilizator; chat-ul se deschide abia la 3 membri; odată format (`formedAt` setat), grupul rămâne format.
- `npx tsc --noEmit` și `npm test` trec înainte de fiecare commit.

## Review Focus

1. **Doi oameni apasă „Intră” simultan pe ultimul loc** → unul intră, celălalt vede „Grupulețul s-a umplut” (tranzacție + regulă `size() <= maxSize`). Test: `joinBlockReason` cu grup plin; verificare manuală cu două conturi (Task 5).
2. **Utilizatorul își anulează înscrierea la eveniment cât e într-un grupuleț** → iese automat din grupuleț, iar grupul nu rămâne cu un membru-fantomă (Task 6).
3. **Eveniment în aceeași zi / grupuleț propus târziu** → termenul de formare devine 30 min, nu „expirat din start” (test în Task 2).
4. **Profil vechi fără `birthDate`** (contul de test, doar `age`) → vârsta vine din `age`, nu crapă nici aplicația, nici regulile (Task 2 test + regula din Task 5).
5. **Fără internet la „Intră” / „Propune”** → mesaj clar, nimic schimbat pe jumătate (tranzacția nu se aplică parțial; Task 4/6).

---

## Structura fișierelor

| Fișier | Rol |
| --- | --- |
| `jest.config.js`, `package.json` (script `test`) | Jest cu `jest-expo` |
| `src/types/groups.ts` | Tipurile grupulețelor |
| `src/utils/groupRules.ts` (+ `__tests__/groupRules.test.ts`) | Constante, stare, termene, vizibilitate, motive de blocare, validarea și valorile implicite ale propunerii |
| `src/utils/groupMatch.ts` (+ `__tests__/groupMatch.test.ts`) | Tag-uri comune, scor, ordinea în listă |
| `src/services/groupsService.ts` | Firestore + depozit mock: abonare la grupurile unui eveniment, grupurile mele, propune, intră, ieși |
| `src/hooks/useEventGroups.ts`, `src/hooks/useMyGroups.ts` | Hook-uri peste serviciu |
| `src/components/groups/GroupCard.tsx` | Cardul unui grupuleț |
| `src/components/groups/EventGroupsSection.tsx` | Secțiunea din detaliile evenimentului |
| `src/screens/ProposeGroupScreen.tsx` | Formularul „Propune un grupuleț” |
| Modificate: `EventDetailsScreen.tsx`, `EventsNavigator.tsx`, `eventsTypes.ts`, `RootNavigator.tsx`, `ChatsScreen.tsx`, `ChatRoomScreen.tsx`, `chatsTypes.ts`, `firestore.rules`, `docs/firebase.md`, `todo.md` | |
| Șters: `src/screens/DiscoverScreen.tsx` | |
| `scripts/seed-groups.mjs` | Grupulețe demo în Firestore (pentru prezentare) |

---

### Task 1: Jest + tipuri + reguli pure ale grupulețelor

**Files:**
- Create: `jest.config.js`, `src/types/groups.ts`, `src/utils/groupRules.ts`, `src/utils/__tests__/groupRules.test.ts`
- Modify: `package.json` (devDependency `jest-expo`, `@types/jest`; script `"test": "jest"`)

**Interfaces:**
- Produces (`src/types/groups.ts`):
  - `MemberSummary { name: string; age: number; tags: string[] }`
  - `CrewGroup { id: string; eventId: string; proposerUid: string; meetupAt: Date; meetupPlace: string; minAge: number; maxAge: number; maxSize: number; vibe: string; tags: string[]; memberUids: string[]; members: Record<string, MemberSummary>; createdAt: Date; formedAt: Date | null }`
  - `GroupStatus = 'forming' | 'formed' | 'full' | 'expired' | 'closed'`
  - `ProposalDraft { meetupAt: Date; meetupPlace: string; minAge: number; maxAge: number; maxSize: number; vibe: string }`
  - `JoinContext { age: number; isRegistered: boolean; currentGroupId: string | null; isBlocked: boolean }`
- Produces (`src/utils/groupRules.ts`): constantele `MIN_FORM_MEMBERS = 3`, `MAX_GROUP_SIZE = 10`, `MIN_GROUP_SIZE = 3`, `DEFAULT_GROUP_SIZE = 6`, `MIN_MEMBER_AGE = 18`, `DEFAULT_AGE_SPREAD = 4`, `DEFAULT_MEETUP_LEAD_MIN = 15`, `DEFAULT_MEETUP_PLACE = 'în fața intrării'`, `VIBE_MAX_LENGTH = 120`, `FORMATION_LEAD_MS = 2 * 3600_000`, `LATE_FORMATION_LEAD_MS = 30 * 60_000`, `PROPOSE_CUTOFF_MS = 30 * 60_000`, `REPORT_BLOCK_THRESHOLD = 2`; și funcțiile:
  - `formationDeadline(g: Pick<CrewGroup,'meetupAt'|'createdAt'>): Date`
  - `groupStatus(g: CrewGroup, now: Date): GroupStatus`
  - `isVisibleTo(g: CrewGroup, age: number, now: Date): boolean`: vârsta în interval, starea diferită de `expired`, iar dacă e `closed`, doar pentru membri (vezi `memberUids`; are nevoie de `uid`, deci semnătura e `isVisibleTo(g, viewer: { uid: string; age: number }, now)`)
  - `joinBlockReason(g: CrewGroup, ctx: JoinContext, now: Date): string | null`: `null` = poate intra
  - `defaultProposal(eventStartsAt: Date, proposerAge: number): ProposalDraft`
  - `proposalErrors(d: ProposalDraft, proposerAge: number, eventStartsAt: Date, now: Date): Partial<Record<keyof ProposalDraft, string>>`
  - `profileAge(p: { birthDate: string | null; age: number }, now: Date): number`: din `birthDate` (`ageFromBirthDate` din `src/utils/birthDate.ts`), altfel `age`

- [ ] **Step 1: Instalează Jest**

Run: `npx expo install jest-expo jest @types/jest -- --save-dev`, apoi adaugă `"test": "jest"` în `scripts`. `jest.config.js`: `module.exports = { preset: 'jest-expo', testMatch: ['**/__tests__/**/*.test.ts'] };`

- [ ] **Step 2: Scrie testele (`src/utils/__tests__/groupRules.test.ts`)**

Cu `meetup = new Date('2026-11-20T19:45:00+02:00')`:
- `formationDeadline` cu `createdAt` cu 1 zi înainte → `meetup − 2h`; cu `createdAt = meetup − 1h` → `meetup − 30min`.
- `groupStatus`: 2 membri, `formedAt: null`, `now = meetup − 3h` → `'forming'`; aceiași la `meetup − 1h59m` → `'expired'`; 3 membri și `formedAt` setat → `'formed'`; `formedAt` setat dar doar 2 membri rămași → `'formed'` (rămâne format); `memberUids.length === maxSize` → `'full'`; `now > meetupAt` → `'closed'`.
- `isVisibleTo`: vârsta 17 față de `minAge = 18` → false; vârsta 30 față de un interval 20–28 → false; un grupuleț `expired` → false; un grupuleț `closed` → true doar dacă `viewer.uid` e membru.
- `joinBlockReason`: `isRegistered: false` → „Înscrie-te întâi la eveniment.”; `isBlocked: true` → „Nu poți intra în grupulețe o perioadă, din cauza raportărilor.”; status `full` → „Grupulețul s-a umplut.”; vârsta în afara intervalului → „Nu te încadrezi în intervalul de vârstă al grupului.”; `now >= meetupAt` → „Întâlnirea a început deja.”; `expired` → „Grupulețul nu s-a format la timp.”; `currentGroupId === g.id` → „Ești deja în acest grupuleț.”; un caz valid → `null`. (Faptul că ești în *alt* grupuleț nu blochează intrarea, pentru că serviciul te mută automat.)
- `defaultProposal(start, 25)` → `meetupAt = start − 15min`, `meetupPlace = 'în fața intrării'`, `minAge = 21`, `maxAge = 29`, `maxSize = 6`, `vibe = ''`; `defaultProposal(start, 19)` → `minAge = 18`.
- `proposalErrors`: `vibe` gol → eroare pe `vibe`; `vibe` de 121 de caractere → eroare; `maxSize = 11` sau `2` → eroare pe `maxSize`; `minAge = 17` → eroare; vârsta celui care propune în afara intervalului → eroare pe `minAge`; `meetupAt` după începutul evenimentului → eroare pe `meetupAt`; `meetupAt − now < 30min` → eroare pe `meetupAt` („Întâlnirea e prea aproape: alege cu cel puțin 30 de minute înainte.”); ciorna implicită → `{}`.
- `profileAge({ birthDate: null, age: 24 }, now)` → 24; cu `birthDate: '2000-11-21'` și `now = 2026-11-20` → 25.

- [ ] **Step 3: Rulează și confirmă că pică**

Run: `npm test -- groupRules`
Expected: FAIL (`Cannot find module '../groupRules'`)

- [ ] **Step 4: Implementează `src/types/groups.ts` și `src/utils/groupRules.ts`** cu semnăturile de mai sus. `groupStatus` în ordinea: `closed` (după `meetupAt`) → `full` → `formed` (dacă `formedAt`) → `expired` (dacă `now > formationDeadline`) → `forming`. Mesajele exact ca în teste.

- [ ] **Step 5: Rulează testele și tsc**

Run: `npm test -- groupRules && npx tsc --noEmit`
Expected: PASS, fără erori

- [ ] **Step 6: Commit**

```bash
git add jest.config.js package.json package-lock.json src/types/groups.ts src/utils/groupRules.ts src/utils/__tests__/groupRules.test.ts
git commit -m "Add group rules (status, deadlines, eligibility, proposal) with Jest tests"
```

---

### Task 2: Potrivirea și ordinea în listă

**Files:**
- Create: `src/utils/groupMatch.ts`, `src/utils/__tests__/groupMatch.test.ts`

**Interfaces:**
- Consumes: `CrewGroup`, `groupStatus` (Task 1)
- Produces:
  - `commonTags(g: CrewGroup, myTags: string[]): string[]`: tag-urile mele care apar la grup (`g.tags`) sau la oricare membru, fără dubluri, în ordinea din `myTags`
  - `matchScore(g: CrewGroup, myTags: string[], myAge: number): number`: `commonTags.length * 10 − |myAge − (minAge+maxAge)/2|`
  - `sortGroupsForUser(groups: CrewGroup[], myTags: string[], myAge: number, now: Date): CrewGroup[]`: ordinea: `formed`, apoi `forming`, apoi `full`, apoi `closed`; în fiecare categorie descrescător după `matchScore`; `expired` exclus

- [ ] **Step 1: Scrie testele**: doi grupuleți `formed` cu 3 vs 1 tag comun → cel cu 3 e primul; un `formed` și un `forming` cu scor mai mare → `formed` e primul; un `full` apare după `forming`; un `expired` lipsește; `commonTags` nu dublează un tag prezent și la grup, și la un membru; scor egal pe tag-uri → câștigă vârsta mai apropiată de mijlocul intervalului.
- [ ] **Step 2: Rulează (`npm test -- groupMatch`)**: FAIL
- [ ] **Step 3: Implementează** semnăturile de mai sus.
- [ ] **Step 4: Rulează `npm test && npx tsc --noEmit`**: PASS
- [ ] **Step 5: Commit**: `git commit -m "Add group matching and list ordering"`

---

### Task 3: Serviciul de grupulețe (Firestore + mock) și hook-urile

**Files:**
- Create: `src/services/groupsService.ts`, `src/hooks/useEventGroups.ts`, `src/hooks/useMyGroups.ts`

**Interfaces:**
- Consumes: tipurile și `groupStatus`, `joinBlockReason`, `MIN_FORM_MEMBERS` (Task 1); `db` (`src/lib/firebase.ts`); `UserProfile` (`src/types/user.ts`); `allProfileTags` (`src/context/AuthContext.tsx`)
- Produces:
  - `subscribeToEventGroups(eventId: string, cb: (groups: CrewGroup[]) => void, onError: (e: Error) => void): () => void`, cu `onSnapshot` pe `events/{eventId}/groups`
  - `subscribeToMyGroups(uid: string, cb: (groups: CrewGroup[]) => void, onError: (e: Error) => void): () => void`, cu `collectionGroup('groups')` și `where('memberUids','array-contains', uid)`
  - `proposeGroup(eventId: string, draft: ProposalDraft, me: UserProfile): Promise<string>` (id-ul noului grupuleț)
  - `joinGroup(eventId: string, groupId: string, me: UserProfile): Promise<void>`
  - `leaveGroup(eventId: string, groupId: string, uid: string): Promise<void>`
  - `leaveGroupForEvent(eventId: string, uid: string): Promise<void>`: iese din grupulețul de la eveniment, dacă există
  - `getMyGroupIdForEvent(eventId: string): string | null`, sincron, din cache-ul abonării `subscribeToMyGroups`
  - `useEventGroups(eventId: string): { groups: CrewGroup[]; loading: boolean; error: string | null }`
  - `useMyGroups(): { groups: CrewGroup[]; loading: boolean }`, cu uid-ul din `useAuth()`
- Schema Firestore (o scrie serviciul, o verifică regulile din Task 5):
  - `events/{eventId}/groups/{groupId}` conține: `eventId`, `proposerUid`, `meetupAt` (Timestamp), `meetupPlace`, `minAge`, `maxAge`, `maxSize`, `vibe`, `tags` (string[]), `memberUids` (string[]), `members` (map uid → `{ name, age, tags }`), `createdAt` (Timestamp), `formedAt` (Timestamp | null).
  - `users/{uid}.groupByEvent` e o hartă `eventId → groupId`.

- [ ] **Step 1: Implementează `proposeGroup`, `joinGroup` și `leaveGroup` cu `runTransaction`**
  - Fiecare tranzacție citește grupulețul (dacă există) și `users/{uid}`.
  - Dacă `groupByEvent[eventId]` arată alt grupuleț, utilizatorul e scos întâi din acela, în aceeași tranzacție.
  - Se recalculează `joinBlockReason`. Dacă întoarce un motiv, se aruncă `new Error(motiv)`.
  - Se scriu grupulețul și `groupByEvent`. Membrul își copiază `members[uid] = { name, age: profileAge(me, now), tags: allProfileTags(me) }`, fără poză.
  - `formedAt = serverTimestamp()` când lista de membri ajunge la 3 și `formedAt` era null.
  - Ieșirea șterge `members[uid]`, scoate uid-ul din `memberUids` și șterge `groupByEvent[eventId]`.
  - `isBlocked` vine din `getReputation(getMyRatings(), ME_ID).reportsCount >= REPORT_BLOCK_THRESHOLD`. Reputația e mock (vezi `todo.md`).
  - Erorile Firestore (rețea, permisiuni) se transformă în „Nu am putut salva. Verifică conexiunea la internet și încearcă din nou.”

- [ ] **Step 2: Implementează varianta mock (`db === null`)**
  - Un depozit în memorie, `Map<eventId, CrewGroup[]>`, cu ascultători, aceleași funcții și aceleași verificări.
  - Inițializat cu câte 2 grupulețe demo pentru primele 2 evenimente mock (unul `formed` cu 4 membri, unul `forming` cu 2), cu membrii din `PEOPLE` (`src/data/mockSocial.ts`).

- [ ] **Step 3: Implementează hook-urile**
  - `useEventGroups` se abonează la montare și se dezabonează la demontare.
  - `useMyGroups` întoarce `[]` până există uid.
  - Un ceas intern reîmprospătează starea la fiecare 60 de secunde (`setInterval`), ca termenele să treacă singure.

- [ ] **Step 4: Verifică**

Run: `npx tsc --noEmit && npm test`
Expected: fără erori, testele trec.

- [ ] **Step 5: Commit**: `git commit -m "Add groups service (Firestore transactions + in-memory mock) and hooks"`

---

### Task 4: Ecranul „Propune un grupuleț”

**Files:**
- Create: `src/screens/ProposeGroupScreen.tsx`
- Modify: `src/navigation/eventsTypes.ts` (adaugă `ProposeGroup: { eventId: string }`), `src/navigation/EventsNavigator.tsx` (ecranul nou), `src/navigation/RootNavigator.tsx` (`'ProposeGroup'` în `FULLSCREEN_ROUTES`)

**Interfaces:**
- Consumes: `defaultProposal`, `proposalErrors`, `profileAge`, `MIN_GROUP_SIZE`, `MAX_GROUP_SIZE`, `VIBE_MAX_LENGTH` (Task 1); `proposeGroup` (Task 3); `useEvents` (evenimentul după id); `useAuth`; `TextField`, `GradientButton`, `GlassIconButton`, `SegmentedControl`/`Chip`, `FormMessage`; `DateTimePickerAndroid` / `DateTimePicker` (ca în `src/components/BirthDateField.tsx`) pentru ora întâlnirii, în modul `time`.
- Produces: ruta `ProposeGroup`. La succes face `navigation.goBack()`, iar lista se actualizează singură prin abonare.

- [ ] **Step 1: Construiește formularul.** Câmpurile:
  - ora întâlnirii, prin selectorul de oră, cu ziua evenimentului;
  - locul (`TextField`);
  - intervalul de vârstă: două câmpuri numerice, sau butoane −/+ pentru minim și maxim;
  - mărimea maximă: chip-uri de la 3 la 10;
  - vibe-ul (`TextField`, cu `maxLength = VIBE_MAX_LENGTH` și un contor).

  Sub formular, un rând cu tag-urile comune cu evenimentul, doar de afișat. Valorile pornesc din `defaultProposal(event.startsAt, profileAge(profile, now))`. Erorile vin din `proposalErrors` și apar sub câmpuri. CTA-ul e „Propune grupulețul” (`GradientButton`, cu `loading`). Erorile serviciului apar în `FormMessage`.

- [ ] **Step 2: Verifică**

Run: `npx tsc --noEmit`, apoi testează pe telefon prin Expo Go (după Task 6, care adaugă butonul de intrare). Ar trebui:
- să apară formularul cu valorile implicite;
- un vibe gol să afișeze eroarea;
- o propunere validă să apară în listă ca „Se formează · mai e nevoie de 2”.

- [ ] **Step 3: Commit**: `git commit -m "Add Propose group screen"`

---

### Task 5: Regulile Firestore pentru grupulețe

**Files:**
- Modify: `firestore.rules`, `docs/firebase.md` (schema `groups` și `users.groupByEvent`)

**Interfaces:**
- Consumes: schema din Task 3.
- Produces: regulile pentru `match /events/{eventId}/groups/{groupId}`.

- [ ] **Step 1: Scrie regulile** (funcții ajutătoare: `me()` = `get(/databases/$(database)/documents/users/$(request.auth.uid)).data`; `ageOf(u)` = din `u.birthDate` față de `request.time` în zile/365.25, altfel `u.age`)
  - **read:** orice utilizator logat.
  - **create:**
    - `proposerUid == auth.uid` și `memberUids == [auth.uid]`;
    - `formedAt == null`;
    - `3 <= maxSize <= 10` și `18 <= minAge <= maxAge`;
    - `ageOf(me())` e în interval;
    - `eventId in me().joinedEventIds`;
    - `meetupAt > request.time + 30 min`;
    - `vibe` e string cu lungimea între 1 și 120;
    - `getAfter(users/uid).data.groupByEvent[eventId] == groupId`.
  - **update, intrare:** se schimbă doar `memberUids`, `members` și `formedAt`.
    - `memberUids` crește cu exact `auth.uid` și `size() <= maxSize`;
    - vârsta e în interval și utilizatorul e înscris la eveniment;
    - `request.time < meetupAt`;
    - dacă `formedAt == null`, `request.time <=` termenul de formare (aceeași formulă ca `formationDeadline`, pe `createdAt` și `meetupAt`);
    - `formedAt` se setează doar când noua mărime e cel puțin 3 și era null;
    - `groupByEvent` din `getAfter` arată spre acest grupuleț.
  - **update, ieșire:** `memberUids` scade cu exact `auth.uid`, iar restul câmpurilor rămâne neschimbat.
  - **delete:** interzis.
  - **users:** `groupByEvent`, dacă există, e `map`.

- [ ] **Step 2: Verifică compilarea.** Cu acordul utilizatorului, o creare de ruleset nepublicat prin `firebase-admin`, apoi ștergerea lui. Altfel, utilizatorul publică regulile și testăm în aplicație.

  Expected: „RULES COMPILE OK”.

- [ ] **Step 3: Commit**: `git commit -m "Firestore rules for groups"`

  Utilizatorul trebuie anunțat să **publice** `firestore.rules`.

---

### Task 6: Secțiunea de grupulețe în detaliile evenimentului

**Files:**
- Create: `src/components/groups/GroupCard.tsx`, `src/components/groups/EventGroupsSection.tsx`
- Modify: `src/screens/EventDetailsScreen.tsx` (înlocuiește secțiunea mock „Grupuri pe gustul tău” și bara de jos)

**Interfaces:**
- Consumes: `useEventGroups`, `joinGroup`, `leaveGroupForEvent`, `getMyGroupIdForEvent` / `useMyGroups` (Task 3); `sortGroupsForUser`, `commonTags` (Task 2); `groupStatus`, `isVisibleTo`, `joinBlockReason`, `profileAge` (Task 1); `isJoined`, `leaveEvent` (`preferencesService`).
- Produces:
  - `GroupCard({ group, myTags, myAge, isMine, status, blockReason, onJoin, onOpenChat }: …)`: afișează ora și locul, intervalul de vârstă, vibe-ul, „N tag-uri comune”, avatarele membrilor (`Avatar` cu inițiale) și numărul de membri din maxim. Eticheta e „Se formează · mai e nevoie de N”, „Complet” sau „Ești aici”. Butonul e „Intră”, ascuns dacă există `blockReason` sau `isMine`.
  - `EventGroupsSection({ event })`

- [ ] **Step 1: `EventGroupsSection`**
  - **Neînscris:** un text scurt, „Înscrie-te ca să vezi grupulețele celor care merg”. Nu se afișează nicio listă.
  - **Înscris:** lista `sortGroupsForUser(groups.filter(g => isVisibleTo(g, me, now)), myTags, myAge, now)`.
  - Lista goală: „Încă nu s-a format niciun grupuleț.”
  - Sub listă: butonul „Niciunul nu ți se potrivește? Propune unul”, care navighează la `ProposeGroup`.
  - „Intră” cere confirmare dacă utilizatorul e deja în alt grupuleț („Ieși din «X» și intri aici?”). Erorile apar cu `Alert`.

- [ ] **Step 2: Bara de jos din `EventDetailsScreen`**
  - **Neînscris:** „Înscrie-te” (neschimbat).
  - **Înscris și într-un grupuleț `formed`:** „Deschide chat-ul”, care duce la `Chats → ChatRoom { eventId, groupId }`.
  - **Înscris și într-un grupuleț `forming`:** pastila dezactivată „Așteptăm încă N persoane”.
  - **Înscris fără grupuleț:** „Bilete” (dacă există) și textul „Alege un grupuleț mai sus”.
  - **„Anulează”:** apelează întâi `leaveGroupForEvent(event.id, uid)`, apoi `leaveEvent(event)`. La o eroare, nu face nimic și afișează `Alert`.
  - Codul mock `groups`/`openGroup` (`MY_GROUPS`, `SUGGESTED_GROUPS`) se scoate.

- [ ] **Step 3: Verifică pe telefon** (cu Firebase și regulile din Task 5 publicate):
  - neînscris: nu apare lista;
  - după înscriere: apare lista, iar „Propune” creează un grupuleț „Se formează · mai e nevoie de 2”, iar bara de jos arată „Așteptăm încă 2 persoane”;
  - „Anulează”: ieși și din grupuleț;
  - fără internet la „Intră”: apare mesajul de eroare, fără nicio schimbare.

- [ ] **Step 4: Commit**: `git commit -m "Event details: real groups section, propose button and group-aware bottom bar"`

---

### Task 7: Chat legat de grupulețe

**Files:**
- Modify: `src/navigation/chatsTypes.ts` (`ChatRoom: { eventId: string; groupId: string }`), `src/screens/ChatsScreen.tsx`, `src/screens/ChatRoomScreen.tsx`

**Interfaces:**
- Consumes: `useMyGroups`, `groupStatus`, `MIN_FORM_MEMBERS` (Task 1/3); `useEvents` (titlul evenimentului); `MESSAGES` (mock, după `groupId`, cu `[]` implicit).
- Produces: ruta `ChatRoom { eventId, groupId }`.

- [ ] **Step 1: `ChatsScreen`**
  - Scoate secțiunea „Sugerate pentru tine”.
  - „Grupurile tale” vin din `useMyGroups()`. Un rând arată titlul evenimentului, ora și locul întâlnirii și membrii.
  - Grupulețele `forming` sunt marcate „Se formează · 2/3” și nu deschid conversația. La apăsare apare un `Alert`: „Chat-ul se deschide când sunteți cel puțin 3”.
  - Lista goală: „Intră într-un grupuleț de la un eveniment ca să-l vezi aici.”

- [ ] **Step 2: `ChatRoomScreen`**
  - Grupulețul se ia din `useMyGroups()` după `groupId`.
  - Bannerul „Ne vedem” afișează `meetupAt` (prin `formatTime` și `formatDay` din `utils/dates`) și `meetupPlace`.
  - Mesajele rămân mock.

- [ ] **Step 3: Verifică:** `npx tsc --noEmit`. Pe telefon:
  - un grupuleț în formare apare în Chat ca „Se formează”;
  - cu 3 membri (folosind scriptul din Task 8, sau 3 conturi), conversația se deschide și bannerul are ora și locul corecte.

- [ ] **Step 4: Commit**: `git commit -m "Chat lists my groups; forming groups locked until 3 members"`

---

### Task 8: Scoate Descoperă, grupulețe demo, documentație

**Files:**
- Delete: `src/screens/DiscoverScreen.tsx`
- Modify: `src/navigation/RootNavigator.tsx` (fără tab-ul Discover; Evenimente e primul și deci implicit; comentariul cu ordinea tab-urilor), `docs/layout-guide.md` (secțiunea „Tab Descoperă” marcată ca eliminată; bara de jos are 4 tab-uri), `todo.md` (grupurile mock din chat și „Grupuri pe gustul tău” sunt rezolvate; rămân mesajele mock, reputația mock la blocare și notificările de expirare doar în aplicație)
- Create: `scripts/seed-groups.mjs`

**Interfaces:**
- Consumes: schema din Task 3; `firebase-admin` și `service-account.json` (ca `scripts/import-events.mjs`).

- [ ] **Step 1: Scoate Descoperă.** Verifică cu `grep -rn "DiscoverScreen\|'Discover'" src` că nu mai rămâne nicio referință. `PEOPLE` și `PersonProfileScreen` rămân, pentru că le folosesc evaluările.

- [ ] **Step 2: Scrie `scripts/seed-groups.mjs`**
  - Usage: `node scripts/seed-groups.mjs [--dry-run]`.
  - Creează câte 2 grupulețe demo pentru primele 5 evenimente viitoare din Firestore: unul `formed`, cu 3–4 membri fictivi (uid-uri `demo-*`, cu nume și vârste plauzibile), și unul în formare, cu 1–2 membri.
  - Scrie cu SDK-ul de admin, care ocolește regulile.
  - Rulat din nou, nu duplică: id-uri fixe `demo-<eventId>-a` și `-b`.

- [ ] **Step 3: Verifică:**
  - `npx tsc --noEmit && npm test`;
  - `node scripts/seed-groups.mjs --dry-run` afișează 10 grupulețe;
  - pe telefon: 4 tab-uri, Evenimente se deschide implicit, iar evenimentele demo au grupulețe.

- [ ] **Step 4: Commit**: `git commit -m "Remove Discover tab, add demo groups seed script, update docs"`

---

## Self-review (făcut)

- **Acoperirea specificației:**
  - fluxul de după „Înscrie-te” e în T6;
  - limitele 1–6 sunt în T1, T3 și T5 (blocarea după raportări rămâne mock, cum spune specificația);
  - formularul de propunere e în T4, cu valorile din T1;
  - ciclul de viață e în T1 și T3;
  - potrivirea e în T2;
  - navigarea și Chat sunt în T7 și T8;
  - datele și regulile sunt în T3 și T5;
  - `formedAt` lipicios e în T1 și T3;
  - termenul de 30 de minute e în T1 și T5.
- **Tipuri:**
  - `CrewGroup`, `ProposalDraft` și `JoinContext` sunt definite în T1 și folosite la fel în T2, T3, T4 și T6;
  - `ChatRoom { eventId, groupId }` e definit în T7 și folosit în T6.
- **Ce nu acoperă planul:**
  - mesajele reale de chat;
  - notificările push;
  - reputația reală.

  Toate sunt non-obiective în specificație și rămân în `todo.md`.
