import { initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import type { DocumentReference } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import type { FirestoreEvent, QueryDocumentSnapshot } from 'firebase-functions/v2/firestore';
import { defineSecret } from 'firebase-functions/params';
import * as logger from 'firebase-functions/logger';
import { GoogleGenAI, HarmBlockThreshold, HarmCategory } from '@google/genai';

import { moderateMessage } from './moderation/moderate';
import type { Classify, IncomingMessage, Store } from './moderation/moderate';
import { CATEGORIES, SYSTEM_INSTRUCTION } from './moderation/rules';

/*
 * Moderarea automată a mesajelor (spec docs/superpowers/specs/2026-11-14-moderare-mesaje-design.md):
 * la fiecare mesaj nou din chatul unui grup sau dintr-o conversație directă, Gemini dă un verdict;
 * mesajele periculoase se ascund, iar originalul rămâne 30 de zile în jurnalul privat moderation/.
 *
 * Cheia Gemini e în Secret Manager (GEMINI_API_KEY), pusă acolo din 1claw de scripts/sync-gemini-key.mjs.
 */

initializeApp();
const db = getFirestore();

/** Baza de date e în eur3: triggerele Firestore rulează în europe-west1. */
const REGION = 'europe-west1';
/** Un model Gemini rapid și ieftin; se schimbă aici. */
const MODEL = 'gemini-3.5-flash-lite';

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

setGlobalOptions({ region: REGION, maxInstances: 5 });

let client: GoogleGenAI | null = null;
function gemini(): GoogleGenAI {
  client ??= new GoogleGenAI({ apiKey: GEMINI_API_KEY.value().trim() });
  return client;
}

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    verdict: { type: 'string', enum: ['ok', 'flag', 'remove'] },
    category: { type: 'string', enum: CATEGORIES },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    reason: { type: 'string' },
  },
  required: ['verdict', 'category', 'confidence', 'reason'],
};

/**
 * Motivele pentru care Gemini nu dă un răspuns, tratate ca „blocat” (mesajul se semnalează, nu se pierde):
 * filtrele lui și răspunsurile pe care nu le poate da (limbă, recitare, altele).
 */
const BLOCK_FINISH_REASONS = new Set([
  'SAFETY',
  'PROHIBITED_CONTENT',
  'BLOCKLIST',
  'SPII',
  'IMAGE_SAFETY',
  'LANGUAGE',
  'RECITATION',
  'OTHER',
]);

const SAFETY_OFF = [
  HarmCategory.HARM_CATEGORY_HARASSMENT,
  HarmCategory.HARM_CATEGORY_HATE_SPEECH,
  HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
  HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
].map((category) => ({ category, threshold: HarmBlockThreshold.OFF }));

const classify: Classify = async (prompt) => {
  const response = await gemini().models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      // Moderatorul trebuie să poată citi mesajele periculoase: filtrele reglabile ale Gemini sunt oprite,
      // decide instrucțiunea noastră. (Protecțiile de bază ale Google rămân; un blocaj se tratează în moderate.ts.)
      safetySettings: SAFETY_OFF,
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0,
      responseMimeType: 'application/json',
      responseJsonSchema: RESPONSE_SCHEMA,
    },
  });
  const blockReason = response.promptFeedback?.blockReason;
  if (blockReason) return { blocked: String(blockReason) };
  const finish = response.candidates?.[0]?.finishReason;
  if (finish && BLOCK_FINISH_REASONS.has(String(finish))) return { blocked: String(finish) };
  const text = response.text;
  if (!text) throw new Error(`Răspuns gol de la Gemini (finishReason: ${String(finish)})`);
  return { text };
};

function toDate(v: unknown): Date | undefined {
  return v instanceof Timestamp ? v.toDate() : undefined;
}

function incoming(data: FirebaseFirestore.DocumentData): IncomingMessage {
  return {
    authorUid: String(data.authorUid ?? ''),
    text: typeof data.text === 'string' ? data.text : undefined,
    eventId: typeof data.eventId === 'string' ? data.eventId : undefined,
    createdAt: toDate(data.createdAt),
    removed: data.removed,
  };
}

/** Accesul la Firestore pentru un mesaj anume (cu drepturi de admin: ocolește regulile). */
function storeFor(messageRef: DocumentReference, createdAt: Date | undefined, dmRef: DocumentReference | null): Store {
  return {
    alreadyLogged: async (logId) => (await db.collection('moderation').doc(logId).get()).exists,
    context: async (limit) => {
      if (!createdAt) return [];
      const snap = await messageRef.parent
        .where('createdAt', '<', Timestamp.fromDate(createdAt))
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();
      return snap.docs
        .map((d) => d.data())
        .filter((d) => typeof d.text === 'string' && d.text && !d.removed)
        .map((d) => ({ authorUid: String(d.authorUid ?? ''), text: String(d.text) }))
        .reverse();
    },
    // Totul într-o tranzacție: jurnalul, ascunderea mesajului și (la DM) previzualizarea, ca o reîncercare
    // sau un răspuns sosit chiar atunci să nu lase textul în listă și nici să golească alt mesaj.
    commit: async (action) => {
      const logRef = db.collection('moderation').doc(action.logId);
      await db.runTransaction(async (tx) => {
        const [log, dm] = await Promise.all([tx.get(logRef), dmRef && action.kind === 'remove' ? tx.get(dmRef) : null]);
        if (log.exists) return; // altă execuție a aceluiași trigger a terminat deja
        tx.create(logRef, {
          ...action.log,
          checkedAt: Timestamp.fromDate(action.log.checkedAt as Date),
          expireAt: Timestamp.fromDate(action.log.expireAt),
        });
        if (action.kind !== 'remove') return;
        tx.update(messageRef, {
          text: '',
          ...(action.isDm ? { eventId: FieldValue.delete() } : {}),
          removed: { category: action.log.category, at: FieldValue.serverTimestamp() },
        });
        // DM: previzualizarea arată acest mesaj doar dacă e încă ultimul (același autor, aceeași oră a serverului).
        const d = dm?.data();
        const lastAt = d?.lastAt instanceof Timestamp ? d.lastAt.toMillis() : null;
        if (dmRef && d && d.lastBy === action.log.authorUid && createdAt && lastAt === createdAt.getTime()) {
          tx.update(dmRef, { lastText: '', lastEventId: null });
        }
      });
    },
  };
}

async function handle(event: FirestoreEvent<QueryDocumentSnapshot | undefined>, isDm: boolean): Promise<void> {
  const snap = event.data;
  if (!snap) return;
  const message = incoming(snap.data());
  const dmRef = isDm ? (snap.ref.parent.parent as DocumentReference) : null;
  const result = await moderateMessage(
    { path: snap.ref.path, message, isDm, now: new Date() },
    { classify, store: storeFor(snap.ref, message.createdAt, dmRef) },
  );
  if (result === 'flag' || result === 'remove') logger.info('moderation', { path: snap.ref.path, result });
}

/** Chatul unui grup de la un eveniment. */
export const moderateGroupMessage = onDocumentCreated(
  { document: 'events/{eventId}/groups/{groupId}/messages/{messageId}', secrets: [GEMINI_API_KEY], retry: true },
  (event) => handle(event, false),
);

/** Mesajele directe între prieteni. */
export const moderateDirectMessage = onDocumentCreated(
  { document: 'dms/{pairId}/messages/{messageId}', secrets: [GEMINI_API_KEY], retry: true },
  (event) => handle(event, true),
);
