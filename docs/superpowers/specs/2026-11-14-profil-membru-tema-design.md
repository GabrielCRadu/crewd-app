# Profilul unui membru din grup și tema din Setări — design (scurt)

## De ce

- În Detaliile grupului vezi lista membrilor, dar nu poți afla mai mult despre ei. Vrei să deschizi profilul unui membru apăsând pe el.
- Tema (luminoasă / întunecată) urmează doar setarea telefonului. Vrei să o alegi din Setări: Luminoasă / Întunecată / Ca telefonul.

## Ce e

1. **Profilul membrului.** În „Membri · N” (Detaliile grupului), fiecare rând (în afară de „tu”) e apăsabil:
   - persoană de test (`PEOPLE`) → profilul ei complet (`PersonProfile`), ca în restul aplicației;
   - cont real → ecran nou „Profilul membrului”: poza, numele, vârsta, `@username` (dacă e cunoscut), tag-urile, „a propus grupul” (dacă e cazul).
   - Datele vin din grup (`members[uid]`), nu din profilul privat. `MemberSummary` primește `username` (sau `null`), copiat la intrare / propunere; regulile Firestore nu se schimbă (nu validează câmpurile din intrare în afară de `photo`). Membrii intrați înainte nu au `@username`.
2. **Tema din Setări.** Secțiune „TEMĂ” cu un comutator „Luminoasă | Întunecată | Ca telefonul” (implicit „Ca telefonul”). Alegerea se salvează pe telefon (AsyncStorage) și aplicația se reîncarcă imediat cu `reloadAppAsync()` din `expo` (merge în release și în debug, după documentația SDK 58). La pornire, tema salvată se citește **înainte** să se încarce ecranele, pentru că `src/theme/colors.ts` calculează culorile o singură dată, la încărcare.

## Non-obiective

- Profil public complet (descriere, oraș, badge-uri, amintiri) pentru conturile reale: cere date publice noi și reguli noi.
- „Adaugă prieten” din profilul membrului (vine cu prietenii pe Firestore).
- Tema schimbată fără reîncărcare (ar cere ca toate stilurile să fie dinamice).

## Ce s-a decis

- `src/theme/themePreference.ts`: `ThemePreference = 'light' | 'dark' | 'system'`, `resolveColorScheme(pref, systemScheme)` (pur, testat), citire/salvare în AsyncStorage, valoarea curentă în memorie.
- `index.ts` înregistrează o componentă mică de pornire care citește preferința, apoi încarcă `App` (`require`), ca `colors.ts` să știe tema la încărcare. `colors.ts` folosește `resolveColorScheme(getThemePreference(), Appearance.getColorScheme())`.
- `app.json` rămâne `userInterfaceStyle: "automatic"`.
- Ecranul nou stă în stiva tab-ului Chat (`MemberProfile: { eventId, groupId, uid }`), fără bara de jos.

## Decizii luate de mine

- Rândul „tu” nu e apăsabil. Membrii de test din grupurile demo din Firestore (`demo-*`) deschid „Profilul membrului” cu ce știe grupul.
- Pe ecranul profilului membrului, poza e miniatura din grup (~96 px), afișată la 112 px.
