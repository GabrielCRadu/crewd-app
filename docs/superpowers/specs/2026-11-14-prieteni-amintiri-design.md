# Prieteni și amintiri pe Firestore — design

## De ce

Profilul complet al unui cont real (spec 2026-11-14-profil-membru-tema-design.md) arată doar ce e în Firestore: poza, numele, vârsta, orașul, „Despre”, tag-urile alese. Prieteniile și amintirile stau acum doar în memoria aplicației (cu persoane de test), deci nu le vede nimeni altcineva. Vrem ca, pentru conturile reale:

- să-ți poți adăuga prieteni (cerere → acceptare) și să-i vezi în lista ta;
- pe profilul altcuiva să vezi „N prieteni în comun” și amintirile lui (cele „doar prieteni” numai dacă sunteți prieteni);
- amintirile tale să rămână salvate și să le vadă ceilalți.

## Obiective

1. Prietenii reale: cerere, acceptare, refuz, anulare, eliminare, blocare / deblocare; cererile primite apar live (notificarea din colț existentă).
2. Pe profilul complet al unui cont real: butonul de prietenie, „N prieteni în comun” și amintirile vizibile ție.
3. Amintiri reale: adaugi o poză la un eveniment la care te-ai înscris și s-a terminat, cu vizibilitate „toți” / „doar prieteni”; o poți șterge sau schimba vizibilitatea; apar pe profilul tău și pe al tău văzut de alții.

## Non-obiective

- Lista completă de prieteni a altcuiva sau numărul total: **nu** se arată (decizia utilizatorului: doar prietenii în comun).
- Badge-uri, „ce spun alții”, harta prietenilor, „Merge la”, mesajele directe între conturi reale: rămân ca acum (date de test).
- Notificări push (Expo Go nu le suportă); cererile apar doar cât aplicația e deschisă.
- Mutarea persoanelor de test în Firestore: ele rămân în memorie, ca acum, alături de conturile reale.

## Anti-obiective

- Să afle cineva că l-ai blocat.
- Să poată cineva citi lista de prieteni a unui străin sau amintirile „doar prieteni” ale cuiva cu care nu e prieten.
- Profilul să încarce toate pozele mari ale cuiva doar ca să afișeze grila.

## Constrângeri

- Firebase pe planul gratuit: **fără Cloud Functions, fără Firebase Storage**. Tot ce se verifică, se verifică în `firestore.rules`; pozele stau în documente Firestore ca data URI JPEG (limita unui document: 1 MB).
- Expo Go (fără module native noi). Firebase JS SDK.
- Regulile le publică utilizatorul; proiectul Firebase e comun echipei.
- Ecranele nu vorbesc direct cu Firestore: servicii în `src/services/`, hook-uri în `src/hooks/`.
- Interfața în română, cu `tr()` și cheile în `src/i18n/en.ts`.

## Abordări luate în calcul (prietenii în comun)

1. **Aleasă.** O prietenie **încheiată** (`friends`) poate fi citită de cele două persoane **și de prietenii oricăreia dintre ele**; cererile în așteptare le văd doar cei doi. Pentru „în comun cu X”, telefonul tău verifică, pentru fiecare prieten Y al tău, dacă există prietenia Y–X. Costă o citire pentru fiecare prieten al tău, la deschiderea unui profil. **Preț acceptat de utilizator:** un prieten al lui Y poate verifica dacă Y e prieten cu orice cont pe care îl cunoaște (din grupuri, chat), nu doar pe profilurile deschise; fără server nu se poate altfel.
2. Fiecare își publică lista de prieteni, citibilă doar de prietenii lui: nu merge, pentru că nu ești prieten cu X, deci nu-i poți citi lista.
3. Fără prieteni în comun: cel mai simplu, dar pierde rândul „în comun” cerut.

## Date (Firestore)

### `friendships/{pairId}`

- `pairId` = cele două uid-uri sortate, unite cu `_` (`min_max`); determinist, deci nu pot exista două documente pentru aceeași pereche.
- Câmpuri: `users: [uidA, uidB]` (sortate, ca în id), `status: 'pending' | 'friends'`, `requestedBy` (uid), `createdAt`, `updatedAt` (ora serverului).
- Ciclul:
  - cerere: creezi documentul cu `status: 'pending'`, `requestedBy: tu`;
  - acceptare: celălalt (nu `requestedBy`) schimbă doar `status` în `'friends'`;
  - refuz / anulare / eliminare: oricare dintre cei doi șterge documentul;
  - „Vă potriviți” (amândoi „Aș mai ieși”) rămâne pe datele de test; nu face parte din acest design.
- Reguli:
  - Cele două uid-uri se iau din `pairId` (sortate, separate prin `_`), nu din `resource.data`, ca regulile să meargă și pe documente care nu există (`get` la „în comun”, ștergerea în batch-ul de blocare).
  - `get`: cei doi; sau, doar dacă documentul are `status == 'friends'`, un utilizator care are prietenie `friends` cu unul dintre ei (pentru „în comun”).
  - `list`: doar interogarea `users array-contains <uid-ul tău>` (îți vezi propriile relații).
  - `create`: tu ești în `users` și ești `requestedBy`, `status == 'pending'`, id-ul corespunde perechii sortate, celălalt nu te-a blocat și nici tu pe el, nu există deja documentul.
  - `update`: doar acceptarea descrisă mai sus (doar `status` și `updatedAt` se schimbă, de la `pending` la `friends`, de către celălalt).
  - `delete`: oricare dintre cei doi.

### `blocks/{blockerUid_blockedUid}`

- Câmpuri: `blocker`, `blocked`, `createdAt`.
- Îl citește și îl șterge doar cel care a blocat; regulile îl folosesc (prin `exists`) **doar** ca să refuze cererile de prietenie în ambele direcții. Citirile („în comun”, amintirile „toți”) nu țin cont de blocare, ca cel blocat să nu vadă refuzuri în plus; amintirile „doar prieteni” dispar oricum pentru el, pentru că blocarea șterge prietenia.
- **Limită acceptată de utilizator:** regulile pot doar permite sau refuza, deci cine e blocat primește refuz la fiecare cerere și ar putea deduce blocarea; în aplicație, refuzul arată ca o eroare de rețea.
- Blocarea: creezi documentul și ștergi prietenia/cererea dintre voi (dacă există), în același batch.
- Cel blocat nu află: o cerere nouă spre cine l-a blocat eșuează în reguli, iar aplicația îi arată același mesaj neutru ca la o eroare de rețea („Nu am putut trimite cererea. Încearcă mai târziu.”).

### `memories/{ownerUid}/items/{memoryId}` și `memories/{ownerUid}/photos/{memoryId}`

(Proprietarul e în cale, ca regulile și interogările să fie simple; alegerea mea.)

- `items/{memoryId}` — câmpuri: `ownerUid`, `eventId`, `eventTitle`, `eventDate` (Timestamp), `visibility: 'everyone' | 'friends'`, `thumb` (data URI JPEG, ~320px, ≤ 40 000 caractere), `createdAt`.
- `photos/{memoryId}` (același id): `ownerUid`, `visibility` (copiat, ca regulile să nu mai citească alt document), `photo` (data URI JPEG, ~1080px, ≤ 700 000 caractere).
- Adăugare: ambele documente în același batch.
- Reguli:
  - citire (`get` și `list`): proprietarul; oricine logat dacă `visibility == 'everyone'`; prietenii proprietarului (prietenia `friends` există) dacă `visibility == 'friends'`.
  - Interogările din aplicație trebuie să poată fi dovedite de reguli: pe profilul altcuiva se cer separat, în `memories/{X}/items`, `visibility == 'everyone'` și, doar dacă sunteți prieteni, `visibility == 'friends'`.
  - `create`: `ownerUid` ești tu, câmpuri fixe și limitele de mărime, pozele sunt `data:image/jpeg;base64`, `eventId` e un text scurt. **Regulile nu verifică dacă ai fost la eveniment** (decizia utilizatorului): singurele evenimente încheiate acum sunt cele demo, care nu sunt în Firestore și nici în înscrierile salvate. Verificarea o face aplicația (foaia „Adaugă amintire” oferă doar evenimentele la care ai fost); prețul: o aplicație modificată ar putea pune o amintire la un eveniment la care n-a fost.
  - `update`: doar proprietarul, doar `visibility` (în ambele documente, același batch).
  - `delete`: doar proprietarul (ambele documente).
- Limită: cel mult 50 de amintiri pe cont, verificată în aplicație (fără numărare pe server; e o protecție de bun-simț, nu de securitate).

## Aplicația

### Servicii și hook-uri

- `friendsService.ts` păstrează aceeași interfață pentru ecrane (`FriendsState`, `statusOf`, `idsWithStatus`, `sendFriendRequest`, …). Starea combină:
  - persoanele de test (în memorie, ca acum, inclusiv cererea demo de la Tudor);
  - conturile reale, din `onSnapshot` pe `friendships` (`users array-contains` tu) și pe `blocks` ale tale, pornit după login și oprit la logout.
- Acțiunile pe un id de persoană de test lucrează în memorie; pe un uid real, scriu în Firestore (starea se actualizează din snapshot, cu actualizare optimistă locală).
- O cerere nouă primită live (document `pending` cu `requestedBy` ≠ tu, apărut după primul snapshot) declanșează notificarea existentă (`announce({ kind: 'request' })`).
- `useMutualFriends(uid)`: pentru un cont real, verifică prieteniile tale `friends` cu conturi reale contra lui X (citiri `get` pe `friendships/{Y_X}`, în paralel; un refuz sau „nu există” înseamnă „nu e în comun”) și întoarce lista uid-urilor în comun.
- `memoriesService.ts`: amintirile tale reale din Firestore (`ownerUid == tu`, prin `onSnapshot`), plus cele de test; `memoriesOfUser(uid, isFriend)` pentru profilul altcuiva (cele două interogări de mai sus); poza mare se încarcă doar la deschiderea amintirii (`memories/{X}/photos/{id}`).
- Pozele: `pickMemoryPhoto` produce deja poza; se adaugă redimensionarea la ~1080px (poza mare) și ~320px (miniatura), ca data URI, prin `expo-image-manipulator` (deja folosit pentru poza de profil).
- `deleteAccount` (AuthContext): șterge și prieteniile, blocările și amintirile tale înainte de profil.

### Ecrane

- **Profilul complet** (`UserProfileView`, din grup, chat și codul QR): sub identitate, butonul de prietenie (`FriendButton`, aceleași stări ca la persoanele de test: Adaugă / Cerere trimisă / Acceptă / Prieteni), rândul „N prieteni în comun” (ascuns la 0) și meniul „…” cu Blochează / Deblochează. Apoi secțiunea „AMINTIRI” (grila existentă `MemoriesGrid`), ascunsă dacă nu vezi nicio amintire. Cine nu e prieten nu poate afla dacă există amintiri „doar prieteni” (regulile refuză orice interogare pe ele), deci nu apare nicio notă despre ele.
- Nota „Adăugarea la prieteni vine în curând.” de pe profilul din codul QR dispare.
- **Lista ta de prieteni** (`FriendsListScreen`): cererile primite, prietenii și cererile trimise includ și conturile reale, cu numele și poza din profilul lor public; apăsarea deschide profilul complet.
- **Profilul tău**: numărul de prieteni include conturile reale; amintirile tale reale apar în grilă.
- **Adaugă amintire** (foaia existentă): salvează în Firestore pentru conturile reale; arată progresul și o eroare clară dacă salvarea eșuează.

### Unde se deschide profilul unui prieten real

Lista ta de prieteni și cererile sunt în stiva Profil: ecranul profilului complet se înregistrează și acolo (rută nouă `UserProfile: { uid }`), folosind `UserProfileView`.

## Ce s-a decis

- Doar prietenii în comun se văd pe profilul altcuiva (utilizatorul).
- Abordarea 1 pentru „în comun” (utilizatorul).
- Pozele amintirilor în Firestore, în două documente (miniatură + poză mare), fără Storage (constrângere a utilizatorului, propunerea mea).
- Blocarea oprește doar cererile, în ambele direcții; secretă în aplicație, nu și la nivel de reguli (utilizatorul).
- Prieteniile văzute de alții: doar cele încheiate; prețul „verificării” prin prieteni e acceptat (utilizatorul).
- Regulile nu verifică participarea la eveniment pentru amintiri (utilizatorul).
- `visibility` ținut la fel în cele două documente ale unei amintiri (regulile verifică cu `getAfter`; alegerea mea).

## Lăsat constructorului

- Cum se îmbină starea de test cu cea reală în `friendsService` (ex. două surse, combinate la citire).
- Mesajele exacte de eroare (în ton cu restul aplicației) și stările de încărcare.
- Calitatea JPEG exactă, cu condiția limitelor de mărime de mai sus.
