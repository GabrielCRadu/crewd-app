@AGENTS.md

## Sincronizare cu GitHub înainte de orice lucru nou

Doi oameni lucrează în paralel pe acest repo, fiecare cu Claude Code. Înainte să începi să construiești ceva nou (ecran, funcție, refactor):

1. Rulează `git fetch --all --prune`.
2. Dacă nu ai modificări necomise, adu `main` la zi cu `git pull --ff-only origin main`. Dacă ai modificări necomise, spune-i utilizatorului înainte de pull.
3. Verifică toate branch-urile de pe remote. Pentru fiecare `origin/<branch>` care nu e `main`, listează commit-urile care nu sunt încă în `main`: `git log --oneline main..origin/<branch>`.
4. Raportează utilizatorului ce e nou pe `main` și pe celelalte branch-uri și dacă se suprapune cu ce urmează să construiești (aceleași fișiere, aceleași ecrane, reguli din AGENTS.md încălcate).
5. Nu face merge la branch-urile altora fără acordul utilizatorului.

Abia după asta începe lucrul nou.
