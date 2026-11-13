# Ghid de layout: Crewd

Transcriere a [UI_layout_guide.pdf](UI_layout_guide.pdf), ecran cu ecran.

> **Ghidul descrie DOAR layout-ul**: ce ecrane există, ce elemente are fiecare, în ce ordine și cum sunt așezate.
> **NU descrie aspectul.** Culorile, fonturile, bordurile groase, umbrele decalate și fundalul crem din PDF nu se copiază.
> Aspectul vine din `src/theme/` (acum: dark mode).

Textele din ghid („Maria”, „Seara de board games” etc.) sunt date de exemplu. `[FOTO ...]` și `[HARTĂ]` sunt zone rezervate.

## Navigare

- Bara de tab-uri de jos are **5 tab-uri**, în ordinea: **Descoperă · Evenimente · Hartă · Chat · Profil**.
- Fiecare tab are o iconiță deasupra etichetei. Tab-ul activ are iconița evidențiată într-o „pastilă”.
- Ecranele de detaliu (detalii eveniment, conversație) se deschid peste tab și au un buton „înapoi” în stânga sus.
- Onboarding-ul (2 pași) apare înaintea tab-urilor și nu are bara de jos.

## Onboarding

### Pasul 1 din 2: „Salut, eu sunt…”

De sus în jos:

1. **Antet:** logo „crewd” în stânga, „Pasul 1 din 2” în dreapta.
2. **Progres:** două bare egale una lângă alta. Prima e plină, a doua e goală.
3. **Titlu mare** „Salut, eu sunt…”, sub el un subtitlu de 2 rânduri.
4. **Câmp „Nume”:** o etichetă deasupra și un input pe toată lățimea.
5. **„Vârstă” și „Oraș” pe același rând:** Vârstă e îngustă (aproximativ 1/3), Oraș ocupă restul.
6. **„Gen”:** trei butoane egale pe un rând (Femeie / Bărbat / Altul), cu un singur buton selectat.
7. Spațiu liber.
8. **Buton principal** „Continuă →” pe toată lățimea, lipit de jos.

### Pasul 2 din 2: „Ce îți place?”

1. **Antet:** buton înapoi în stânga, „Pasul 2 din 2” în dreapta.
2. **Progres:** ambele bare sunt pline.
3. **Titlu mare** „Ce îți place?” și un subtitlu de 2 rânduri.
4. **Trei grupuri de tag-uri.** Fiecare are o etichetă mică, iar chip-urile de sub ea trec pe rândul următor când nu mai încap. Se pot alege mai multe.
   - **Tipuri de evenimente:** Concerte, Party-uri, Filme, Teatru, Socializare
   - **Muzică:** Rock, Electronică, Hip-hop, Jazz, Pop, Folk
   - **Hobby-uri:** Board games, Drumeții, Fotografie, Gaming, Sport, Gătit
5. Spațiu liber.
6. **Buton principal** „Gata, hai în Crewd” pe toată lățimea, jos.

## Tab Descoperă (swipe)

1. **Antet:** logo „crewd” în stânga și un buton pătrat de filtre în dreapta.
2. **Card mare de profil**, care ocupă cea mai mare parte a ecranului:
   - **Jumătatea de sus** e zona de fotografie. În lipsa pozei apare inițiala mare. Badge-ul „N tag-uri comune” e în colțul din stânga sus.
   - **Jumătatea de jos:**
     - „Nume, vârstă” mare, cu distanța mică pe același rând („la 1,2 km”);
     - chip-uri cu tag-uri, care trec pe rândul următor; cele comune sunt evidențiate;
     - o casetă cu iconiță de calendar: „Merge și ea la **Eveniment**, zi”.
3. **Rând de acțiuni** sub card:
   - un buton pătrat ✕ în stânga;
   - butonul „♥ Hai în crew”, care ocupă restul rândului.

## Tab Evenimente

### Ecranul principal

1. **Titlu mare** „Evenimente”.
2. **Comutator** cu două segmente egale: **Listă | Hartă**.
3. **Chip-uri de categorii** pe un singur rând, cu scroll orizontal: Toate, Concerte, Party-uri, Filme, Teatru…
4. **Card evidențiat „ACUM”**, pentru evenimentul în desfășurare, pe toată lățimea:
   - sus: badge-ul „ACUM” în stânga și distanța în dreapta;
   - titlul evenimentului, mare;
   - jos: „Categorie · până la HH:MM” în stânga și butonul „Vin și eu” în dreapta.
5. **Secțiunea „Urmează”:** listă verticală de rânduri. Fiecare rând are:
   - o casetă pătrată de dată în stânga (ziua săptămânii prescurtată, iar sub ea numărul zilei);
   - titlul, „HH:MM · Loc · distanță” și „Categorie” (plus „· Înscris” dacă e cazul);
   - un chevron › în dreapta.

În modul Hartă, lista e înlocuită de hartă.

### Detalii eveniment

1. **Zona foto** sus, de aproximativ 1/4 din ecran:
   - buton înapoi în stânga sus;
   - badge-ul de categorie în stânga jos.
2. **Titlul evenimentului**, mare.
3. **Două casete egale pe un rând:** „Când” (dată și oră) și „Unde” (loc · distanță).
4. **Descrierea**, adică textul organizatorului.
5. **Rând cu cine merge:** avatare suprapuse (inițiale), apoi textul „Maria, Andrei și Ioana merg și ei”.
6. **Secțiunea „Grupuri pe gustul tău”:** carduri de grup. Fiecare card are:
   - în stânga: numele grupului, „N persoane · N tag-uri comune” și „Se văd la HH:MM, loc”;
   - în dreapta: butonul „Intră”.
7. **Butonul „Înscrie-te”**, fix în partea de jos, pe toată lățimea, separat de conținut.

## Tab Hartă (prieteni)

1. **Titlu mare** „Hartă”.
2. **Comutator** cu două segmente: **Prieteni | Evenimente**.
3. **Harta** ocupă tot restul ecranului.
   - Prietenii apar ca avatare rotunde cu inițiala și numele într-o etichetă sub ele.
   - Poziția ta e un punct cu eticheta „Tu”.
4. **Card plutitor jos**, peste hartă, pentru prietenul selectat:
   - rândul de sus: avatarul, „Nume · la 600 m” și, sub ele, „La Eveniment, acum”;
   - două butoane egale: „Scrie-i” și „Vezi evenimentul”;
   - un separator, apoi un rând cu textul „Locația mea e vizibilă pentru prieteni” și un switch în dreapta.

## Tab Chat

### Lista de chat-uri

1. **Titlu mare** „Chat-uri”.
2. **Secțiunea „Grupurile tale”:** carduri de grup. Fiecare card are:
   - un avatar pătrat cu inițialele grupului;
   - numele grupului și ora ultimului mesaj în dreapta;
   - „Autor: ultimul mesaj” și un badge cu numărul de mesaje necitite în dreapta;
   - o bandă jos: „Eveniment · ne vedem zi la HH:MM”.
3. **Secțiunea „Sugerate pentru tine”:** un subtitlu explicativ, apoi carduri. Fiecare card are:
   - în stânga: numele grupului, „Eveniment · N persoane” și „N tag-uri comune”;
   - în dreapta: butonul „Intră”.

### Conversația de grup

1. **Antet:** buton înapoi, apoi numele grupului și subtitlul „N persoane · Eveniment”.
2. **Banner fixat „NE VEDEM”**, sub antet:
   - iconiță de locație;
   - „Azi la HH:MM · loc”;
   - butonul „Pe hartă” în dreapta.
3. **Mesajele:**
   - un separator de zi centrat („Azi”);
   - mesajele altora sunt aliniate la stânga: numele deasupra bulei, avatarul cu inițiala în stânga jos;
   - mesajele tale sunt aliniate la dreapta, fără nume și fără avatar.
4. **Bara de scriere**, jos: un input „Scrie un mesaj…” care ocupă aproape toată lățimea și butonul de trimitere (→) în dreapta.

## Tab Profil

1. **Antet:** titlul mare „Profil” în stânga, butonul „Editează” în dreapta.
2. **Card de identitate:**
   - fotografia pătrată în stânga (inițiala, dacă lipsește);
   - în dreapta: „Nume, vârstă” mare și, sub el, orașul cu iconiță de locație.
3. **Grupuri de tag-uri alese**, fiecare cu un titlu de secțiune și chip-uri care trec pe rândul următor: Tipuri de evenimente, Muzică, Hobby-uri.
4. **Card „Învățate din evenimentele tale”:**
   - titlul și un text explicativ;
   - chip-uri cu ✕ pentru ștergere, desenate diferit de tag-urile alese, ca să se vadă că sunt automate.
