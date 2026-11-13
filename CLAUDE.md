@AGENTS.md

## Sincronizare cu GitHub înainte de orice lucru nou

Doi oameni lucrează în paralel pe acest repo, fiecare cu Claude Code. Înainte să începi să construiești ceva nou (ecran, funcție, refactor):

1. Rulează `git fetch --all --prune`.
2. Dacă nu ai modificări necomise, adu `main` la zi cu `git pull --ff-only origin main`. Dacă ai modificări necomise, spune-i utilizatorului înainte de pull.
3. Verifică toate branch-urile de pe remote. Pentru fiecare `origin/<branch>` care nu e `main`, listează commit-urile care nu sunt încă în `main`: `git log --oneline main..origin/<branch>`.
4. Raportează utilizatorului ce e nou pe `main` și pe celelalte branch-uri și dacă se suprapune cu ce urmează să construiești (aceleași fișiere, aceleași ecrane, reguli din AGENTS.md încălcate).
5. Nu face merge la branch-urile altora fără acordul utilizatorului.

Abia după asta începe lucrul nou.

## Branch-uri și Pull Request-uri

- Nu lucra și nu face push pe `main`: `main` se schimbă doar prin Pull Request.
- Un branch pe task, `<nume>/<task-scurt>` (ex. `radu/chat-firestore`), pornit din `main` la zi.
- Push doar pe branch-ul propriu; niciodată commit/push/rebase/force-push pe branch-ul altcuiva.
- PR draft după primul commit (`gh pr create --draft`); cel puțin zilnic `git merge origin/main` (nu rebase).
- Fișiere comune (package.json, app.json, RootNavigator, *Types.ts, src/theme, src/components, src/types, src/services, firestore.rules, todo.md): modificări minime, doar adăugiri, anunțate echipei.
