# Grupulețe la evenimente: design

Data: 2026-11-13. Proiect: Crewd (Expo SDK 58 + React Native, Firebase JS SDK, Firestore).

## Intenția și de ce

Crewd ajută pe cineva care vrea să meargă la un eveniment, dar nu are cu cine. Până acum, recomandările de oameni stăteau într-un tab separat, **Descoperă**: un feed de tip swipe cu persoane cu gusturi similare. Problema e că acolo te potrivești cu cineva în abstract, fără un motiv concret să vă vedeți.

Noua idee: **potrivirea se face în jurul unui eveniment concret**. Te înscrii la un eveniment, apoi vezi **grupulețele** deja formate de oameni care merg și ei, ordonate după cât de bine te potrivești. Intri într-unul și mergeți împreună, cu o oră și un loc de întâlnire stabilite. Toți au deja un plan comun, deci întâlnirea e naturală și mai sigură decât un match 1:1.

## Obiective

- Tab-ul **Descoperă dispare**. Aplicația pornește pe **Evenimente**.
- După **„Înscrie-te”** la un eveniment, utilizatorul vede lista de grupulețe ale evenimentului, ordonată după potrivire.
- Fiecare grupuleț arată o **descriere generală a membrilor**: intervalul de vârstă, vibe-ul, tag-urile comune și numărul de locuri.
- Utilizatorul **intră direct** într-un grupuleț, fără aprobare, dar în limitele de mai jos.
- Dacă nu-i convine niciun grupuleț, **propune unul nou**. Grupulețul se formează abia când **cel puțin 3 persoane** au intrat.
- Fiecare grupuleț are **ora și locul întâlnirii**, plus un **chat de grup**.

## Non-obiective (acum)

- Chat real (mesaje în Firestore, în timp real): rămâne mock (vezi `todo.md`). Designul doar leagă grupulețul de chat-ul existent.
- Notificări push: nu merg în Expo Go. Anunțurile apar în aplicație.
- Blocarea automată după raportări pe baza unor date reale: sistemul de evaluări e încă mock, în memorie. Regula se implementează pe interfața existentă (`ratingsService`).
- Login cu Google, build nativ.

## Anti-obiective (ar fi un eșec chiar dacă tehnic merge)

- Conversații în doi cu un necunoscut înainte să existe un grup. Chat-ul se deschide abia la 3 persoane.
- Grupuri mari, anonime: grupulețul trebuie să rămână mic (maximum 10).
- Ca cineva să ajungă într-un grup al cărui interval de vârstă nu îl îndeplinește, chiar dacă ocolește aplicația. Limitele se verifică și în regulile Firestore.
- Zeci de grupulețe goale propuse în paralel: utilizatorul vede întâi grupurile existente, iar butonul de propunere stă sub listă.

## Fluxul (decis cu utilizatorul)

1. Utilizatorul deschide un eveniment din tab-ul Evenimente și apasă **„Înscrie-te”**.
2. Abia atunci apare secțiunea de grupulețe (înlocuiește actuala „Grupuri pe gustul tău”, care e mock).
3. Lista conține **doar grupulețele în care se încadrează**, în ordinea:
   1. grupulețe **formate** (3 sau mai mulți membri) cu loc liber, ordonate după potrivire;
   2. grupulețe **în formare** (1–2 membri), ordonate după potrivire, marcate „Se formează · mai e nevoie de N”.
   Grupulețele pline apar marcate „Complet”, fără buton de intrare, sau nu apar deloc (vezi „Lăsat constructorului”).
4. Fiecare card arată: numele (opțional), ora și locul întâlnirii, intervalul de vârstă, vibe-ul (o propoziție), tag-urile comune cu tine, numărul de membri din maxim.
5. **„Intră”** îl adaugă în grupuleț. Pentru un grupuleț în formare, a intra înseamnă că e de acord să participe.
6. Sub listă: **„Niciunul nu ți se potrivește? Propune unul”**.
7. După ce a intrat, butonul de jos al paginii devine **„Deschide chat-ul”** dacă grupulețul e format, sau **„Așteptăm încă N persoane”** dacă e în formare.

## Limitele la intrare (decise cu utilizatorul)

1. **Intervalul de vârstă e o regulă strictă.** Utilizatorul vede și poate intra doar în grupulețele unde vârsta lui e în interval.
   **Fără grupuri „doar femei”** (decizia utilizatorului: prea complicat). Grupulețele nu au criterii de gen.
2. **Maximum 10 persoane** pe grupuleț. Cel care propune alege maximul, între 3 și 10.
3. **Un singur grupuleț per eveniment** per utilizator. Poate ieși și intra în altul.
4. **Doar dacă e înscris la eveniment.** Dacă își anulează înscrierea, iese automat și din grupuleț.
5. **Intrarea se închide la ora întâlnirii** grupulețului.
6. **Siguranță:** cine are raportări confirmate (din evaluările de după evenimente) nu poate intra în grupulețe o perioadă. Pragul și perioada sunt lăsate constructorului, ca valori ușor de schimbat.

## Propunerea unui grupuleț (propusă de mine, acceptată de utilizator)

Formularul, cu valori precompletate:

- **Ora întâlnirii:** implicit cu 15 minute înainte de începutul evenimentului. Trebuie să fie înainte de începutul evenimentului sau cel mult la începutul lui.
- **Locul întâlnirii:** text liber, implicit „în fața intrării”.
- **Intervalul de vârstă:** implicit vârsta celui care propune ±4 ani, cu minimum 18. Intervalul trebuie să o includă pe a lui.
- **Mărimea maximă:** 3–10, implicit 6 (decizia mea; utilizatorul a stabilit doar plafonul de 10).
- **Vibe:** o propoziție, obligatorie, de exemplu „venim pentru muzică, nu pentru băut”. Lungime maximă rezonabilă, de ordinul a 120 de caractere.
- **Tag-uri:** completate automat din tag-urile din profil care se suprapun cu tag-urile evenimentului. Nu se editează.
- Cel care propune devine automat primul membru. Se aplică regula „un grupuleț per eveniment”: dacă era deja în altul, iese din el.

**Ciclul de viață:**

| Stare | Când | Ce se vede |
| --- | --- | --- |
| în formare | 1–2 membri | în listă, „Se formează · mai e nevoie de N”; chat închis |
| format | 3 sau mai mulți membri | în listă, cu locuri libere; chat deschis pentru membri |
| complet | membri = maximul ales | „Complet” |
| expirat | nu s-a format (sub 3 membri) până la **termenul de formare** | dispare din listă; membrii văd în aplicație „Grupulețul nu s-a format, alege altul” |
| închis | după ora întâlnirii | nu mai primește membri; rămâne vizibil membrilor |

**Termenul de formare** (decizia mea, după verificarea designului):
- În mod normal: **2 ore înainte de ora întâlnirii**.
- Dacă grupulețul e propus după acest moment (propuneri din aceeași zi): termenul devine **30 de minute înainte de ora întâlnirii**.
- Propunerile se blochează cu **mai puțin de 30 de minute** înainte de ora întâlnirii propuse. Intrarea în grupulețe rămâne deschisă până la ora întâlnirii.

**Odată format, rămâne format** (decizia mea): când grupulețul ajunge la 3 membri, se salvează momentul formării (`formedAt`). Dacă apoi cineva iese și rămân sub 3, grupul **nu** redevine „în formare” și nu expiră. Rămâne format, cu chat-ul deschis pentru membri, și poate primi din nou membri.

Starea se **calculează din date** (numărul de membri, `formedAt`, momentul creării și ora), fără un server care s-o schimbe. Singurul câmp de stare salvat e `formedAt`, scris de aplicația membrului care îl completează pe al treilea, și verificat de reguli. Așa nu e nevoie de Cloud Functions, care cer planul plătit Blaze.

## Potrivirea (ordinea în listă)

Scor pe grupuleț, calculat în aplicație:

- **tag-uri comune**: câte din tag-urile utilizatorului apar la membrii grupului (sau în tag-urile grupului);
- **apropierea de vârstă**: cât de aproape e vârsta utilizatorului de mijlocul intervalului grupului.

Ponderea exactă e lăsată constructorului, cu condiția să fie o singură funcție pură, ușor de ajustat. Pe card se arată „N tag-uri comune”, nu un procent.

## Navigare și ecrane afectate (decise cu utilizatorul / decizia mea)

- **Bara de jos:** 4 tab-uri: **Evenimente** (implicit) · Hartă · Chat · Profil. `DiscoverScreen` se scoate. **Decizia mea:** `PersonProfileScreen` și persoanele mock (`PEOPLE`) rămân, pentru că le folosesc evaluările lui Cami. Profilul unui membru se deschide din grupuleț dacă e util.
- **Detaliile evenimentului** (`EventDetailsScreen`): secțiunea de grupulețe devine cea reală; butonul de jos se schimbă după starea utilizatorului (neînscris → „Înscrie-te”; înscris fără grup → butonul de propunere sau lista; în grup → „Deschide chat-ul” / „Așteptăm încă N”).
- **Ecran nou:** „Propune un grupuleț” (formularul de mai sus), deschis din detaliile evenimentului.
- **Chat** (`ChatsScreen`): secțiunea „Sugerate pentru tine” se scoate (**decizia mea**: recomandările stau acum în evenimente). Lista arată grupulețele tale, inclusiv cele în formare, marcate „Se formează · 2/3”, fără acces la conversație până la 3.
- **Conversația** (`ChatRoomScreen`): bannerul „Ne vedem” ia ora și locul din grupuleț. Mesajele rămân mock.
- Layout-ul noilor părți urmează spiritul `docs/layout-guide.md` (cardurile de grup din „Detalii eveniment” și „Chat”). Aspectul urmează doar `docs/design-language.md`.

## Date (decizia mea, de rafinat de constructor)

- Grupulețele stau în Firestore, legate de eveniment, de exemplu `events/{eventId}/groups/{groupId}`. Fiecare are: cine l-a propus, ora și locul întâlnirii, criteriile (vârstă minimă și maximă, mărime maximă), vibe, tag-uri, lista de membri (uid-uri) și momentul creării.
- Pentru potrivire și pentru descrierea membrilor, aplicația are nevoie de un rezumat al membrilor: vârste, tag-uri, nume pentru avatare. Profilurile `users/{uid}` sunt private (fiecare își citește doar propriul document). **Decizia mea:** fiecare membru își copiază la intrare în grup un rezumat minim (prenume, vârstă, tag-uri). Nu se expun email-ul sau alte date.
- Înscrierea la eveniment există în Firestore: `users/{uid}.joinedEventIds`, salvat la fiecare „Înscrie-te” / „Anulează” (făcut separat, înaintea acestui feature).
- **Vârsta și genul sunt blocate după onboarding** (decizia utilizatorului): profilul are `birthDate` (Timestamp), iar regulile Firestore interzic schimbarea lui `birthDate` și `gender`. Verificarea intervalului de vârstă al grupului se poate baza deci pe ea (genul nu e folosit de grupulețe). În reguli, vârsta se calculează din `birthDate` față de `request.time`. Pentru rezumatul membrilor din grup se copiază data nașterii (sau vârsta calculată) la intrare.
- Regula „un grupuleț per eveniment” și limita de 10 trebuie respectate și când doi oameni intră în același timp, prin tranzacții Firestore și reguli care verifică mărimea listei de membri.

## Constrângeri

- Trebuie să ruleze în **Expo Go** (SDK 58), deci fără cod nativ nou.
- **Firebase pe planul gratuit**: fără Cloud Functions. Toată logica stă în aplicație și în regulile Firestore.
- Regulile Firestore le publică utilizatorul manual din consolă. Orice schimbare a lor trebuie anunțată explicit.
- Doi dezvoltatori lucrează în paralel (Cami pe Evenimente și Profil): **`EventDetailsScreen`, `RootNavigator` și `ChatsScreen` se ating în comun**. Coordonare prin `CLAUDE.md` (sync înainte de lucru).
- Interfața în română, cu diacritice.

## Lăsat constructorului

- Ponderile exacte ale scorului de potrivire.
- Pragul de raportări și durata blocării (constante ușor de schimbat).
- Dacă grupulețele complete apar în listă („Complet”) sau sunt ascunse.
- Structura exactă a documentelor Firestore și a regulilor, cu condiția să respecte limitele de mai sus.
- Textele exacte (microcopy), în spiritul celor din design.
- Cum se migrează mock-urile existente (grupurile din `mockSocial.ts`) când nu există Firebase configurat: fallback pe date mock, ca în restul aplicației.
