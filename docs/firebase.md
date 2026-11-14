# Firebase în Crewd

Aplicația folosește **Firebase JS SDK** (pachetul `firebase`, versiunea 12 sau mai nouă), care merge în Expo Go fără cod nativ ([ghidul Expo](https://docs.expo.dev/guides/using-firebase/)). Acum folosim doar **Firestore**, pentru evenimente.

## Configurare locală (o singură dată per calculator)

1. Copiază `.env.example` în `.env.local` și completează valorile din Firebase Console → Project settings → General → Your apps → aplicația **Web** → *SDK setup and configuration* → *Config*.
2. Repornește Metro (`npx expo start --localhost`), ca să preia variabilele.

Fără `.env.local`, aplicația merge în continuare, cu datele mock din `src/data/mockEvents.ts`.

`.env.local` nu se urcă pe GitHub. Config-ul web nu e secret, dar îl ținem în afara codului. Securitatea vine din regulile Firestore.

## Autentificare

- **Email + parolă**, prin Firebase Auth (SDK-ul JS, merge în Expo Go). Trebuie activat o singură dată: Firebase Console → Authentication → Sign-in method → **Email/Password** → Enable.
- Sesiunea se păstrează în AsyncStorage (`initializeAuth` + `getReactNativePersistence`, după [expo.fyi/firebase-js-auth-setup](https://expo.fyi/firebase-js-auth-setup)), deci rămâi logat după repornire.
- Fluxul (`src/context/AuthContext.tsx` + `src/navigation/RootNavigator.tsx`): sesiune → **Login / Creare cont** → **onboarding** (3 pași: identitate cu username, poză, tag-uri) → tab-uri. Conturile vechi fără username sau poză trec întâi prin „Completează-ți profilul”. Login-ul e obligatoriu.
- **Parola**: minim 8 caractere, o literă mică și o literă mare (`src/utils/passwordRules.ts`). Ca regula să se aplice și la resetarea parolei, se activează și în Firebase Console → Authentication → Settings → **Password policy** (aceleași cerințe), cu modul care nu blochează login-ul conturilor existente.
- Fără `.env.local`, aplicația sare peste login și folosește profilul mock.
- **Google**: nu merge în Expo Go (cere cod nativ, adică un development build). Se adaugă după ce avem un build nativ (EAS în cloud sau local).

## Regulile Firestore

Fișierul [`firestore.rules`](../firestore.rules) permite oricui să citească `events/` și `meta/`, și interzice scrierea lor din aplicație. Fiecare utilizator logat își poate citi și scrie doar propriul `users/{uid}`, cu validare: la creare, data nașterii trebuie să dea minimum 18 ani; la orice modificare, **data nașterii și genul trebuie să rămână neschimbate**. Se aplică din Firebase Console → Firestore Database → Rules (lipești tot fișierul și apeși *Publish*).

## Importul evenimentelor

Evenimentele se scriu doar prin `scripts/import-events.mjs`, cu `firebase-admin` și cheia unui cont de serviciu.

1. Firebase Console → Project settings → **Service accounts** → *Generate new private key*. Salvează fișierul în rădăcina proiectului ca `service-account.json`. E **secret**: e în `.gitignore`, nu îl trimite nimănui și nu îl urca nicăieri.
2. Pune fișierul cu evenimente în rădăcina proiectului (implicit `evenimente-timisoara-verificate.json`, tot în `.gitignore`).
3. Verifică întâi, fără să scrii nimic:
   ```bash
   node scripts/import-events.mjs --dry-run
   ```
   Dacă evenimentul are `geolocation` (latitude, longitude, precision, note), scriptul folosește direct acele coordonate. Altfel află coordonatele locurilor prin Nominatim (OpenStreetMap, maxim o cerere pe secundă) și le păstrează în `scripts/data/geocode-cache.json`. Un loc greșit se corectează acolo, apoi rulezi din nou. Previzualizarea e în `scripts/data/events-preview.json`.
4. Importă:
   ```bash
   node scripts/import-events.mjs          # adaugă sau actualizează (id-ul documentului = id-ul evenimentului)
   node scripts/import-events.mjs --prune  # în plus, șterge evenimentele care nu mai sunt în fișier
   ```

## Schema

### `events/{id}`

| Câmp | Tip | Note |
| --- | --- | --- |
| `title` | string | |
| `description` | string | poate fi gol |
| `type` | string | tipul original (`concert`, `teatru`, `stand-up`, `petrecere`, `workshop`, `atelier`, `socializare`) |
| `category` | string | `CategoryId` din `src/types/events.ts` |
| `tags` | string[] | tag-uri de profil (`src/data/tags.ts`), folosite la preferințe |
| `keywords` | string[] | tag-urile originale |
| `startsAt` | Timestamp | |
| `endsAt` | Timestamp \| null | null = neanunțat. Aplicația estimează din `durationMinutes` sau 3 ore |
| `doorsOpenAt` | Timestamp \| null | |
| `timeNote` | string \| null | ex. „Accesul de la 20:00” |
| `durationMinutes`, `durationText` | number \| null, string \| null | |
| `venueName`, `address`, `city` | string | |
| `location` | GeoPoint | din `geolocation` al evenimentului, altfel din geocodare |
| `locationApproximate` | boolean | true = pinul poate fi la câteva sute de metri de intrare (precizie `street`/`area`/`locality`, sau centrul orașului când n-am găsit locul) |
| `locationPrecision` | string \| null | `venue`, `address`, `building`, `landmark`, `street`, `area`, `locality`; null la geocodarea din script |
| `locationNote` | string \| null | explicație pentru poziție (ex. „Aceeași clădire ca Opera”) |
| `organizer` | string \| null | |
| `price` | map \| null | `{ isFree, min, max, currency, label, soldOut }` |
| `ageRestriction` | string \| null | |
| `imageUrl`, `imageCredit` | string, string \| null | |
| `sourceName`, `sourceUrl` | string | **atribuire**, afișată în pagina de detalii |
| `ticketUrl` | string \| null | butonul „Bilete” / „Înscriere” |
| `importedAt` | Timestamp | |

### `users/{uid}`

Creat la finalul onboarding-ului (`src/services/profileService.ts`).

| Câmp | Tip | Note |
| --- | --- | --- |
| `name` | string | 1–50 caractere |
| `birthDate` | Timestamp | miezul nopții UTC din ziua nașterii; minim 18 ani (verificat de reguli). **Nu se poate schimba după onboarding.** Vârsta se calculează în aplicație. Profilurile vechi au în loc `age` (number). |
| `city` | string | |
| `gender` | string | `female`, `male` sau `other`. **Nu se poate schimba după onboarding.** |
| `bio` | string | „Despre mine”, maxim 500 de caractere |
| `username` | string | username-ul unic, strict litere mici (3–20: `a–z`, cifre, `.`, `_`); se alege o singură dată și nu se mai schimbă. Rezervat în aceeași tranzacție în `usernames/` |
| `photoUrl` | string | poza de profil ca data URI JPEG 400×400 (maxim 600 000 de caractere); **obligatorie** la profilurile noi și nu se poate șterge, doar înlocui |
| `photoThumb` | string \| null | miniatura pozei (~96 px, data URI JPEG, maxim 20 000 caractere), copiată în `members.<uid>.photo` din grupurile în care e utilizatorul |
| `joinedEventIds` | string[] | evenimentele la care e înscris; se salvează la fiecare „Înscrie-te” / „Anulează” |
| `tagScores` | map | scorul fiecărui tag (crește la înscriere, scade la anulare); pornește de la tag-urile din profil |
| `chosenTags` | map | `{ events: string[], music: string[], hobbies: string[] }`, tag-urile din `src/data/tags.ts` |
| `learnedTags` | string[] | tag-uri adăugate automat din înscrieri; se pot scoate din Profil |
| `createdAt`, `updatedAt` | Timestamp | |

În plus, `groupByEvent` (map `eventId → groupId`): grupulețul în care e utilizatorul la fiecare eveniment. Se scrie în aceeași tranzacție cu grupulețul (`src/services/groupsService.ts`).

### `events/{eventId}/groups/{groupId}`

Grupulețele unui eveniment (`docs/superpowers/specs/2026-11-13-grupulete-design.md`). Le citește orice utilizator logat. Le scriu doar tranzacțiile din `groupsService.ts`, iar regulile verifică aceleași limite ca `src/utils/groupRules.ts`.

| Câmp | Tip | Note |
| --- | --- | --- |
| `eventId`, `proposerUid` | string | |
| `meetupAt` | Timestamp | ora întâlnirii; propunerea trebuie făcută cu cel puțin 30 min înainte |
| `meetupPlace` | string | 1–80 caractere |
| `minAge`, `maxAge` | number (int) | interval de vârstă; minim 18; cel care intră trebuie să se încadreze (vârsta din `users.birthDate`) |
| `maxSize` | number (int) | 3–10 |
| `vibe` | string | 1–120 caractere |
| `tags` | string[] | tag-urile comune ale celui care propune cu evenimentul |
| `memberUids` | string[] | membrii; maxim `maxSize` |
| `members` | map | `uid → { name, age, tags, photo }`, copiat de fiecare membru la intrare (fără email); `photo` e miniatura lui sau `null`, iar membrul și-o poate actualiza singur |
| `createdAt` | Timestamp | |
| `formedAt` | Timestamp \| null | când a ajuns prima dată la 3 membri; odată setat, grupul rămâne format |

Starea (în formare, format, complet, expirat, închis) nu e salvată: se calculează din aceste câmpuri și din oră (`groupStatus`).

### `events/{eventId}/groups/{groupId}/messages/{messageId}`

Conversația grupului (`docs/superpowers/specs/2026-11-14-chat-grup-design.md`). O citesc și o scriu doar membrii (`memberUids`); un mesaj nu se poate modifica sau șterge din aplicație. Câmpuri: `authorUid` (cine a scris, trebuie să fie utilizatorul logat), `authorName` (numele de la trimitere, 1–50 caractere), `text` (1–1000 caractere) și `createdAt` (ora serverului). Scrie `src/services/chatService.ts`.

### `usernames/{key}`

Username-urile unice (`docs/superpowers/specs/2026-11-14-username-parola-design.md`). Cheia e forma canonică a username-ului (`.` înlocuit cu `_`), ca `radu.g` și `radu_g` să nu poată exista amândouă. Câmpuri: `username` (forma aleasă), `uid`, `name`, `photoThumb` (miniatura sau `null`) — fișa publică deschisă din codul QR. Orice utilizator logat poate citi un username exact (`get`), dar nu poate lista colecția. Se creează doar împreună cu `users/{uid}.username`, se actualizează doar `name` și `photoThumb`, iar la ștergerea contului se șterge (username-ul se eliberează). Scrie `src/services/usernamesService.ts`.

### `meta/eventsImport`

Data colectării, intervalul de date, numărul de evenimente, notele sursei și data importului.

## Cod

- `src/lib/firebase.ts`: inițializarea și `db` (sau `null` fără config).
- `src/services/eventsService.ts`: singurul loc care citește evenimentele. Ecranele folosesc `useEvents()`.
- `friendsGoing` și `lookingForCompanyCount` nu sunt încă în Firestore. Până la înscrieri reale, `eventsService` le generează pentru demo.

## Date și drepturi

Evenimentele importate acum sunt preluate de pe paginile organizatorilor și ale platformelor de bilete, cu sursa în `sourceUrl`. Sunt **doar pentru demo intern**, cu atribuire vizibilă. Înainte de o lansare publică trebuie cerut acordul surselor (vezi notele din fișierul de date).
