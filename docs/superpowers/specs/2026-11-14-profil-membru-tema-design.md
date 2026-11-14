# Profilul unui membru din grup și tema din Setări — design (scurt)

## De ce

- În Detaliile grupului vezi lista membrilor, dar nu poți afla mai mult despre ei. Vrei să deschizi profilul unui membru apăsând pe el.
- Tema (luminoasă / întunecată) urmează doar setarea telefonului. Vrei să o alegi din Setări: Luminoasă / Întunecată / Ca telefonul.

## Ce e

1. **Profilul membrului.** În „Membri · N” (Detaliile grupului), fiecare rând (în afară de „tu”) e apăsabil:
   - persoană de test (`PEOPLE`) → profilul ei complet (`PersonProfile`), ca în restul aplicației;
   - cont real → ecran nou „Profilul membrului”: poza, numele, vârsta, `@username` (dacă e cunoscut), tag-urile, „a propus grupul” (dacă e cazul).
   - Datele vin din grup (`members[uid]`), nu din profilul privat. `MemberSummary` primește `username` (sau `null`), copiat la intrare / propunere; regulile Firestore nu se schimbă (nu validează câmpurile din intrare în afară de `photo`). Membrii intrați înainte nu au `@username`.
2. **Tema din Setări.** Secțiune „TEMĂ” cu un comutator „Luminoasă | Întunecată | Ca telefonul” (implicit „Ca telefonul”). Alegerea se salvează pe telefon (AsyncStorage) și aplicația se reîncarcă imediat cu `reloadAppAsync()` din `expo` (merge în release și în debug, după documentația SDK 58). La pornire, tema salvată se citește **înainte** să se încarce ecranele, pentru că `src/theme/colors.ts` calculează culorile o singură dată, la încărcare.

## Non-obiective

- Badge-uri, amintiri și prieteni pentru conturile reale (rămân doar la persoanele de test până trec în Firestore).
- „Adaugă prieten” din profilul membrului (vine cu prietenii pe Firestore).
- Tema schimbată fără reîncărcare (ar cere ca toate stilurile să fie dinamice).

## Ce s-a decis

- `src/theme/themePreference.ts`: `ThemePreference = 'light' | 'dark' | 'system'`, `resolveColorScheme(pref, systemScheme)` (pur, testat), citire/salvare în AsyncStorage, valoarea curentă în memorie.
- `index.ts` înregistrează o componentă mică de pornire care citește preferința, apoi încarcă `App` (`require`), ca `colors.ts` să știe tema la încărcare. `colors.ts` folosește `resolveColorScheme(getThemePreference(), Appearance.getColorScheme())`.
- `app.json` rămâne `userInterfaceStyle: "automatic"`.
- Ecranul nou stă în stiva tab-ului Chat (`MemberProfile: { eventId, groupId, uid }`), fără bara de jos.

## Decizii luate de mine

- Rândul „tu” nu e apăsabil. Membrii de test din grupurile demo din Firestore (`demo-*`) deschid „Profilul membrului” cu ce știe grupul.
- Pe ecranul profilului membrului, poza e miniatura din grup (~96 px), afișată la 112 px.

## Completare: profilul complet al conturilor reale, tema peste tot, avatarele din chat

Cerut după prima variantă: „vreau ca apăsarea pe un membru să deschidă profilul lui complet”; vizibil pentru **orice utilizator logat**; conținut: **ce e real acum**. Apoi: tema să se aplice în toată aplicația și imediat (chiar cu repornire), iar avatarele mici din chat să deschidă profilul.

### Profilul public: `profiles/{uid}`

- Câmpuri: `name`, `age` (calculată, fără data nașterii), `city`, `bio`, `photoUrl` (poza de ~400px, data URI JPEG), `username` (sau `null`), `tags` (tag-urile alese + cele învățate), `updatedAt`. Emailul, data nașterii, genul, înscrierile și scorurile rămân private în `users/{uid}`.
- Reguli: `get` pentru orice utilizator logat, `list` interzis. Scrie și șterge doar proprietarul; câmpuri fixe, limite de mărime (aceleași ca în `users/`), poza trebuie să fie `data:image/jpeg;base64`, iar `username` (dacă e pus) trebuie să fie al tău în `usernames/`. Regulile le publică utilizatorul.
- Ținut la zi din AuthContext: de câte ori profilul tău (complet) se schimbă în aplicație, se rescrie documentul public, doar dacă s-a schimbat ceva. Asta acoperă crearea contului, completarea profilului, „Editează profilul”, „Despre mine”, tag-urile învățate și conturile existente (la primul login după actualizare). La ștergerea contului se șterge și el.

### Ecranul

- Din lista de membri (Detaliile grupului) și din chat-ul grupului: persoană de test → `PersonProfile`, ca până acum; cont real → profilul complet: poza mare (se mărește la apăsare), numele, vârsta și orașul, `@username`, „Despre”, tag-urile (cele comune cu tine evidențiate), plus „A propus grupul” / „În grupul tău pentru …”.
- Din codul QR (`PublicProfile`): același profil complet, cu nota „Adăugarea la prieteni vine în curând.”
- Fără profil public încă (cont care nu s-a mai logat, membri demo): se arată ce știe grupul (sau fișa username-ului).
- În chat-ul grupului, avatarul mic și numele de deasupra bulei sunt apăsabile. Autorul care a ieșit din grup își păstrează profilul (se deschide după `uid`).

### Tema în toată aplicația

- Alegerea din Setări se dă și sistemului (`Appearance.setColorScheme`: `light` / `dark` / `unspecified` pentru „Ca telefonul”), la pornire și la schimbare. Așa dialogurile native, tastatura și calendarele urmează tema aleasă, nu pe cea a telefonului.
- Calendarele de dată (data nașterii, ora întâlnirii) folosesc tema activă, nu „dark” fix.
- Fundalul de sub ecrane (`expo-system-ui`) ia culoarea temei, ca să nu clipească alb/negru la tranziții.
- Schimbarea se aplică imediat: aplicația se reîncarcă singură (`reloadAppAsync`).
