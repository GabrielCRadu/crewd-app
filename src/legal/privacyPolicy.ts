/**
 * Politica de confidențialitate afișat(e) în aplicație (Setări → Politica de confidențialitate).
 * Sursa e Crewd_Politica_de_Confidentialitate.md (fără anexa internă). Când schimbi documentul, regenerează și acest fișier.
 * Câmpurile [__] trebuie completate înainte de publicare.
 */
export const PRIVACY_POLICY_RO = `da nu imi# Politica de Confidențialitate – Crewd

**Data intrării în vigoare:** [__]

**Ultima actualizare:** [__]

Aici îți explicăm ce date personale folosește Crewd, de ce, cât timp le păstrăm, cui le transmitem și ce drepturi ai. Politica respectă Regulamentul (UE) 2016/679 (GDPR) și Legea nr. 190/2018.

## 1. Cine îți prelucrează datele

Operatorul datelor tale este **[__]** („noi”), CUI [__], cu sediul în [__].

- Email pentru protecția datelor: [__]
- Responsabil cu protecția datelor (DPO): [__] (dacă există)

## 2. Pe scurt

- Folosim datele ca să-ți arătăm evenimente din Timișoara, să te ajutăm să găsești oameni cu care să mergi, să funcționeze grupurile și chatul și ca să păstrăm comunitatea în siguranță.
- **Locația ta rămâne pe telefon.** O folosim doar ca să calculăm distanța până la evenimente. Nu o salvăm pe serverele noastre.
- **Nu îți vindem datele** și nu afișăm reclame.
- Poți oricând să-ți vezi datele, să le corectezi sau să le ștergi. Contul îl poți șterge singur din Setări.

## 3. Ce date folosim

### 3.1 Datele pe care ni le dai tu

- **Cont:** adresa de email, parola și username-ul. Parola o gestionează furnizorul nostru de autentificare (Firebase Authentication) și nu o vedem. Username-ul e unic și apare în codul tău QR.
- **Profil:** numele sau pseudonimul, data nașterii, genul, orașul, descrierea („Despre mine”) și poza de profil. Din poză facem și o miniatură, folosită în grupuri și pe fișa ta publică.
- **Tag-uri de pornire:** interesele alese la crearea contului (de exemplu Concerte, Jazz, Drumeții).
- **Grupuri:** grupurile pe care le propui sau în care intri (intervalul de vârstă, „vibe-ul”, locul și ora întâlnirii) și mesajele trimise în chatul grupului. Când intri într-un grup, în el se copiază numele, vârsta, tag-urile și miniatura pozei tale.

### 3.2 Datele care rezultă din folosirea aplicației

- **Activitate:** evenimentele la care te-ai înscris și grupurile în care ai intrat sau din care ai ieșit.
- **Preferințe învățate:** tag-urile și scorurile actualizate automat după înscrieri.
- **Date tehnice:** identificatorul contului și datele necesare ca aplicația să funcționeze (de exemplu ora la care s-a salvat o modificare). Nu folosim instrumente de statistici sau de publicitate.

### 3.3 Locația

- Cu permisiunea ta, aplicația citește locația telefonului ca să afișeze distanța până la evenimente și să le pună pe hartă. **Locația se folosește doar pe telefon** și nu se trimite pe serverele noastre.
- Fără permisiune, distanțele se calculează de la centrul Timișoarei.
- Opțiunea „Locația mea e vizibilă pentru prieteni” de pe Hartă se ține minte doar pe telefonul tău.

### 3.4 Date salvate doar pe telefon

Pe telefon se păstrează sesiunea de logare (ca să nu te loghezi la fiecare pornire), limba aleasă și setarea de vizibilitate a locației. Le poți șterge dezinstalând aplicația.

### 3.5 Funcții în testare

Unele funcții sunt încă în testare și **nu trimit nimic pe serverele noastre**: prietenii și cererile de prietenie, mesajele directe, amintirile, evaluările de după evenimente, badge-urile, raportările și harta cu prieteni. În versiunea actuală, ce faci în ele rămâne doar pe telefonul tău și se pierde când închizi aplicația; persoanele și pozițiile din ele sunt date de test. Când aceste funcții vor salva date pe server, actualizăm politica și te anunțăm înainte (secțiunea 14).

### 3.6 Date pe care nu le cerem

Nu îți cerem date sensibile: sănătate, religie, orientare sexuală, opinii politice. Te rugăm să nu le scrii nici în profil, nici în chat. Unele tag-uri sau evenimente pot totuși sugera astfel de informații. Vezi secțiunea 5.3.

## 4. De ce folosim datele și pe ce temei legal

- **Crearea și administrarea contului** (cont, profil): executarea contractului, art. 6(1)(b) GDPR.
- **Afișarea evenimentelor și a distanțelor** (locația, doar pe telefon, și tag-urile): executarea contractului; permisiunea de localizare o dai din telefon.
- **Înscrierea la evenimente, grupurile și chatul** (activitate, profil, mesaje): executarea contractului.
- **Potrivirea:** ordonarea evenimentelor și a grupurilor după tag-uri comune și vârstă și actualizarea automată a tag-urilor (vârstă, tag-uri, activitate). Temei: executarea contractului [sau interes legitim, art. 6(1)(f); de confirmat cu un avocat].
- **Fișa publică și codul QR** (username, nume, miniatura pozei): executarea contractului, ca prietenii să te poată găsi.
- **Moderare și prevenirea abuzurilor** (de exemplu verificarea vârstei minime la crearea contului): interes legitim; obligație legală (Regulamentul (UE) 2022/2065 privind serviciile digitale), art. 6(1)(c).
- **Reamintiri înainte de evenimente:** notificări create direct pe telefon, cu permisiunea ta.
- **Răspunsul la cererile autorităților și apărarea în litigii** (datele relevante): obligație legală; interes legitim.

Când ne bazăm pe interesul legitim, am verificat că acest interes nu trece înaintea drepturilor tale. Te poți opune oricând (secțiunea 9).

## 5. Potrivirea, profilarea și deciziile automate

### 5.1 Ce facem

- Pe baza tag-urilor și a vârstei tale, ordonăm evenimentele și grupurile de la un eveniment, ca să le vezi primele pe cele potrivite.
- După fiecare înscriere la un eveniment, îți actualizăm automat tag-urile și scorurile de preferințe.
- Un grup e vizibil doar pentru persoanele care se încadrează în intervalul de vârstă ales de cel care l-a propus.

În GDPR, toate acestea se numesc **profilare**.

### 5.2 Restricții după raportări (în testare)

Raportările sunt încă în testare (secțiunea 3.5). Când vor funcționa pe server, cine adună mai multe raportări va putea fi oprit automat, pentru o perioadă, să intre în grupuri sau să propună grupuri. Dacă ți se întâmplă și crezi că e o greșeală, scrie-ne la [__]: o persoană verifică situația și poate ridica restricția [ajustați după practica voastră].

### 5.3 Tag-uri care pot dezvălui informații sensibile

Unele tag-uri sau evenimente pot sugera informații sensibile, de exemplu religia sau orientarea sexuală. Nu folosim aceste tag-uri ca să tragem concluzii despre tine.

### 5.4 Controlul tău

- Îți poți vedea și șterge tag-urile învățate automat, din Profil.
- Îți poți edita tag-urile de pornire, din Editează profilul.
- Poți cere explicații despre potrivire și te poți opune profilării la [__].

## 6. Ce văd ceilalți utilizatori

- **Fișa ta publică** (username-ul, numele și miniatura pozei): orice utilizator logat care îți știe username-ul, de exemplu din codul tău QR sau din linkul de invitație. Nu se poate căuta în listă: trebuie să știi username-ul.
- **În grupurile de la evenimente** (numele, vârsta, tag-urile și miniatura pozei tale): orice utilizator logat care se uită la grupurile acelui eveniment, ca să-și aleagă grupul.
- **Mesajele din chatul de grup:** doar membrii grupului.
- **Restul profilului** (emailul, data nașterii, genul, orașul, descrierea, poza mare, înscrierile, tag-urile învățate): nu le vede nimeni altcineva.
- **Funcțiile în testare** (prieteni, mesaje directe, amintiri, evaluări): acum nu se trimit altor utilizatori (secțiunea 3.5). Când vor funcționa, vor arăta astfel: mesajele directe doar persoanei cu care vorbești; evenimentele la care mergi doar prietenilor; amintirile tuturor sau doar prietenilor, cum alegi tu; evaluările anonim, pe profil apărând doar totalurile, iar un badge abia când l-au propus 3 persoane diferite. Într-un grup mic, ceilalți pot uneori deduce cine a dat o evaluare.

## 7. Cui transmitem datele

Nu îți vindem datele. Le transmitem doar:

- **Furnizorilor noștri**, care lucrează la instrucțiunile noastre, pe bază de contract (art. 28 GDPR):
  - autentificare și baza de date: Google Firebase (Firebase Authentication și Cloud Firestore), Google [Ireland Limited / LLC];
  - hărți: Google Maps, prin harta din aplicație (pentru afișarea hărții, Google primește adresa IP și zona afișată);
  - [alți furnizori, dacă e cazul].
- **Site-urilor organizatorilor de evenimente:** pozele evenimentelor se încarcă direct de pe site-urile surselor, care primesc adresa IP a telefonului, ca la orice site.
- **Google Calendar**, doar dacă apeși „Adaugă în Google Calendar”: se deschide Google Calendar cu detaliile evenimentului. Folosirea Google Calendar e guvernată de politica Google.
- **Aplicațiilor prin care trimiți linkul de invitație** (WhatsApp, Instagram, SMS etc.), doar când alegi tu să-l trimiți.
- **Celorlalți utilizatori**, în limitele din secțiunea 6.
- **Autorităților** (Poliție, Parchet, instanțe, ANSPDCP), atunci când legea ne obligă sau când există un pericol pentru viața sau siguranța cuiva.
- **Unui eventual cumpărător** al afacerii, în caz de fuziune sau vânzare. Te anunțăm înainte.

Organizatorii de evenimente nu primesc date despre tine de la noi.

## 8. Transferuri în afara SEE

Google poate prelucra date și în afara Spațiului Economic European, de exemplu în SUA. În aceste cazuri se folosesc decizia de adecvare a Comisiei Europene (EU-US Data Privacy Framework) sau clauze contractuale standard. Poți cere o copie a garanțiilor la [__].

## 9. Drepturile tale

Ai dreptul:

- **de acces:** să afli ce date avem despre tine și să primești o copie;
- **la rectificare:** să corectezi datele greșite (cele mai multe le poți schimba singur, din Editează profilul);
- **la ștergere („dreptul de a fi uitat”):** îți poți șterge singur contul din Setări → Șterge contul;
- **la restricționarea** prelucrării;
- **la portabilitate:** să primești datele într-un format ușor de folosit;
- **la opoziție:** față de prelucrările bazate pe interes legitim, inclusiv profilarea;
- **de a-ți retrage consimțământul**, de exemplu pentru localizare, din setările telefonului. Retragerea nu afectează prelucrările făcute până atunci;
- **să nu faci obiectul unei decizii bazate exclusiv pe prelucrare automată** care te afectează semnificativ, să ceri intervenție umană și să contești decizia (vezi secțiunea 5.2).

**Cum îți exerciți drepturile:** din aplicație (Setări) sau prin email la [__]. Răspundem în cel mult o lună. Termenul se poate prelungi cu încă două luni pentru cereri complexe și, în acest caz, te anunțăm. Exercitarea drepturilor este gratuită.

**Plângere:** te poți adresa Autorității Naționale de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP), www.dataprotection.ro, B-dul G-ral. Gheorghe Magheru nr. 28-30, București, sau instanței.

## 10. Cât timp păstrăm datele

- **Cont și profil:** cât timp ai cont. Când îți ștergi contul (Setări → Șterge contul), se șterg contul, profilul, înscrierile și locul tău în grupuri, iar username-ul și fișa publică se eliberează.
- **Mesajele din chatul de grup:** rămân vizibile celorlalți membri, cu numele tău, [__] (de exemplu până la ștergerea grupului), pentru că fac parte și din conversația lor.
- **Locația:** nu se păstrează pe serverele noastre.
- **Istoricul înscrierilor și tag-urile:** cât timp ai cont.
- **Funcțiile în testare** (secțiunea 3.5): nimic pe server; pe telefon, până închizi aplicația.
- **Copii de siguranță:** se suprascriu în [__] zile.

## 11. Securitatea datelor

Datele circulă criptat (TLS), parola e gestionată de Firebase Authentication și nu e stocată de noi în clar, iar accesul la baza de date e limitat prin reguli de securitate (fiecare își poate citi și modifica doar datele permise). Nicio măsură nu e perfectă. Dacă are loc un incident care îți pune în pericol drepturile, îl notificăm la ANSPDCP în 72 de ore și te anunțăm și pe tine, atunci când legea ne cere asta.

## 12. Minori

Crewd este doar pentru persoane de cel puțin **18 ani**. Vârsta o verificăm din data nașterii la crearea contului. Nu colectăm intenționat date despre minori. Dacă aflăm că un cont aparține unui minor, îl închidem și ștergem datele.

## 13. Permisiunile din telefon

- **Localizare:** pentru distanțe și hartă (secțiunea 3.3).
- **Cameră și galerie:** pentru poza de profil și pentru amintiri, doar când alegi tu o poză.
- **Notificări:** pentru reamintirile cu o oră înainte de evenimentele la care ești înscris.

Le poți gestiona oricând din setările telefonului. Aplicația nu folosește cookie-uri, instrumente de statistici sau de publicitate.

## 14. Modificări ale acestei politici

Când facem schimbări importante, te anunțăm în aplicație cu cel puțin [15] zile înainte să intre în vigoare. Versiunea actuală este mereu disponibilă în aplicație, în Setări → Politica de confidențialitate.

## 15. Contact

**[__]**
Adresă: [__]
Email confidențialitate: [__]
DPO: [__]`;
