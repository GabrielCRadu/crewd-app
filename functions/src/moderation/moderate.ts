import { CONTEXT_SIZE, LOG_TTL_MS, applyThresholds, blockedOutcome, buildPrompt, parseVerdict, shouldSkip } from './rules';
import type { Decision, Verdict } from './rules';

/*
 * Verificarea unui mesaj nou (spec docs/superpowers/specs/2026-11-14-moderare-mesaje-design.md).
 * Gemini (`classify`) și Firestore (`store`) vin din afară (index.ts), ca logica să poată fi testată.
 */

/** Cererea către model: răspunsul JSON, sau blocajul filtrelor Gemini (cu motivul, dacă e dat). */
export type Classify = (prompt: string) => Promise<{ text: string } | { blocked: string | undefined }>;

export interface StoreAction {
  kind: 'flag' | 'remove';
  logId: string;
  log: Record<string, unknown> & { expireAt: Date };
  isDm: boolean;
}

export interface Store {
  /** Există deja intrarea în jurnal (triggerul a rulat deja pentru acest mesaj)? */
  alreadyLogged(logId: string): Promise<boolean>;
  /** Ultimele mesaje dinaintea celui verificat, de la cel mai vechi la cel mai nou. */
  context(limit: number): Promise<{ authorUid: string; text: string }[]>;
  /** Scrie jurnalul și, la „remove”, ascunde mesajul și îl marchează `checked` (o singură scriere). */
  commit(action: StoreAction): Promise<void>;
  /** Marchează mesajul `checked: true`: ceilalți îl pot vedea (aplicația îl ține ascuns până atunci, max. 60 s). */
  markChecked(): Promise<void>;
}

/** Unde ajung avertismentele (în index.ts: loggerul Cloud Functions). */
export type Warn = (message: string, data: Record<string, unknown>) => void;

export interface IncomingMessage {
  authorUid: string;
  text?: string;
  eventId?: string;
  createdAt?: Date;
  removed?: unknown;
}

/** Id-ul intrării din jurnal: calea mesajului, cu `/` înlocuit (un singur jurnal per mesaj). */
export function logIdFor(path: string): string {
  return path.split('/').join('__');
}

async function decide(target: { authorUid: string; text: string }, store: Store, classify: Classify): Promise<Decision> {
  const context = await store.context(CONTEXT_SIZE);
  const first = await classify(buildPrompt(target, context));
  if ('text' in first) return parseVerdict(first.text);
  const outcome = blockedOutcome(first.blocked, context.length === 0);
  if (outcome !== 'recheck') return outcome;
  // Blocat cu context: poate fi vina unui mesaj anterior, deci verificăm mesajul singur.
  const alone = await classify(buildPrompt(target, []));
  if ('text' in alone) return parseVerdict(alone.text);
  return blockedOutcome(alone.blocked, true) as Decision;
}

/**
 * Verifică un mesaj; întoarce ce s-a hotărât („skipped” dacă nu era de verificat). Aruncă la eroare (→ coada de
 * reverificare): atunci mesajul nu e marcat `checked`, ci abia când coada reușește.
 */
export async function moderateMessage(
  input: { path: string; message: IncomingMessage; isDm: boolean; now: Date; fromQueue?: boolean },
  deps: { classify: Classify; store: Store; warn?: Warn },
): Promise<'skipped' | Verdict> {
  const result = await decideAndCommit(input, deps);
  // La „remove”, `checked` s-a scris deja în tranzacția care ascunde mesajul.
  if (result !== 'remove') {
    try {
      await deps.store.markChecked();
    } catch (e) {
      // Moderarea a reușit; fără `checked`, aplicația arată oricum mesajul după 60 s.
      deps.warn?.('moderation_mark_checked_failed', { path: input.path, error: String(e) });
    }
  }
  return result;
}

async function decideAndCommit(
  input: { path: string; message: IncomingMessage; isDm: boolean; now: Date; fromQueue?: boolean },
  deps: { classify: Classify; store: Store },
): Promise<'skipped' | Verdict> {
  const { path, message, isDm, now, fromQueue = false } = input;
  if (shouldSkip(message, now, fromQueue)) return 'skipped';
  // Un eveniment trimis fără text vine din catalogul nostru: nu e nimic de verificat.
  if (!message.text) return 'ok';
  const logId = logIdFor(path);
  if (await deps.store.alreadyLogged(logId)) return 'skipped';

  const decision = applyThresholds(await decide({ authorUid: message.authorUid, text: message.text }, deps.store, deps.classify));
  if (decision.verdict === 'ok') return 'ok';

  await deps.store.commit({
    kind: decision.verdict,
    logId,
    isDm,
    log: {
      path,
      authorUid: message.authorUid,
      text: message.text,
      verdict: decision.verdict,
      category: decision.category,
      confidence: decision.confidence,
      reason: decision.reason,
      checkedAt: now,
      expireAt: new Date(now.getTime() + LOG_TTL_MS),
    },
  });
  return decision.verdict;
}
