# Username unic, parolă mai puternică, poză obligatorie — design

## De ce

- Codul QR de pe profil (făcut de Cami) pune acum în link uid-ul intern (`crewd://invite/<uid>`). Vrem ca **în QR să fie un username unic**, ales de om, pe care îl poate arăta oricui. Asta e ideea: QR-ul te reprezintă prin `@username`, nu printr-un id intern.
- Aplicația duce la întâlniri cu necunoscuți: vrem **încredere** — fiecare cont are o **poză de profil** (obligatorie la înscriere, nu se poate șterge, doar înlocui) și o **parolă mai puternică**.

## Ce e

1. **Parola** la crearea contului: minim 8 caractere, cel puțin o literă mică și cel puțin o literă mare. Pe ecranul „Creează cont” apare o listă de cerințe care se bifează pe măsură ce scrii.
2. **Username unic**, separat de numele afișat:
   - strict cu litere mici: `a–z`, cifre, `.` și `_`; 3–20 caractere; nu începe și nu se termină cu `.`/`_`;
   - câmpul transformă imediat orice majusculă în literă mică (nu poți scrie „Radu”, devine „radu”);
   - **unic**, iar `.` și `_` contează ca același caracter la verificare (`radu.g` și `radu_g` nu pot exista amândouă);
   - câteva nume **rezervate** nu pot fi luate (ex. `crewd`, `admin`, `support`, `moderator`, `official`);
   - **fix deocamdată**: odată ales nu se mai schimbă (un QR deja trimis sau printat rămâne valid);
   - ales la onboarding, cu verificare „disponibil / ocupat” în timp real și un ecran de confirmare („Așa te vor găsi ceilalți: @radu.g. Nu se mai poate schimba.”).
3. **Poza de profil obligatorie**:
   - pas nou în onboarding (după identitate, înainte de tag-uri), fără „Sari peste”;
   - în „Editează profilul” poza se poate **înlocui**, dar nu **șterge** (dispare „Șterge fotografia”);
   - rămâne 400×400 (data URI în profil, fără Firebase Storage).
4. **Conturile existente** fără username sau fără poză: după login apare un ecran „Completează-ți profilul” (username + poză) înainte de tab-uri; nu se poate trece peste.
5. **QR-ul** conține username-ul: `crewd://invite/<username>` (în Expo Go `exp://…/--/invite/<username>`); sub cod apare `@username`. Scanat, deschide o **fișă publică**: poza (miniatura), numele, `@username`. „Adaugă prieten” pe fișă vine când prietenii trec pe Firestore.
6. `@username` apare pe profilul tău, sub nume.

## Non-obiective

- Schimbarea username-ului (eventual mai târziu, cu redirecționare de la numele vechi).
- Verificarea că poza e chiar fața ta (detectare de față / moderare AI — mai târziu, pe backend).
- Moderarea username-urilor obscene (doar lista de nume rezervate acum).
- Căutarea oamenilor după username (doar deschiderea exactă din QR / link).
- Firebase Storage pentru poze; mutarea prietenilor pe Firestore.
- Schimbarea parolei din aplicație (resetarea rămâne prin email, pe pagina Firebase).

## Anti-obiective

- Doi oameni cu același username (inclusiv „aproape același”: `radu.g` / `radu_g`).
- Oricine logat poate **lista** toate username-urile cu nume și poze (scraping). Se permite doar căutarea exactă a unui username.
- Un cont nou fără poză; o poză ștearsă după înscriere.
- Profilul privat (`users/{uid}`) devine citibil de alții.
- Cod care vorbește direct cu Firestore din ecrane (doar `src/services` + `src/hooks`, AGENTS.md); culori puse direct în ecrane (doar tokenii din `src/theme`).

## Constrângeri

- Expo SDK 58, Firebase JS SDK (Auth + Firestore), fără Cloud Functions (plan gratuit) — unicitatea se garantează cu reguli Firestore + scriere atomică din client.
- Regulile le **publică utilizatorul** în consolă.
- Fără Firebase Storage: poza rămâne data URI JPEG 400×400 în `users/{uid}.photoUrl`. Limita din reguli rămâne 600 000 de caractere (unii au deja poze de 1080px salvate de la PR #15; dacă limita scade, nu și-ar mai putea salva profilul).
- `src/services/photoService.ts`: poza de profil revine la 400px (de la 1080px, schimbarea lui Cami din PR #15). Poza mărită (`PhotoViewer`) va fi mai puțin clară — de anunțat Cami.
- Fără `.env.local` (mock): username-uri și poze pentru persoanele de test (`PEOPLE`), unicitate în memorie.

## Ce s-a decis

### Date

- `usernames/{key}` — **cheia** e forma canonică a username-ului: `username` cu `.` înlocuit de `_` (ex. `radu.g` → `radu_g`). Câmpuri: `username` (forma aleasă, ex. `radu.g`), `uid`, `name`, `photoThumb` (miniatura ~96px sau null).
- `users/{uid}.username` — username-ul (forma aleasă).
- Crearea profilului (onboarding) și alegerea username-ului (cont existent) se fac într-o **tranzacție** care scrie împreună `users/{uid}` și `usernames/{key}`; dacă `usernames/{key}` există deja, tranzacția eșuează cu „Username-ul e deja luat”.
- La schimbarea pozei: miniatura se actualizează și în `usernames/{key}` (lângă `members[uid].photo` din grupuri). La schimbarea numelui: și `name` din `usernames/{key}`.
- La ștergerea contului: se șterge și `usernames/{key}` (numele se eliberează).

### Reguli Firestore (de publicat de utilizator)

- `usernames/{key}`:
  - `get` pentru orice utilizator logat; `list`: interzis.
  - `create`: doar pentru tine (`uid == request.auth.uid`), cheia are formatul canonic valid și nu e rezervată, `username` canonicalizat == cheia, iar `getAfter(users/{uid}).username == username` (scris în aceeași tranzacție).
  - `update`: doar al tău, doar `name` și `photoThumb`.
  - `delete`: doar al tău.
- `users/{uid}`:
  - la creare: `username` obligatoriu (format valid) și `photoUrl` obligatoriu (string, nu null);
  - la actualizare: `username` se poate seta o singură dată (dacă lipsea) și nu se mai schimbă; `photoUrl` nu poate trece din string în null.
- Parola: aceeași regulă se activează în **Firebase Console → Authentication → Settings → Password policy** (de utilizator), ca să se aplice și la resetare; modul ales nu trebuie să blocheze login-ul conturilor existente.

### Interfața

- **Creează cont**: sub câmpul de parolă, trei rânduri care se bifează: „Minim 8 caractere”, „O literă mică”, „O literă mare”; butonul „Creează cont” refuză parola până sunt toate bifate.
- **Onboarding pas 1 (Identitate)**: câmp nou „Username” sub „Nume”, cu prefix `@`, litere mici forțate, mesaj „disponibil” / „ocupat” / „format invalid”.
- **Onboarding pas 2 (Poză, nou)**: „Adaugă o poză cu tine” — cameră sau galerie, decupare pătrată; „Continuă” activ doar cu poză. Pașii devin 3 (identitate, poză, tag-uri).
- **Confirmarea username-ului**: la finalul onboarding-ului (sau pe ecranul pentru conturi existente), o confirmare „Așa te vor găsi ceilalți: @… Nu se mai poate schimba.” cu „Confirm” / „Schimb”.
- **Completează-ți profilul** (conturi existente): username (dacă lipsește) + poză (dacă lipsește), apoi tab-urile.
- **Profil**: `@username` sub nume. **Editează profilul**: fără „Șterge fotografia”.
- **QR** (`InviteQrSheet`): linkul cu username-ul și `@username` sub cod.
- **Fișa publică** (deschisă din link): poza (miniatura), numele, `@username`; dacă username-ul nu există: „Contul nu mai există.”

## Ce rămâne la latitudinea celui care construiește

- Numele fișierelor/funcțiilor (ex. `usernameRules.ts`, `usernamesService.ts`, `PublicProfileScreen`), cu logica pură testată (validarea parolei, validarea/canonicalizarea username-ului, numele rezervate).
- Cum se face verificarea „disponibil” (ex. `getDoc` cu întârziere de ~400 ms după ce te oprești din scris).
- Unde stă fișa publică în navigare (ex. un ecran în stiva tab-ului curent).
- Lista exactă de nume rezervate (scurtă).

## Decizii luate de mine (de verificat)

- `.` și `_` socotite la fel la unicitate; nume rezervate; căutare doar exactă (fără listare); confirmare înainte de salvare.
- Fișa publică arată miniatura (~96px), nu poza mare (poza mare rămâne privată în `users/{uid}`).
- La ștergerea contului username-ul se eliberează.
- Limita pozei rămâne 600 000 de caractere, deși pozele noi sunt 400px.
- Persoanele de test primesc username-uri derivate din nume (ex. `maria`, `andrei`).
- Link către o persoană de test (mock): deschide în continuare profilul ei complet (`PersonProfileScreen`, cu „Adaugă prieten”), ca demo-ul să rămână; doar conturile reale deschid fișa publică.
- Ordinea de publicare: regulile noi se publică abia după ce PR-ul e unit pe `main` (nu există încă APK-uri la testeri; colegii trebuie să-și aducă branch-urile la zi cu `main`, altfel înscrierea din codul lor vechi e refuzată). Linkurile vechi `invite/<uid>` nu mai sunt suportate (QR-ul cu uid a existat doar câteva ore).
- `RootNavigator.tsx`: se lucrează după integrarea branch-urilor lui Cami (`cami/swipe-tabs` îl rescrie), cu adăugiri minime.
