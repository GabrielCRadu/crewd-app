# Build APK local, doar de pe main, cu versiune automată — design

## De ce

Până acum aplicația rulează doar în Expo Go, pe un singur telefon legat prin USB. Vrem un **APK real**, ca să testăm pe mai multe telefoane, fără Expo Go și fără laptopul pornit cu Metro.

## Ce e

- O **comandă manuală** (ex. `npm run apk`), rulată pe acest PC, care construiește un APK Android **mereu din ultima versiune de pe `main`** (`origin/main`), indiferent pe ce branch lucrezi.
- **Versiunea crește automat** cu fiecare commit nou pe `main`: `versionName = 1.0.N`, `versionCode = N`, unde `N = git rev-list --count origin/main`.
- **APK-ul rămâne pe acest PC**, într-un folder fix, cu versiunea în nume (ex. `crewd-1.0.123.apk`). Opțional, comanda îl instalează pe telefoanele legate prin USB.

## Obiective

1. Un APK instalabil, care merge fără Metro și fără Expo Go (bundle-ul JS inclus).
2. Construit doar din `origin/main`; working copy-ul tău și branch-ul curent nu se ating.
3. Versiune automată din numărul de commit-uri de pe `main`; un APK nou se instalează peste cel vechi (aceeași semnătură, `versionCode` mai mare).
4. O singură comandă, cu mesaje clare când lipsește ceva (Java, Android SDK, `.env.local`, cheia de hărți).

## Non-obiective

- Build automat la fiecare push pe `main` (deocamdată manual; se poate adăuga mai târziu).
- Distribuire către alții (link, Play Store, EAS Submit). APK-ul rămâne pe PC.
- iOS.
- Notificări push (cer FCM; reamintirile locale ale lui Cami ar trebui să meargă).
- Login cu Google.

## Anti-obiective

- Build făcut dintr-un branch care nu e `main`, sau din modificări necomise.
- Commit-uri automate de versiune în repo (versiunea se calculează la build, nu se scrie în `app.json` din repo).
- Directoarele `android/`/`ios/` comise în repo sau editate de mână (Continuous Native Generation, regula din AGENTS.md).
- Secrete (`.env.local`, keystore, cheia de hărți) comise în repo.

## Constrângeri

- Windows 11; JDK 21 (Adoptium) și Android SDK (build-tools 34/35) sunt instalate; `~/.android/debug.keystore` există.
- Build-ul local a eșuat înainte din cauza **căilor prea lungi** (ninja din CMake 3.22.1). De aceea build-ul rulează dintr-un **folder cu cale scurtă**, separat de proiect (ex. `C:\crewd-build`).
- Expo SDK 58: `npx expo prebuild --platform android` + Gradle `assembleRelease`. Fără EAS cloud (planul gratuit are ~15 build-uri Android pe lună, iar noi unim multe PR-uri pe zi).
- Config Firebase vine din `.env.local` (`EXPO_PUBLIC_FIREBASE_*`), inclus în bundle la build; se copiază în folderul de build, nu se comite.
- **`react-native-maps` pe Android, în afara Expo Go, cere o cheie Google Maps API** (`android.config.googleMaps.apiKey`). Fără ea, harta e goală sau aplicația se oprește pe tab-ul Hartă.

## Ce s-a decis

- Manual: `npm run apk` (+ o variantă care instalează pe telefoanele conectate, ex. `npm run apk -- --install`).
- Build local pe acest PC, din `origin/main`, într-un worktree/folder separat cu cale scurtă, adus la zi la fiecare rulare (`git fetch` + checkout pe `origin/main`).
- Versiunea `1.0.N` / `N` din numărul de commit-uri de pe `origin/main`, aplicată doar în folderul de build.
- APK-ul final se copiază într-un folder fix de pe PC, cu versiunea în nume.

## Decizii luate de mine (de verificat)

- **Pachetul Android:** `com.crewd.app` (se adaugă în `app.json`, fișier comun; e o adăugire). Nu se mai poate schimba ușor după ce testerii instalează aplicația.
- **Semnătura:** APK-ul de release e semnat cu cheia de debug a acestui PC (`~/.android/debug.keystore`), ca update-urile să se instaleze peste versiunea veche cât timp se construiește pe acest PC. Pentru Play Store va trebui o cheie de upload separată.
- **Folderul de build:** `C:\crewd-build` (cod) și **folderul cu APK-uri:** `C:\crewd-build\apk\`.
- **Cheia Google Maps:** se citește din `.env.local` (ex. `GOOGLE_MAPS_API_KEY`) printr-un `app.config` care o pune în `android.config.googleMaps.apiKey`; fără cheie, build-ul se oprește cu un mesaj clar.
- Scriptul refuză să pornească dacă lipsesc Java/SDK/`.env.local`, și afișează la final calea APK-ului și versiunea.

## Ce rămâne la latitudinea celui care construiește

- Limbajul scriptului (Node `.mjs` în `scripts/`, ca `seed-groups.mjs`).
- Worktree git vs. clonă separată pentru folderul de build; cum se cachează `node_modules` între rulări.
- Dacă se folosește `app.config.ts` care extinde `app.json` sau se modifică `app.json` doar în folderul de build pentru versiune.
- Cum se iau telefoanele conectate pentru `--install` (`adb devices`, `adb -s <id> install -r`).
