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
- Fluxul (`src/context/AuthContext.tsx` + `src/navigation/RootNavigator.tsx`): sesiune → **Login / Creare cont** → **onboarding** (2 pași, `docs/layout-guide.md`) → tab-uri. Login-ul e obligatoriu.
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
| `photoUrl` | string \| null | poza de profil ca data URI JPEG mic (maxim ~300 KB) |
| `joinedEventIds` | string[] | evenimentele la care e înscris; se salvează la fiecare „Înscrie-te” / „Anulează” |
| `tagScores` | map | scorul fiecărui tag (crește la înscriere, scade la anulare); pornește de la tag-urile din profil |
| `chosenTags` | map | `{ events: string[], music: string[], hobbies: string[] }`, tag-urile din `src/data/tags.ts` |
| `learnedTags` | string[] | tag-uri adăugate automat din înscrieri; se pot scoate din Profil |
| `createdAt`, `updatedAt` | Timestamp | |

### `meta/eventsImport`

Data colectării, intervalul de date, numărul de evenimente, notele sursei și data importului.

## Cod

- `src/lib/firebase.ts`: inițializarea și `db` (sau `null` fără config).
- `src/services/eventsService.ts`: singurul loc care citește evenimentele. Ecranele folosesc `useEvents()`.
- `friendsGoing` și `lookingForCompanyCount` nu sunt încă în Firestore. Până la înscrieri reale, `eventsService` le generează pentru demo.

## Date și drepturi

Evenimentele importate acum sunt preluate de pe paginile organizatorilor și ale platformelor de bilete, cu sursa în `sourceUrl`. Sunt **doar pentru demo intern**, cu atribuire vizibilă. Înainte de o lansare publică trebuie cerut acordul surselor (vezi notele din fișierul de date).
