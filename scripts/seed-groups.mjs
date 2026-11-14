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
 * Grupul format primește și o scurtă conversație inventată (messages/demo-1 … demo-4, tot cu id-uri fixe).
 * Membrii fictivi au poze de test de pe Unsplash (aceleași ca în src/data/mockSocial.ts; de scos înainte de prezentare).
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
const avatarPhoto = (photoId) => `https://images.unsplash.com/${photoId}?w=400&h=400&fit=crop&q=70`;
const PEOPLE = [
  { uid: 'demo-ana', name: 'Ana', age: 22, tags: ['Concerte', 'Rock', 'Board games'], photo: avatarPhoto('photo-1459749411175-04bf5292ceea') },
  { uid: 'demo-mihai', name: 'Mihai', age: 25, tags: ['Concerte', 'Electronică', 'Party-uri'], photo: avatarPhoto('photo-1464822759023-fed622ff2c3b') },
  { uid: 'demo-ioana', name: 'Ioana', age: 23, tags: ['Teatru', 'Socializare', 'Jazz'], photo: avatarPhoto('photo-1503095396549-807759245b35') },
  { uid: 'demo-victor', name: 'Victor', age: 27, tags: ['Rock', 'Sport', 'Drumeții'], photo: avatarPhoto('photo-1506905925346-21bda4d32df4') },
  { uid: 'demo-elena', name: 'Elena', age: 21, tags: ['Party-uri', 'Pop', 'Gătit'], photo: null },
  { uid: 'demo-radu', name: 'Andrei', age: 24, tags: ['Concerte', 'Jazz', 'Fotografie'], photo: avatarPhoto('photo-1470225620780-dba8ba36b745') },
];
const members = (list) =>
  Object.fromEntries(list.map((p) => [p.uid, { name: p.name, age: p.age, tags: p.tags, photo: p.photo }]));

/** Ora întâlnirii, ca în aplicație (ex. „19:45”), indiferent de fusul orar al calculatorului. */
const clock = (ms) => new Date(ms).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Bucharest' });

/** Conversația inventată din grupul format: 4 mesaje de la membri, în ultimele 3 ore. */
function demoMessages(people, meetupAtMs, place, now, Timestamp) {
  const at = clock(meetupAtMs);
  const lines = [
    [3 * HOUR, `Salut tuturor! Ne vedem la ${at}, ${place}?`],
    [2 * HOUR, 'Da, eu sigur vin. Ajung cu tramvaiul.'],
    [90 * 60_000, 'Perfect! Eu poate întârzii 5 minute, nu plecați fără mine 😄'],
    [40 * 60_000, `Super, atunci la ${at}, ${place}. Abia aștept!`],
  ];
  return lines.map(([ago, text], i) => ({
    id: `demo-${i + 1}`,
    data: { authorUid: people[i].uid, authorName: people[i].name, text, createdAt: Timestamp.fromMillis(now - ago) },
  }));
}

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
      messages: demoMessages(formed, meetupAt.toMillis(), 'în fața intrării', now, Timestamp),
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
      messages: [],
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

  const messageCount = plans.reduce((n, p) => n + p.messages.length, 0);
  for (const p of plans) {
    console.log(`${p.data.formedAt ? 'format    ' : 'în formare'} ${p.data.memberUids.length} membri · ${p.title} → ${p.path}`);
    for (const m of p.messages) console.log(`    ${m.id}  ${m.data.authorName}: ${m.data.text}`);
  }
  if (DRY_RUN) {
    console.log(`--dry-run: ${plans.length} grupulețe, ${messageCount} mesaje, nimic scris.`);
    return;
  }
  const batch = db.batch();
  for (const p of plans) {
    batch.set(db.doc(p.path), p.data);
    for (const m of p.messages) batch.set(db.doc(`${p.path}/messages/${m.id}`), m.data);
  }
  await batch.commit();
  console.log(`✓ ${plans.length} grupulețe demo scrise, cu ${messageCount} mesaje.`);
}

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});
