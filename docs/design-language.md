# Limbajul vizual Crewd: monocrom

Acesta este **aspectul** aplicației: culori, materiale, forme și tipografie. **Layout-ul** (ce e pe fiecare ecran și unde) vine din [layout-guide.md](layout-guide.md). Cele două se combină: layout-ul din ghid, desenat în stilul de aici.

Stilul a pornit de la profilul altei persoane (`PersonProfileScreen`) și se aplică **în toată aplicația**.

## Ideea

**Negru, gri și alb. Culoarea o dau pozele, nu interfața.** Interfața e sobră și editorială: fundal negru simplu, carduri gri închis cu un contur fin, text alb, titluri mari și grele, etichete mici cu majuscule. Ce are culoare pe ecran sunt fotografiile (oameni, evenimente).

## Culori

| Rol | Valoare | Folosire |
| --- | --- | --- |
| Fundal | `#000000` | fundalul tuturor ecranelor |
| Fundal secundar | `#111111` | locul pozelor care lipsesc, zone mari |
| Card | alb la 7% | carduri, liste, câmpuri |
| Card apăsat | alb la 13% | elemente apăsate, peste poze/hartă |
| Suprafață opacă | `#161616` | carduri peste hartă |
| Contur | alb la 12%, 1 px | marginea cardurilor |
| Text principal | `#FFFFFF` | titluri, text important |
| Text secundar | alb la 62% | subtitluri, meta (oră, distanță) |
| Text discret | alb la 40% | placeholder, note mici |
| Accent / element activ | `#FFFFFF` | butonul principal, segmentul activ, chip-ul ales |

**Singurele culori:** roșu pentru erori și raportări, verde pentru confirmare, iar pe hartă culorile de distanță (aproape, mediu, departe), pentru că transmit informație. Nimic altceva nu e colorat: fără gradienturi calde, fără „aurora”, fără nuanțe pe carduri.

## Forme

- Colțuri mari: **carduri 26**, casete interioare **16**, butoane și chip-uri **pastilă**, butoane-iconiță **14** sau cerc.
- Carduri: fundal gri închis + contur fin. Fără umbre colorate, fără contururi groase.
- Umbre: doar foarte moi și negre, pentru elementele care plutesc (cardurile de pe hartă).

## Componente

- **Butonul principal:** pastilă **albă plină**, text închis, cu iconiță. Unul singur pe ecran.
- **Buton secundar:** pastilă gri (card) cu contur fin, text alb.
- **Segmente / comutator:** segmentul activ e o pastilă albă cu text închis; restul, gri.
- **Chip-uri / tag-uri:** pastile gri. Cele alese sau comune sunt albe cu text închis. Cele adăugate automat au contur punctat.
- **Butoane-iconiță:** pătrat rotunjit sau cerc gri, iconiță albă.
- **Avatare:** poza persoanei; fără poză, inițiala pe gri.
- **Locul pozelor care lipsesc** (`Aurora`, nume istoric): gri închis plat, cu umbrire jos dacă are text deasupra.
- **Bara de jos:** fundal negru; tab-ul activ alb, cele inactive estompate.

## Tipografie

- Font de sistem (sans-serif).
- **Titlurile de ecran:** mari și grele (`fontWeight: '800'`, spațiere strânsă). Numele de pe profil, foarte mari (~46).
- **Etichetele de secțiune și de câmp:** mici (12), groase (700), **MAJUSCULE**, cu litere spațiate (1.6), gri.
- Textul obișnuit: 15–16, alb; meta: 13, gri.

## Implementare în cod

Stilul se aplică doar prin tokenii și componentele comune de mai jos. Ecranele nu scriu culori direct.

| Ce | Unde |
| --- | --- |
| Culori | `src/theme/colors.ts` |
| Tipografie (`type.label`, `type.screenTitle`) | `src/theme/typography.ts` |
| „Gradienturi” (acum neutre: butonul alb, umbrirea pozelor, avatarele gri) | `src/theme/gradients.ts` |
| Raze de colț și stilul `glass` (card gri + contur) | `src/theme/shape.ts` |
| Umbra moale | `src/theme/shadows.ts` |
| Hartă întunecată, doar gri (Google Maps, Android) | `src/theme/mapStyle.ts` |
| Locul pozelor care lipsesc | `src/components/Aurora.tsx` |
| Buton principal | `src/components/GradientButton.tsx` |
| Buton-iconiță | `src/components/GlassIconButton.tsx` |
| Chip / tag | `src/components/Chip.tsx` |
| Comutator cu segmente | `src/components/SegmentedControl.tsx` |
| Avatar | `src/components/Avatar.tsx` |

Unele nume au rămas din varianta colorată (`Aurora`, `GradientButton`, `ScreenGlow`, `tagTints.orange`, `gradients.tintWarm`), ca să nu se schimbe toate ecranele; valorile lor sunt acum neutre.

## Ce nu facem

- Gradienturi colorate, lumină caldă „aurora”, nuanțe pe carduri, contururi colorate.
- Culori pe elementele de interfață (butoane, chip-uri, carduri), în afară de erori și distanțe pe hartă.
- Culori scrise direct în ecrane.
