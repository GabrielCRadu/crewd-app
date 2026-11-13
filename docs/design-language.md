# Limbajul vizual Crewd

Acesta este **aspectul** aplicației: culori, materiale, forme și tipografie. **Layout-ul** (ce e pe fiecare ecran și unde) vine din [layout-guide.md](layout-guide.md). Cele două se combină: layout-ul din ghid, desenat în stilul de aici.

Referințele vizuale originale sunt private și nu sunt în repo. Tot ce trebuie știut din ele e descris mai jos.

## Starea generală

Întunecat, cald și luminos din interior. Fundaluri aproape negre, peste care apar **pete de lumină difuze** (gradient de tip „aurora”) în portocaliu, roz și magenta. Suprafețele par **sticlă mată** care plutește deasupra luminii. Totul e rotunjit și moale. Nu folosim contururi groase, umbre tari sau colțuri drepte.

## Culori

| Rol | Valoare orientativă | Folosire |
| --- | --- | --- |
| Fundal | `#0B0A10` (aproape negru, ușor violet) | fundalul tuturor ecranelor |
| Fundal secundar | `#1A1424` (violet foarte închis) | zone mari, ecrane de detaliu |
| Suprafață sticlă | alb la 8–12% opacitate | carduri, liste, bare |
| Contur sticlă | alb la 10–16% opacitate, 1 px | marginea cardurilor de sticlă |
| Text principal | `#FFFFFF` | titluri, text important |
| Text secundar | alb la 60–70% | subtitluri, meta (oră, distanță) |
| Text discret | alb la 40% | etichete mici, placeholder |
| Accent cald | `#FF7A3D` (portocaliu) → `#FF4D8D` (roz) → `#C13CFF` (magenta) | gradientul „aurora”, evidențieri |
| Accent galben | `#FFC94D` | centrul cald al petelor de lumină |

Regula de folosire a culorii: **culoarea vine din lumină, nu din suprafețe plate.** Accentele apar ca gradient difuz (fundal de card, zonă hero, poză lipsă), nu ca blocuri de culoare plină.

## Materiale

- **Aurora (gradient difuz):** 2–3 pete mari, foarte estompate, de culori calde (galben în centru, portocaliu, roz, magenta), pe fundal întunecat. Se folosește pentru:
  - cardul principal sau hero al unui ecran;
  - zona de sus a ecranelor de detaliu;
  - înlocuitorul pozelor lipsă (în loc de un pătrat gri).
- **Sticlă mată:** suprafață translucidă (alb 8–12%), cu blur pe fundal unde e posibil (`expo-blur`) și un contur subțire alb la 10–16%. Se folosește pentru carduri de listă, bara de jos, butoane-iconiță și cardurile plutitoare de pe hartă.
- **Poze cu text peste:** pozele umplu cardul, iar textul stă jos-stânga, pe un gradient închis care urcă din partea de jos a cardului, ca să rămână lizibil.

## Forme

- Colțuri mari: **carduri 24–28**, butoane și chip-uri **complet rotunjite (pastilă)**, butoane-iconiță **12–14** (pătrat rotunjit) sau cerc.
- Nu folosim contururi groase, umbre dure decalate sau colțuri drepte.
- Umbre: doar foarte moi și închise, sau deloc. Adâncimea vine din sticlă și lumină.

## Componente

- **Buton principal (CTA):** pastilă lată pe toată lățimea, **gradient deschis** de la alb la roz-lavandă (`#FFFFFF` → `#F3A6E8`), cu **text închis** (`#1A1424`) și o săgeată sau iconiță. E singurul element deschis la culoare de pe ecran, de aceea iese în evidență.
- **Buton secundar:** pastilă de sticlă (translucidă, contur subțire), cu text alb.
- **Comutator sau segmente (ex. Listă | Hartă, categorii):** segmentul activ e o **pastilă albă cu text închis**, cele inactive sunt pastile de sticlă cu text alb la 70%.
- **Chip-uri / tag-uri:** pastile de sticlă. Tag-urile selectate sau comune sunt albe cu text închis, sau au fundal aurora.
- **Badge-uri mici** (ex. „ACUM”, „4 tag-uri comune”): pastile de sticlă mici, cu o iconiță mică înaintea textului.
- **Butoane-iconiță** (înapoi, filtre, favorit): pătrate rotunjite sau cercuri de sticlă, cu iconiță albă.
- **Butonul circular de acțiune** (ex. „play”, trimite): cerc alb plin, cu iconiță închisă.
- **Bara de jos:** sticlă întunecată. Tab-ul activ e alb, cele inactive sunt albe la 50%.

## Tipografie

- Font sans-serif geometric și curat (stil SF Pro / Inter). Pe platformă e suficient fontul de sistem.
- Titlurile sunt mari, cu greutate **medie** (500–600), nu foarte groasă, cu spațiere ușor strânsă.
- Textul meta e mic, alb la 60%, cu greutate normală.
- Opțional, un **font accent de mână** (script sau marker), doar pentru 1–2 cuvinte într-un titlu hero (ex. „Găsește-ți *crew-ul*”). Niciodată pentru text de interfață.

## Mișcare

- Tranziții moi (fade sau slide scurt). Petele aurora pot avea o animație lentă de „respirație”, opțional.

## Ce nu facem

- Fundal crem sau deschis, contururi bleumarin groase, umbre tari decalate (stilul PDF-ului de layout).
- Culori plate saturate pe suprafețe mari.
- Mai mult de un CTA deschis la culoare pe ecran.
