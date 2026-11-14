# Chatul de grup în Firestore — design

## De ce

Grupurile de la evenimente există deja în Firestore, dar conversația lor e mock (`MESSAGES` din `src/data/mockSocial.ts`, mesajele trimise rămân doar pe ecranul deschis). Vrem un chat de grup real, ca pe orice altă aplicație, ca oamenii dintr-un grup să se poată organiza înainte de eveniment. E și baza pentru moderarea automată cu AI, care vine mult mai târziu.

## Ce e

- Un **chat de grup clasic**, doar între membrii grupului (`memberUids`). Mesajele stau în Firestore și apar în timp real pe telefoanele tuturor.
- Se vede **clar cine ce scrie**: mesajele altora în stânga, cu numele autorului deasupra și o **miniatură a pozei lui de profil** (inițiala, dacă n-are poză); mesajele tale în dreapta, pe alb, fără nume și fără avatar.
- **Apăsând pe numele grupului** din antet se deschide un ecran nou, **Detaliile grupului**.
- În **toată aplicația**, textul vizibil spune **„grup”**, nu „grupuleț”.
- Grupurile de test (din `scripts/seed-groups.mjs`) au **mesaje inventate, scrise în Firestore**, ca demo-ul să nu pornească de la conversații goale.

## Obiective

1. Mesaje reale în Firestore, citite în timp real, trimise de membri.
2. Conversația arată ca în `docs/layout-guide.md` (Tab Chat → Conversația de grup) plus miniaturile de profil.
3. Ecranul Detaliile grupului.
4. Miniaturi de profil mici, disponibile tuturor membrilor fără acces la profilul privat (`users/{uid}`).
5. Redenumirea „grupuleț” → „grup” în textul vizibil.
6. Mesaje inventate în grupurile de test.

## Non-obiective (acum)

- Moderarea automată cu AI și traducerea (mult mai târziu, pe backend).
- Notificări push pentru mesaje noi; numărul de mesaje necitite.
- Poze, reacții, editarea sau ștergerea mesajelor.
- Chatul direct al lui Cami (`directMessagesService`, „trimite un eveniment unui prieten”): rămâne în memorie; trece pe Firestore odată cu prietenii.
- Deschiderea profilului unui membru din lista de membri (profilul public nu există încă; vine cu prietenii pe Firestore).

## Anti-obiective (ar fi un eșec chiar dacă „merge”)

- Oricine logat poate citi conversația unui grup în care nu e.
- Cineva poate scrie un mesaj în numele altcuiva.
- Documentul grupului se umflă spre limita de 1 MB din cauza pozelor.
- Ecranele vorbesc direct cu Firestore (regula din AGENTS.md: doar prin `src/services/*` și `src/hooks/`).
- Culori sau stiluri puse direct în ecrane (doar prin tokenii din `src/theme/`, stilul monocrom din `docs/design-language.md`).

## Constrângeri

- Expo SDK 58, React Native, Firebase JS SDK (Firestore, Auth), Expo Go; plan gratuit Firebase, **fără Cloud Functions**. Totul se face din client + reguli.
- Regulile Firestore le **publică utilizatorul manual** în consolă; noi doar modificăm `firestore.rules` și spunem ce s-a schimbat.
- Scripturile care scriu în Firestore (`seed-groups`) **rulează doar cu acordul utilizatorului** (proiect Firebase comun).
- Interfața în română. Fișierele comune (`firestore.rules`, `src/types`, `src/services`, `src/navigation/*Types.ts`, `todo.md`): modificări minime, adăugiri.
- Grupurile **nu au nume propriu**: „numele grupului” din antet și din Detalii e **titlul evenimentului** (cum e și azi). Fiecare om e într-un singur grup per eveniment, deci titlul e unic în lista lui.
- Un grup are 3–10 membri; chatul se deschide doar când grupul e format (`canOpenChat`: `formedAt != null`) și rămâne cum e azi.

## Ce s-a decis

### Date

- Mesajele: `events/{eventId}/groups/{groupId}/messages/{messageId}` cu
  `authorUid` (string), `authorName` (string, numele de la trimitere, ca mesajele să rămână semnate și după ce autorul iese din grup), `text` (string, 1–1000 caractere după trim), `createdAt` (timestamp de server).
- Miniatura: în profil, câmp nou `users/{uid}.photoThumb`: data URI JPEG pătrat de **~96 px** (câțiva KB). Se generează din aceeași poză când utilizatorul își salvează poza de profil.
- În grup, `members[uid]` primește câmpul opțional **`photo`** (miniatura sau `null`), copiat la intrare / la propunere, lângă `name`, `age`, `tags` (`MemberSummary`).
- Când îți schimbi poza, miniatura se actualizează și în `members[tu]` la grupurile în care ești deja.
- Utilizatorii care au deja `photoUrl`, dar nu `photoThumb`: miniatura se generează automat o dată, după login.

### Reguli Firestore (de publicat de utilizator)

- `messages`: **citire** doar dacă `request.auth.uid` e în `memberUids` al grupului părinte; **creare** doar de un membru, cu `authorUid == request.auth.uid`, `createdAt == request.time`, text string 1–1000, fără alte câmpuri; **fără** update/delete.
- Grup: o regulă nouă de `update` prin care un membru își poate schimba **doar propria intrare** din `members` (pentru miniatură), fără să atingă `memberUids`, `formedAt` sau alte câmpuri.
- `users/{uid}`: `photoThumb` opțional, string sau null, cu o limită de mărime mică (ex. ≤ 20 000 caractere).

### Interfața

Schițele aprobate sunt cele din conversație (`.superpowers/brainstorm/…/chat-si-detalii-v2.html`, locale): monocrom, fără contur punctat.

- **Conversația** (`ChatRoomScreen`):
  - antet: înapoi, apoi **numele grupului cu o săgeată mică ›** (apăsabil → Detaliile grupului) și subtitlul „N persoane · Eveniment”;
  - bannerul „Ne vedem” rămâne;
  - mesajele altora: nume deasupra bulei + miniatura (sau inițiala) în stânga jos; mai multe mesaje la rând de la aceeași persoană → numele o singură dată, avatarul la ultimul;
  - mesajele mele: dreapta, bulă albă, fără nume;
  - fiecare mesaj arată ora (HH:MM); separator de zi („Azi”, „Ieri”, apoi data);
  - bara de scriere jos; trimiterea golește câmpul; mesajele goale nu se trimit;
  - butonul „Ieși din grup” **se mută** din conversație în Detaliile grupului.
- **Detaliile grupului** (ecran nou în stiva tab-ului Chat):
  - titlu mare: numele grupului; sub el „Eveniment · stare · N din M locuri”;
  - card „Ne vedem”: ziua, ora, locul;
  - card „Vibe”: propoziția, tag-urile, intervalul de vârstă;
  - card „Membri · N”: miniatura/inițiala, „Nume, vârstă”, tag-urile; marcaj „a propus” la `proposerUid` și „tu” la utilizatorul curent;
  - jos, link roșu „Ieși din grup” (cu confirmare), care face exact ce face azi butonul din conversație.
- **Lista de chat-uri** (`ChatsScreen`): fiecare card de grup arată ultimul mesaj („Autor: text”) și ora lui (fără badge de necitite).

### Mesajele inventate

- `scripts/seed-groups.mjs` scrie și 3–5 mesaje în fiecare grup **format** de test, de la membrii inventați, cu ore din ultimele câteva ore, în română, pe tema evenimentului (simplu, generic).
- Persoanele inventate din seed primesc `photo` în `members` (poze de test; aceleași reguli ca în `todo.md`: de scos înainte de prezentare).
- Rularea scriptului: doar după acordul utilizatorului.

### Fără Firebase (fără `.env.local`)

- Comportamentul de azi rămâne: depozit în memorie (ca `groupsService`), cu mesajele mock existente; trimiterea adaugă mesajul local.

## Ce rămâne la latitudinea celui care construiește

- Numele exacte ale funcțiilor/fișierelor (ex. `chatService.ts`, `useGroupMessages`, `GroupDetailsScreen`), atâta timp cât ecranele trec prin `src/services` + `src/hooks`.
- Câte mesaje se încarcă (ex. ultimele 100–200) și dacă se face paginare (nu e cerută).
- Cum se generează miniatura (ex. `expo-image-manipulator` din data URI-ul existent).
- Cum se obține ultimul mesaj pentru lista de chat-uri (ex. o interogare `limit(1)` per grup).
- Testele unitare pentru logica pură (gruparea mesajelor consecutive, separatoarele de zi, validarea textului).

## Decizii luate de mine (de verificat)

- Miniatura de ~96 px copiată în grup, nu un profil public separat (mai simplu; profilul public vine cu prietenii).
- „Ieși din grup” mutat din conversație în Detaliile grupului.
- Ora pe fiecare mesaj, numele o singură dată pentru mesaje consecutive, separator de zi.
- Fără badge de necitite (cere stare per utilizator).
- `authorName` salvat în mesaj.
- Redenumirea „grupuleț” → „grup” doar în textul vizibil; numele din cod și documentația internă rămân, ca să nu provoace conflicte cu branch-urile colegilor.
- Chatul rămâne deschis și după ora întâlnirii (regulile nu limitează în timp); cine iese din grup nu mai poate citi conversația.
- `photo` din `members` e un URI de imagine: data URI pentru utilizatorii reali, URL https pentru persoanele inventate din seed.
- În lista de chat-uri, ultimul mesaj scris de tine apare ca „Tu: text”.
- Un mesaj trimis apare imediat (scrierea locală a Firestore); până vine ora de pe server, se afișează ora telefonului.
