<p align="center">
  <img src="github_readme_banner.svg" alt="Crewd" width="100%">
</p>

# Crewd

**Find events in your city, and people to go with.**

Plenty of people skip a concert or a play simply because they have no one to go with: first-year and international students, newcomers to the city, people whose friends like different things.
Crewd fixes that. It is an Android app (Expo / React Native) for going out in Timișoara: you pick an event, join a small group of people who are heading there and like the same things you do, and meet up before it starts. You don't need a friend to say yes first, you go with your crew.

## Features

### Events
- Upcoming and ongoing events near you, in a list or on a map (concerts, theatre, stand-up, parties, workshops, social nights).
- Filters, distance from you, a calendar of the events you've joined, and a reminder one hour before each one.
- Every event credits its source (`sourceName`, `imageCredit`) and links to tickets.
- Signing up for events shapes your preference tags. You pick the first ones during onboarding.

### Small groups at every event
- Once you've joined an event, you see the small groups going to it, ranked by how well they match you (shared tags and age).
- Join a group, or propose your own with a meetup time and place before the event.
- A group forms once **3 people** are in. Only then does its group chat open.

### Chat
- Two tabs: **Groups** and **Direct messages**.
- Messages are moderated automatically by Gemini (Gemini API, called from Cloud Functions). Harmful messages are hidden from the chat; the original is kept for 30 days in a private moderation log. You can also block users.

### Friends map
- See where your friends are and which event they're heading to.
- Location sharing is **off by default**.

### Profile and friends
- A unique `@username`, a required profile photo, bio and tags.
- Badges, memories from past events, and ratings after an event ("I'd go out with them again").
- Friend requests, plus a QR code / invite link (`crewd://invite/<username>`).
- Account deletion. A Cloud Function then cleans up the user's data.

### Languages
The app is in Romanian, with an English version you can switch to at login or in Settings.

## Tech stack

| Area | Tools |
| --- | --- |
| App | Expo SDK 58, React Native 0.88, React 19, TypeScript |
| Navigation | React Navigation 7 (bottom tabs as a material top-tab pager + native stacks) |
| Backend | Firebase JS SDK: Auth (email + password) and Firestore |
| Server-side | Cloud Functions (`functions/`): message moderation with Gemini, cleanup after account deletion |
| Secrets | 1claw vault holds the Gemini API key; `scripts/sync-gemini-key.mjs` copies it into Google Secret Manager for the Cloud Functions |
| Maps & device | `react-native-maps`, `expo-location`, `expo-notifications`, `expo-image-picker` |

## Getting started

**Requirements:** Node.js LTS, and either an Android phone with **Expo Go** or an Android emulator.

```bash
git clone https://github.com/GabrielCRadu/crewd-app.git
cd crewd-app
npm install
npx expo start          # scan the QR code with Expo Go, or press "a" for the emulator
```

### Firebase (required for the full app)
Login, real events, groups and chat all need Firebase. Without a config the app only starts in a demo mode on **mock data** (demo events, a demo profile, no login). To use the real backend:

1. Copy `.env.example` to `.env.local`.
2. Fill in the `EXPO_PUBLIC_FIREBASE_*` values from Firebase Console → Project settings → Your apps → Web app.
3. Restart Metro.

Setup, Firestore rules, the event import and the data schema are documented in [`docs/firebase.md`](docs/firebase.md).

> `.env.local`, service-account keys, signing keys (`*.keystore`) and the raw event files are git-ignored. Never commit them.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the Expo dev server |
| `npm run android` | Start and open on Android |
| `npx tsc --noEmit` | Type-check |
| `npx expo lint` | Lint |
| `npm run apk` | Build a signed release APK from `origin/main` (Windows; needs the release key, see `scripts/make-release-key.mjs`) |
| `node scripts/import-events.mjs --dry-run` | Preview the event import (needs a service-account key) |

The Cloud Functions live in `functions/` and are deployed with `npm --prefix functions run deploy`. Push the Gemini key into Secret Manager first, with `scripts/sync-gemini-key.mjs` (it reads the key from the 1claw vault).

## Project structure

```
src/
  screens/      app screens (auth/, onboarding/, events, groups, chat, map, profile…)
  navigation/   RootNavigator (tabs: Events · Map · Chat · Profile) and the stacks
  services/     all Firestore / data access (*Service.ts); screens never call Firestore directly
  hooks/        React hooks on top of the services
  components/   shared UI
  theme/        design tokens (colors, typography, shape)
  utils/        pure logic: group rules, matching, dates, validation (unit-tested)
  i18n/         Romanian → English dictionary
  data/         mock data used without Firebase
functions/      Cloud Functions (moderation, account cleanup)
scripts/        event import, demo seed, APK build, signing key
docs/           firebase.md, layout-guide.md, design-language.md
firestore.rules Firestore security rules
```

## Design

- **Layout:** which screens exist and what goes where. See [`docs/layout-guide.md`](docs/layout-guide.md).
- **Look:** a monochrome style, with a black background, dark-grey cards and white text. Colour comes only from photos. See [`docs/design-language.md`](docs/design-language.md). All colours go through `src/theme/`.

## Contributing

We work through pull requests: one branch per task (`<name>/<short-task>`), a draft PR early, and no direct pushes to `main`. Before marking a PR ready, merge `origin/main` and make sure `npx tsc --noEmit` and `npx expo lint` pass. What's still mocked or unfinished is tracked in [`todo.md`](todo.md).

## Team

- Radu Gabriel Claudiu ([@GabrielCRadu](https://github.com/GabrielCRadu))
- Camelia Ghib ([@camiG123](https://github.com/camiG123))
- Ștefan Covaci ([@Innesity](https://github.com/Innesity))
- Dumitru David Gabriel ([@xHash200](https://github.com/xHash200))

## License

See [LICENSE](LICENSE).
