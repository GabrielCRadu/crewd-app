# TODO: ce e încă mock sau neterminat

Lista lucrurilor care arată funcțional, dar folosesc date de test, stau doar în memorie sau nu fac nimic încă.
Actualizează lista când rezolvi ceva sau adaugi un mock nou.

## Date mock (de înlocuit cu Firestore / date reale)

- [ ] **Chat**: grupurile (`MY_GROUPS`, `SUGGESTED_GROUPS`) și mesajele (`MESSAGES`) din `src/data/mockSocial.ts`. Mesajele trimise rămân doar local, în ecranul deschis (`ChatRoomScreen`).
- [ ] **Grupuri pe gustul tău** în detaliile evenimentului: mock, potrivite după titlu (`EventDetailsScreen`). Se înlocuiesc cu grupulețele reale (vezi designul din `docs/superpowers/specs/`).
- [ ] **Prietenii**: `FRIENDS` (Hartă, statisticile din Profil, „merg și ei”). Pozițiile sunt decalaje față de locația dispozitivului. Nu există încă o listă de prieteni. Harta îi citește prin `src/services/friendsService.ts` (statusul și „Vezi evenimentul” vin din `friendsGoing`); acolo se leagă datele reale.
- [ ] **Cine merge / câți caută companie** la un eveniment: generate stabil din id (`demoSocial` în `src/services/eventsService.ts`). Trebuie calculate din înscrierile reale.
- [ ] **Evenimente trecute pentru istoric**: `e16`–`e18` (`PAST_JOINED_EVENT_IDS` în `src/data/mockEvents.ts`), adăugate peste datele din Firestore ca să meargă istoricul și evaluările.
- [ ] **Evaluări și reputație**: `src/data/mockRatings.ts` + `src/services/ratingsService.ts`, doar în memorie. `ME_ID` trebuie înlocuit cu uid-ul din Auth. Raportările nu blochează încă pe nimeni.
- [ ] **Persoanele** (`PEOPLE`) din Descoperă și din profilul altei persoane (`PersonProfileScreen`), folosite și la evaluări. Descoperă dispare (vezi designul grupulețelor).
- [ ] **Profil demo** fără Firebase (`DEMO_PROFILE` / `MY_PROFILE`): fallback doar când lipsește `.env.local`.
- [ ] **Evenimente mock** (`src/data/mockEvents.ts`): fallback doar când lipsește `.env.local`.

## Stare care nu se salvează (se pierde la repornire)

- [x] ~~Înscrierile la evenimente și scorurile tag-urilor~~: salvate în `users/{uid}` la apăsarea butonului (`joinedEventIds`, `tagScores`).
- [ ] **Tag-uri învățate automat**: nu se adaugă încă nimic în `learnedTags` după înscrieri. Doar ștergerea funcționează.
- [ ] **Vizibilitatea locației pentru prieteni** (switch-ul din Hartă): se ține minte pe dispozitiv (AsyncStorage, `friendsService`), dar nu ajunge în Firestore și locația nu se partajează încă nimănui.

## Butoane fără acțiune

- [x] ~~Profil → Editează~~: făcut de Cami (poză, nume, oraș, bio, preferințe). Data nașterii și genul sunt blocate după onboarding.
- [x] ~~Hartă → **Vezi evenimentul**~~: deschide detaliile evenimentului la care merge prietenul (dezactivat dacă nu merge nicăieri).
- [ ] Hartă → **Scrie-i**: deschide doar lista de chat-uri; nu există încă mesaje private.
- [ ] Conversație → **Pe hartă** (bannerul „Ne vedem”).
- [ ] Descoperă → butonul de **filtre** (ecranul dispare oricum).

## Neimplementat

- [ ] **Login cu Google**: nu merge în Expo Go. Cere un development build (EAS în cloud sau local, după repararea `ninja` pe Windows).
- [ ] **Notificări push**: nu merg în Expo Go. Anunțurile (ex. grupuleț expirat) apar deocamdată doar în aplicație.
- [ ] **iPhone în Expo Go**: cere `npx expo login` pe laptop și același cont în Expo Go.
- [ ] **Build nativ pe Windows**: `ninja` din CMake 3.22.1 nu suportă căi lungi (vezi istoricul din conversație). Necesar pentru Google, push și release.

## Date și drepturi

- [ ] **Evenimentele din Firestore** (din `evenimente-timisoara-verificate.json`) sunt doar pentru **demo intern**. Înainte de o lansare publică trebuie acordul surselor (iaBilet, Zile și Nopți, OnEvent etc.) sau o sursă cu licență (ex. acord scris de la OMD Timișoara / Visit Timișoara).
- [ ] **Imaginile evenimentelor** sunt încărcate direct de pe site-urile organizatorilor (cu „Foto: …”). Pentru producție: acordul organizatorilor sau imagini proprii.
