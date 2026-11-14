# Moderarea automată a mesajelor — plan de implementare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cloud Functions care verifică fiecare mesaj nou (grup + DM) cu Gemini și ascund mesajele periculoase, cu jurnal privat de 30 de zile; aplicația arată „Mesaj eliminat de moderare”.

**Architecture:** Logica pură (prompt, parsarea răspunsului, praguri, ce se sare) stă în `functions/src/moderation/rules.ts`, fără importuri, testată cu Jest-ul din rădăcină. `functions/src/moderation/moderate.ts` primește dependențele (clasificatorul Gemini, scrierea în Firestore) ca parametri, ca să fie testabil. `functions/src/index.ts` leagă triggerele Firestore de ele. Cheia Gemini vine din Secret Manager (`GEMINI_API_KEY`), pusă acolo de `scripts/sync-gemini-key.mjs` din 1claw.

**Tech Stack:** Cloud Functions for Firebase 2nd gen (Node 22, TypeScript), `firebase-admin`, `@google/genai`, Jest (jest-expo din rădăcină).

**Spec:** `docs/superpowers/specs/2026-11-14-moderare-mesaje-design.md`

## Global Constraints

- Termen: 2 zile; fără alerte; testare în emulator; deploy doar la „deploy” de la utilizator (după Blaze).
- `remove` doar cu `confidence ≥ 0.85`, niciodată pentru `self_harm`; altfel `flag`.
- Context: ultimele 5 mesaje; autorii anonimizați („A”, „B”…); textul e date, nu instrucțiuni.
- Mesajele mai vechi de 10 minute nu se mai verifică (retry); `authorUid` cu prefixul `demo-` se sare; idempotent.
- Jurnal `moderation/{id}`: text original, verdict, `expireAt` = +30 zile; reguli: închis pentru aplicație.
- Text nou în aplicație prin `tr()` cu cheie în `src/i18n/en.ts`; stiluri prin `makeStyles` + `onThemeChange`.
- Rădăcina (`tsc`, Expo) nu compilează `functions/` (exclus în `tsconfig.json`).

## Review Focus

1. Răspuns Gemini malformat sau gol → eroare (retry), niciodată „ok” tăcut.
2. Prompt blocat din cauza unui mesaj de context → recheck singur; nu se elimină mesaje nevinovate.
3. Trigger rulat de două ori → o singură intrare în jurnal, fără erori.
4. DM: ultimul mesaj eliminat → `lastText` gol, fără câmpuri noi în `dms/{a_b}` (altfel regula `validLast` rupe trimiterea).
5. Mesaj eliminat care avea doar `eventId` (DM) → afișat ca eliminat, nu ca card de eveniment.

---

### Task 1: Logica pură

**Files:** Create `functions/src/moderation/rules.ts`, `functions/src/moderation/__tests__/rules.test.ts`; Modify `tsconfig.json` (`exclude: ["node_modules", "functions"]`).

**Produces:**
- `type Verdict = 'ok' | 'flag' | 'remove'`; `type Category = 'threat' | 'harassment' | 'hate' | 'sexual' | 'scam' | 'personal_data' | 'self_harm' | 'spam' | 'none'`
- `REMOVE_CONFIDENCE = 0.85`, `MAX_AGE_MS = 600_000`, `CONTEXT_SIZE = 5`
- `parseVerdict(raw: string): { verdict; category; confidence; reason }` — aruncă la JSON invalid / câmpuri lipsă / valori necunoscute.
- `applyThresholds(v): v` — remove sub prag sau self_harm → flag.
- `shouldSkip(msg: { authorUid; createdAt?: Date; removed?: unknown }, now: Date): boolean`.
- `buildPrompt(target: { authorUid; text }, context: { authorUid; text }[]): string` — autorii mapați la A/B/C în ordinea apariției, mesajele între delimitatori, ținta marcată.
- `blockedOutcome(blockReason: string | undefined, alone: boolean): { verdict; category; confidence; reason } | 'recheck'`.

- [ ] Teste (RED): parse ok/invalid; prag 0.84 → flag, 0.9 → remove; self_harm 0.99 → flag; skip demo-/vechi/removed; prompt anonimizează (numele/uid-urile nu apar) și conține delimitatorii; blocat cu context → 'recheck'; blocat singur PROHIBITED_CONTENT → remove sexual; blocat singur alt motiv → flag.
- [ ] Implementare (GREEN), `npx jest functions` verde, `npx tsc --noEmit` verde, commit.

### Task 2: Moderarea unui mesaj (cu dependențe injectate)

**Files:** Create `functions/src/moderation/moderate.ts`, `functions/src/moderation/__tests__/moderate.test.ts`.

**Consumes:** Task 1. **Produces:**
- `type Classify = (prompt: string) => Promise<{ text: string } | { blocked: string | undefined }>`
- `interface Store { alreadyLogged(id): Promise<boolean>; context(): Promise<{authorUid; text}[]>; commit(action: { kind: 'flag' | 'remove'; logId; log: object; isDm: boolean }): Promise<void> }`
- `moderateMessage(input: { path: string; message: { authorUid; text?; eventId?; createdAt?; removed? }; isDm: boolean; now: Date }, deps: { classify: Classify; store: Store }): Promise<'skipped' | Verdict>`
- `logIdFor(path: string): string` (calea cu `/` → `__`).

- [ ] Teste: ok → nimic scris; remove → commit remove cu textul original în jurnal și `expireAt` = now+30z; deja în jurnal → 'skipped' fără commit; blocat cu context → al doilea apel fără context; răspuns invalid → aruncă.
- [ ] Implementare, teste verzi, commit.

### Task 3: Triggerele, clientul Gemini, scrierile reale, cheia din 1claw

**Files:** Create `functions/package.json`, `functions/tsconfig.json`, `functions/src/index.ts`, `functions/.gitignore`, `firebase.json`, `.firebaserc` (proiectul din `.env.local`), `scripts/sync-gemini-key.mjs`; Modify `.gitignore` dacă e nevoie.

- `index.ts`: `onDocumentCreated` pentru cele două căi (`retry: true`, `maxInstances: 5`, `secrets: [GEMINI_API_KEY]`, regiunea ca constantă), `classify` cu `@google/genai` (model în constantă, `responseMimeType: 'application/json'` + schemă, instrucțiunea de sistem), `Store` cu firebase-admin (context: ultimele 5 mesaje după `createdAt`; commit: batch — mesaj `text: ''` (+ `eventId` șters la DM) și `removed: {category, at}`, jurnal, la DM `lastText: ''` dacă ultimul mesaj e cel eliminat).
- `sync-gemini-key.mjs`: ia cheia de la 1claw (API-ul din docs.1claw.co: token de agent, apoi secretul) cu `ONECLAW_*` din `.env.local`, apoi `firebase functions:secrets:set GEMINI_API_KEY` cu valoarea pe stdin (nu în argumente/loguri).
- [ ] `npm --prefix functions install`, `npm --prefix functions run build` verde, commit.

### Task 4: Aplicația, documentația, politica

**Files:** Modify `src/types/chat.ts`, `src/services/chatService.ts`, `src/services/dmFirestore.ts`, `src/services/directMessagesService.ts`, `src/components/chat/MessageRow.tsx`, `src/components/chat/LastMessageLine.tsx`, `src/screens/DirectChatScreen.tsx`, `src/components/DirectThreadsSection.tsx`, `src/i18n/en.ts`, `firestore.rules` (comentariu `moderation/`), `docs/firebase.md`, `src/legal/privacyPolicy.ts`, `src/legal/terms.ts`.

- `removed?: { category: string }` pe mesaje (grup și DM); citit din Firestore.
- Afișare: „Mesaj eliminat de moderare”; autorul: „Mesajul tău a fost eliminat ({categorie})”; previzualizările la fel; un DM eliminat nu arată cardul de eveniment.
- [ ] Test (RED→GREEN) pentru textul de previzualizare al unui mesaj eliminat (funcție pură), `npx tsc --noEmit`, `npx jest`, commit.

### Task 5: Verificare finală

- [ ] Recenzie a branch-ului (subagent), corecturile importante cu test.
- [ ] Pașii utilizatorului: Blaze + alertă de buget, cheia Gemini în 1claw, `node scripts/sync-gemini-key.mjs`, deploy, TTL pe `moderation.expireAt`, regulile publicate.
