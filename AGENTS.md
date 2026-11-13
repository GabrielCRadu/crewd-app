This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Navigation uses **React Navigation** (`@react-navigation/native` + `@react-navigation/bottom-tabs`), not Expo Router. Do not introduce Expo Router without asking first.
- The root navigator is `src/navigation/RootNavigator.tsx` (a bottom tab bar with the four main tabs). New navigators (e.g. stacks inside a tab) go in `src/navigation/`.
- Screens live in `src/screens/`; shared components in `src/components/`; colors and theme values in `src/theme/`.
- Install navigation-related packages with `npx expo install` so versions match the Expo SDK.
- Docs: https://reactnavigation.org/docs/getting-started

## Layout guide

- `docs/layout-guide.md` (transcribed from `docs/UI_layout_guide.pdf`) is the source of truth for **layout only**: which screens exist, which elements each has, their order and placement, and the 5 bottom tabs (Descoperă · Evenimente · Hartă · Chat · Profil).
- It does **NOT** define the visual style. Do not copy colors, fonts, borders, shadows or the cream background from the PDF.
- When building or changing a screen, follow its section in `docs/layout-guide.md`. If the guide and the code disagree on layout, ask before diverging.

## Visual style (design language)

- `docs/design-language.md` is the source of truth for **how the app looks**: dark near-black backgrounds, soft warm "aurora" gradients (orange → pink → magenta), frosted-glass surfaces with thin translucent borders, large rounded corners and pill-shaped controls, white text, a light white-to-pink gradient pill for the single primary CTA.
- Implement it only through tokens in `src/theme/` (colors, gradients, glass surfaces, radii). Screens must not hard-code colors.
- The reference images it was extracted from are private (`UI_design_language/`, git-ignored). Never commit them, and do not ask for them: everything needed is in `docs/design-language.md`.
- Layout comes from `docs/layout-guide.md`, look comes from `docs/design-language.md`. Never mix them up.

## Data (Firebase)

- Events come from Firestore via the Firebase JS SDK. Setup, import script and schema are in `docs/firebase.md`.
- Screens never talk to Firestore directly: use `src/services/*Service.ts` and the hooks in `src/hooks/`.
- Firebase config lives in `.env.local` (`EXPO_PUBLIC_FIREBASE_*`), never in code. Never commit `.env.local`, `service-account*.json` or the raw event JSON files (all git-ignored).
- Event data from external sources must keep visible attribution (`source`, `imageCredit`) in the UI.

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md
