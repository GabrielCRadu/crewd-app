#!/usr/bin/env node
/**
 * Importă evenimentele dintr-un fișier JSON în Firestore (colecția `events`).
 *
 * Folosire (din rădăcina proiectului):
 *   node scripts/import-events.mjs --dry-run                 # geocodează și scrie scripts/data/events-preview.json, fără Firestore
 *   node scripts/import-events.mjs                           # importă în Firestore
 *   node scripts/import-events.mjs --prune                   # importă și șterge evenimentele care nu mai sunt în fișier
 *
 * Opțiuni:
 *   --file <cale>   fișierul cu evenimente (implicit: evenimente-timisoara-verificate.json)
 *   --key <cale>    cheia contului de serviciu Firebase (implicit: service-account.json)
 *
 * Coordonatele locurilor se află o singură dată prin Nominatim (OpenStreetMap, max. 1 cerere/s)
 * și se păstrează în scripts/data/geocode-cache.json. Dacă un loc e greșit, corectează-l acolo
 * (latitude/longitude) și rulează din nou: cache-ul are prioritate.
 *
 * Schema documentelor e descrisă în docs/firebase.md.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, 'scripts', 'data');
const CACHE_FILE = join(DATA_DIR, 'geocode-cache.json');
const PREVIEW_FILE = join(DATA_DIR, 'events-preview.json');

const CITY_CENTER = { latitude: 45.7537, longitude: 21.2257 }; // Timișoara, Piața Victoriei
const MAX_KM_FROM_CENTER = 25;
const USER_AGENT = 'crewd-app-event-import/0.1 (one-off import of venue addresses)';

// ---------- argumente ----------
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const DRY_RUN = flag('dry-run');
const PRUNE = flag('prune');
const FILE = join(ROOT, option('file', 'evenimente-timisoara-verificate.json'));
const KEY = join(ROOT, option('key', 'service-account.json'));

// ---------- mapări către modelul aplicației (src/types/events.ts) ----------

/** Tipul din fișier → CategoryId din aplicație. */
const CATEGORY_BY_TYPE = {
  concert: 'muzica',
  teatru: 'teatru',
  'stand-up': 'standup',
  petrecere: 'party',
  workshop: 'ateliere',
  atelier: 'ateliere',
  socializare: 'social',
};

/** Tipul din fișier → tag-ul de profil corespunzător (src/data/tags.ts, „Tipuri de evenimente”). */
const PROFILE_TAG_BY_TYPE = {
  concert: 'Concerte',
  teatru: 'Teatru',
  'stand-up': 'Teatru',
  petrecere: 'Party-uri',
  socializare: 'Socializare',
};

/** Tag-urile de profil (Muzică, Hobby-uri) recunoscute în cuvintele-cheie ale evenimentului. */
const PROFILE_TAGS = ['Rock', 'Electronică', 'Hip-hop', 'Jazz', 'Pop', 'Folk', 'Board games', 'Drumeții', 'Fotografie', 'Gaming', 'Sport', 'Gătit'];

const normalize = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

function profileTags(event) {
  const words = normalize([event.title, ...(event.tags ?? [])].join(' '));
  const tags = new Set();
  if (PROFILE_TAG_BY_TYPE[event.type]) tags.add(PROFILE_TAG_BY_TYPE[event.type]);
  for (const tag of PROFILE_TAGS) {
    if (` ${words} `.includes(` ${normalize(tag)} `)) tags.add(tag);
  }
  return [...tags];
}

// ---------- geocodare ----------

function haversineKm(a, b) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastRequestAt = 0;

async function nominatim(q) {
  const wait = 1100 - (Date.now() - lastRequestAt);
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=ro&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, 'Accept-Language': 'ro' } });
  if (!res.ok) throw new Error(`Nominatim ${res.status} pentru „${q}”`);
  const [hit] = await res.json();
  if (!hit) return null;
  const point = { latitude: Number(hit.lat), longitude: Number(hit.lon) };
  return haversineKm(point, CITY_CENTER) <= MAX_KM_FROM_CENTER ? point : null;
}

/** „Str. Mărășești nr. 2, et. V, Timișoara” → „Strada Mărășești 2, Timișoara” (Nominatim nu înțelege etaje, interfoane etc.). */
function cleanAddress(address) {
  if (!address) return null;
  const parts = address
    .split(',')
    .map((p) => p.trim())
    .filter((p) => !/^(et|etaj|ap|sc|bl|interfon|cam)\b/i.test(p));
  return parts
    .join(', ')
    .replace(/\bStr\.\s*/i, 'Strada ')
    .replace(/\bBd\.\s*|\bBdul\.?\s*/i, 'Bulevardul ')
    .replace(/\bnr\.\s*/gi, '')
    .replace(/\s+/g, ' ');
}

/** „Teatrul X – Studio Y (detalii)” → „Teatrul X” (numele principal al locului). */
function mainVenueName(venueName) {
  return venueName.replace(/\(.*?\)/g, '').split(/\s[–-]\s|,/)[0].trim();
}

async function geocodeVenue(venueName, address, city, cache) {
  const key = `${venueName} | ${address ?? ''}`;
  if (cache[key]) return cache[key];

  const queries = [
    address,
    cleanAddress(address),
    `${venueName}, ${city}`,
    `${mainVenueName(venueName)}, ${city}`,
    address?.split(',').slice(-2).join(','),
  ].filter((q, i, all) => q && all.indexOf(q) === i);
  for (const q of queries) {
    const point = await nominatim(q);
    if (point) {
      cache[key] = { ...point, approximate: false, query: q };
      return cache[key];
    }
  }
  console.warn(`  ⚠ Nu am găsit coordonate pentru „${key}”: folosesc centrul orașului (corectează în geocode-cache.json).`);
  cache[key] = { ...CITY_CENTER, approximate: true, query: null };
  return cache[key];
}

// ---------- main ----------

async function main() {
  if (!existsSync(FILE)) throw new Error(`Nu găsesc fișierul ${FILE}`);
  const source = JSON.parse(readFileSync(FILE, 'utf8'));
  const events = source.events ?? [];
  console.log(`${events.length} evenimente în ${FILE}`);

  mkdirSync(DATA_DIR, { recursive: true });
  const cache = existsSync(CACHE_FILE) ? JSON.parse(readFileSync(CACHE_FILE, 'utf8')) : {};

  const unknownTypes = [...new Set(events.map((e) => e.type).filter((t) => !CATEGORY_BY_TYPE[t]))];
  if (unknownTypes.length) console.warn(`  ⚠ Tipuri fără categorie (devin „social”): ${unknownTypes.join(', ')}`);

  const docs = [];
  for (const e of events) {
    const location = await geocodeVenue(e.venueName, e.address, e.city ?? 'Timișoara', cache);
    writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2)); // salvăm pe parcurs, ca o întrerupere să nu piardă cererile făcute
    docs.push({
      id: e.id,
      data: {
        title: e.title,
        description: e.description ?? '',
        type: e.type,
        category: CATEGORY_BY_TYPE[e.type] ?? 'social',
        tags: profileTags(e),
        keywords: e.tags ?? [],
        startsAt: e.startsAt,
        endsAt: e.endsAt ?? null,
        doorsOpenAt: e.doorsOpenAt ?? null,
        timeNote: e.timeNote ?? null,
        durationMinutes: e.durationMinutes ?? null,
        durationText: e.durationText ?? null,
        venueName: e.venueName,
        address: e.address ?? '',
        city: e.city ?? 'Timișoara',
        location: { latitude: location.latitude, longitude: location.longitude },
        locationApproximate: location.approximate,
        organizer: e.organizer ?? null,
        price: e.price ?? null,
        ageRestriction: e.ageRestriction ?? null,
        imageUrl: e.imageUrl ?? '',
        imageCredit: e.imageCredit ?? null,
        sourceName: e.sourceName ?? null,
        sourceUrl: e.sourceUrl ?? null,
        ticketUrl: e.ticketUrl ?? null,
      },
    });
  }

  const approximate = docs.filter((d) => d.data.locationApproximate).length;
  console.log(`Coordonate: ${docs.length - approximate} găsite, ${approximate} aproximate (centrul orașului).`);

  if (DRY_RUN) {
    writeFileSync(PREVIEW_FILE, JSON.stringify(docs, null, 2));
    console.log(`--dry-run: nimic scris în Firestore. Previzualizare: ${PREVIEW_FILE}`);
    return;
  }

  if (!existsSync(KEY)) {
    throw new Error(`Nu găsesc cheia contului de serviciu la ${KEY}. Descarc-o din Firebase Console → Project settings → Service accounts.`);
  }
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getFirestore, GeoPoint, Timestamp, FieldValue } = await import('firebase-admin/firestore');
  const serviceAccount = JSON.parse(readFileSync(KEY, 'utf8'));
  initializeApp({ credential: cert(serviceAccount) });
  const db = getFirestore();
  console.log(`Proiect Firebase: ${serviceAccount.project_id}`);

  const toTimestamp = (iso) => (iso ? Timestamp.fromDate(new Date(iso)) : null);
  const BATCH_SIZE = 400; // limita Firestore e 500 de operații per batch
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = db.batch();
    for (const { id, data } of docs.slice(i, i + BATCH_SIZE)) {
      batch.set(db.collection('events').doc(id), {
        ...data,
        startsAt: toTimestamp(data.startsAt),
        endsAt: toTimestamp(data.endsAt),
        doorsOpenAt: toTimestamp(data.doorsOpenAt),
        location: new GeoPoint(data.location.latitude, data.location.longitude),
        importedAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
  }
  console.log(`✓ ${docs.length} evenimente scrise în events/.`);

  if (PRUNE) {
    const ids = new Set(docs.map((d) => d.id));
    const existing = await db.collection('events').listDocuments();
    const stale = existing.filter((ref) => !ids.has(ref.id));
    for (let i = 0; i < stale.length; i += BATCH_SIZE) {
      const batch = db.batch();
      stale.slice(i, i + BATCH_SIZE).forEach((ref) => batch.delete(ref));
      await batch.commit();
    }
    console.log(`✓ ${stale.length} evenimente vechi șterse.`);
  }

  await db.collection('meta').doc('eventsImport').set({
    city: source.meta?.city ?? 'Timișoara',
    collectedAt: source.meta?.collectedAt ?? null,
    dateRange: source.meta?.dateRange ?? null,
    count: docs.length,
    notes: source.meta?.notes ?? [],
    importedAt: FieldValue.serverTimestamp(),
  });
  console.log('✓ meta/eventsImport actualizat.');
}

main().catch((error) => {
  console.error(`✗ ${error.message}`);
  process.exit(1);
});
