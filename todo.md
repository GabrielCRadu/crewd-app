# TODO: ce e încă mock sau neterminat

Lista lucrurilor care arată funcțional, dar folosesc date de test, stau doar în memorie sau nu fac nimic încă.
Actualizează lista când rezolvi ceva sau adaugi un mock nou.

## Date mock (de înlocuit cu Firestore / date reale)

- [x] ~~Chat: grupurile mock~~: Chat arată grupulețele reale (`useMyGroups`).
- [ ] **Mesajele din chat** (`MESSAGES` din `src/data/mockSocial.ts`): mock; mesajele trimise rămân doar local, în ecranul deschis (`ChatRoomScreen`).
- [x] ~~Grupuri pe gustul tău (mock)~~: înlocuite de grupulețele reale (`EventGroupsSection`, `groupsService`).
- [ ] **Blocarea după raportări** la grupulețe folosește reputația mock (`ratingsService`, `ME_ID`); se verifică doar în aplicație, nu în regulile Firestore.
- [ ] **Anunțul „grupulețul nu s-a format”**: grupulețele expirate doar dispar din listă; nu există încă un mesaj/notificare pentru membri.
- [ ] **Prietenii**: `FRIENDS` (Hartă, „merg și ei”). Pozițiile sunt decalaje față de locația dispozitivului.
- [ ] **Prietenii și cererile de prietenie** (Cami): `src/services/friendsService.ts`, doar în memorie (adaugă, acceptă, refuză, elimină, blochează). Profilul altei persoane și lista de prieteni folosesc `PEOPLE` prin `src/services/peopleService.ts`. Pentru Firestore trebuie un profil public separat (`users/{uid}` e privat) și o colecție de prietenii, cu reguli noi.
- [ ] **Notificarea de cerere de prietenie** (Cami, `FriendRequestPopup`): apare în colțul din dreapta sus. DEMO: Tudor îți trimite o cerere la 8 secunde după pornire (`scheduleDemoFriendRequest` în `friendsService`); de scos când cererile vin din Firestore (onSnapshot).
- [ ] **Prietenii altor persoane și cei comuni** (Cami): `MOCK_FRIENDSHIPS` (`src/data/mockFriendships.ts`). Cu Firebase: o colecție de prietenii vizibile.
- [ ] **„Vă potriviți”** (Cami): cine ți-a dat „Aș mai ieși” e mock (`THEY_WOULD_GO_AGAIN` în `mockRatings.ts`); notificarea apare doar pe telefonul tău. Cu Firebase: se verifică pe server și primesc amândoi notificarea.
- [ ] **Mesaje directe** (Cami, `directMessagesService`): doar în memorie, cu un răspuns automat DEMO după ce trimiți un eveniment. Cu Firebase: `directChats/{uidA_uidB}/messages` și reguli noi.
- [x] ~~Reamintire cu o oră înainte de evenimentele la care ești înscris~~ (Cami, `remindersService`, `expo-notifications`): notificări locale, merg și în Expo Go.
- [ ] **Raportarea din profilul cuiva** (meniul ⋯): se adună la totalul de rapoarte din `ratingsService`, doar în memorie.
- [ ] **Cine merge / câți caută companie** la un eveniment: generate stabil din id (`demoSocial` în `src/services/eventsService.ts`). Trebuie calculate din înscrierile reale.
- [ ] **Evenimente trecute pentru istoric**: `e16`–`e18` (`PAST_JOINED_EVENT_IDS` în `src/data/mockEvents.ts`), adăugate peste datele din Firestore ca să meargă istoricul și evaluările.
- [ ] **Evaluări și reputație**: `src/data/mockRatings.ts` + `src/services/ratingsService.ts`, doar în memorie. `ME_ID` trebuie înlocuit cu uid-ul din Auth. Raportările nu blochează încă pe nimeni.
- [ ] **Persoanele** (`PEOPLE`) din profilul altei persoane (`PersonProfileScreen`), folosite la evaluări și la grupulețele demo fără Firebase. (Descoperă a fost scos.)
- [ ] **Profil demo** fără Firebase (`DEMO_PROFILE` / `MY_PROFILE`): fallback doar când lipsește `.env.local`.
- [ ] **Evenimente mock** (`src/data/mockEvents.ts`): fallback doar când lipsește `.env.local`.

## Erori cunoscute

- [x] ~~Centrul de rezervă e Chișinău~~: acum e Timișoara (Piața Victoriei), iar mesajele spun „centrul Timișoarei”.

## Stare care nu se salvează (se pierde la repornire)

- [x] ~~Înscrierile la evenimente și scorurile tag-urilor~~: salvate în `users/{uid}` la apăsarea butonului (`joinedEventIds`, `tagScores`).
- [ ] **Tag-uri învățate automat**: nu se adaugă încă nimic în `learnedTags` după înscrieri. Doar ștergerea funcționează.
- [ ] **Vizibilitatea locației pentru prieteni** (switch-ul din Hartă): doar local.

## Butoane fără acțiune

- [x] ~~Profil → Editează~~: făcut de Cami (poză, nume, oraș, bio, preferințe). Data nașterii și genul sunt blocate după onboarding.
- [ ] Hartă → **Scrie-i** și **Vezi evenimentul** (cardul prietenului).
- [ ] Conversație → **Pe hartă** (bannerul „Ne vedem”).

## Neimplementat

- [ ] **Login cu Google**: nu merge în Expo Go. Cere un development build (EAS în cloud sau local, după repararea `ninja` pe Windows).
- [ ] **Notificări push**: nu merg în Expo Go. Anunțurile (ex. grupuleț expirat) apar deocamdată doar în aplicație.
- [ ] **iPhone în Expo Go**: cere `npx expo login` pe laptop și același cont în Expo Go.
- [ ] **Build nativ pe Windows**: `ninja` din CMake 3.22.1 nu suportă căi lungi (vezi istoricul din conversație). Necesar pentru Google, push și release.

## Date și drepturi

- [ ] **ÎNAINTE DE PREZENTARE: șterge pozele de test de pe Unsplash**: `photoUrl` din `src/data/mockSocial.ts` (profilurile persoanelor de test). Se încarcă direct de pe images.unsplash.com. (Afișele evenimentelor de test vin acum din baza de date.)

- [ ] **Evenimentele din Firestore** (din `evenimente-timisoara-verificate.json`) sunt doar pentru **demo intern**. Înainte de o lansare publică trebuie acordul surselor (iaBilet, Zile și Nopți, OnEvent etc.) sau o sursă cu licență (ex. acord scris de la OMD Timișoara / Visit Timișoara).
- [ ] **Imaginile evenimentelor** sunt încărcate direct de pe site-urile organizatorilor (cu „Foto: …”). Pentru producție: acordul organizatorilor sau imagini proprii.
