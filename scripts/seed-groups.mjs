#!/usr/bin/env node
/**
 * Creează grupulețe demo în Firestore, pentru prezentare (events/{eventId}/groups).
 *
 * Folosire (din rădăcina proiectului):
 *   node scripts/seed-groups.mjs --dry-run   # doar citește evenimentele și arată ce ar crea
 *   node scripts/seed-groups.mjs             # scrie grupulețele (cere acordul echipei: proiectul Firebase e comun)
 *
 * Opțiuni: --key <cale> (implicit service-account.json), --events <n> (implicit 5).
 *
 * Pentru primele N evenimente viitoare creează câte 2 grupulețe: unul format (4 membri) și unul în formare (2 membri),
 * cu membri fictivi (uid-uri „demo-*”). Id-urile sunt fixe (demo-<eventId>-a / -b), deci rularea repetată nu dublează.
 * Scrie cu firebase-admin, care ocolește regulile. Schema: docs/firebase.md.
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const DRY_RUN = args.includes('--dry-run');
const KEY = join(ROOT, option('key', 'service-account.json'));
const EVENT_COUNT = Number(option('events', '5'));

const HOUR = 3_600_000;
const PEOPLE = [
  { uid: 'demo-ana', name: 'Ana', age: 22, tags: ['Concerte', 'Rock', 'Board games'] },
  { uid: 'demo-mihai', name: 'Mihai', age: 25, tags: ['Concerte', 'Electronică', 'Party-uri'] },
  { uid: 'demo-ioana', name: 'Ioana', age: 23, tags: ['Teatru', 'Socializare', 'Jazz'] },
  { uid: 'demo-victor', name: 'Victor', age: 27, tags: ['Rock', 'Sport', 'Drumeții'] },
  { uid: 'demo-elena', name: 'Elena', age: 21, tags: ['Party-uri', 'Pop', 'Gătit'] },
  { uid: 'demo-radu', name: 'Andrei', age: 24, tags: ['Concerte', 'Jazz', 'Fotografie'] },
];
const members = (list) => Object.fromEntries(list.map((p) => [p.uid, { name: p.name, age: p.age, tags: p.tags }]));

async function main() {
  if (!existsSync(KEY)) throw new Error(`Nu găsesc cheia contului de serviciu la ${KEY}.`);
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getFirestore, Timestamp } = await import('firebase-admin/firestore');
  initializeApp({ credential: cert(JSON.parse(readFileSync(KEY, 'utf8'))) });
  const db = getFirestore();

  // Primele evenimente care încep peste cel puțin 4 ore (ca grupul în formare să nu fie expirat).
  const minStart = Timestamp.fromMillis(Date.now() + 4 * HOUR);
  const snap = await db.collection('events').where('startsAt', '>=', minStart).orderBy('startsAt').limit(EVENT_COUNT).get();
  const now = Date.now();
  const plans = [];
  snap.docs.forEach((d, i) => {
    const e = d.data();
    const meetupAt = Timestamp.fromMillis(e.startsAt.toMillis() - 15 * 60_000);
    const formed = [PEOPLE[i % 6], PEOPLE[(i + 1) % 6], PEOPLE[(i + 2) % 6], PEOPLE[(i + 3) % 6]];
    const forming = [PEOPLE[(i + 4) % 6], PEOPLE[(i + 5) % 6]];
    const base = { eventId: d.id, meetupAt, tags: e.tags ?? [], createdAt: Timestamp.fromMillis(now - 24 * HOUR) };
    plans.push({
      path: `events/${d.id}/groups/demo-${d.id}-a`,
      title: e.title,
      data: {
        ...base,
        proposerUid: formed[0].uid,
        meetupPlace: 'în fața intrării',
        minAge: 19,
        maxAge: 29,
        maxSize: 6,
        vibe: 'Venim pentru atmosferă, apoi o bere împreună.',
        memberUids: formed.map((p) => p.uid),
        members: members(formed),
        formedAt: Timestamp.fromMillis(now - 20 * HOUR),
      },
    });
    plans.push({
      path: `events/${d.id}/groups/demo-${d.id}-b`,
      title: e.title,
      data: {
        ...base,
        proposerUid: forming[0].uid,
        meetupPlace: 'la bar',
        minAge: 18,
        maxAge: 30,
        maxSize: 8,
        vibe: 'Prima dată acolo, căutăm oameni relaxați.',
        memberUids: forming.map((p) => p.uid),
        members: members(forming),
        formedAt: null,
      },
    });
  });

  for (const p of plans) {
    console.log(`${p.data.formedAt ? 'format    ' : 'în formare'} ${p.data.memberUids.length} membri · ${p.title} → ${p.path}`);
  }
  if (DRY_RUN) {
    console.log(`--dry-run: ${plans.length} grupulețe, nimic scris.`);
    return;
  }
  const batch = db.batch();
  for (const p of plans) batch.set(db.doc(p.path), p.data);
  await batch.commit();
  console.log(`✓ ${plans.length} grupulețe demo scrise.`);
}

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});
