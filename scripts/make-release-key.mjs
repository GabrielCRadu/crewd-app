#!/usr/bin/env node
/**
 * Creează, O SINGURĂ DATĂ, cheia privată cu care se semnează APK-ul (audit: APK-ul era semnat cu cheia
 * de debug publică, deci oricine putea face un „update” fals). Cheia stă în afara repo-ului:
 *   %USERPROFILE%\.crewd\crewd-release.keystore
 * iar calea, alias-ul și parolele (generate aleator) se adaugă în .env.local (nu se urcă în git).
 *
 * IMPORTANT: fă o copie a fișierului keystore și a celor 4 rânduri CREWD_* din .env.local într-un loc sigur.
 * Fără ele nu mai poți publica update-uri peste aplicația instalată.
 *
 * Folosire: node scripts/make-release-key.mjs
 */
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ENV = join(ROOT, '.env.local');
const DIR = join(homedir(), '.crewd');
const KEYSTORE = join(DIR, 'crewd-release.keystore');
const ALIAS = 'crewd';

const envText = existsSync(ENV) ? readFileSync(ENV, 'utf8') : '';
if (existsSync(KEYSTORE) || /^CREWD_KEYSTORE_PATH=/m.test(envText)) {
  console.error(`Cheia există deja (${KEYSTORE} sau CREWD_KEYSTORE_PATH în .env.local). Nu o suprascriu.`);
  process.exit(1);
}

mkdirSync(DIR, { recursive: true });
const password = randomBytes(24).toString('base64url');
const javaHome = process.env.JAVA_HOME;
const keytool = javaHome ? join(javaHome, 'bin', 'keytool') : 'keytool';

// Argumentele merg separat (fără shell), ca parola să nu fie interpretată de nimic.
const result = spawnSync(
  keytool,
  [
    '-genkeypair', '-v',
    '-keystore', KEYSTORE,
    '-storetype', 'PKCS12',
    '-alias', ALIAS,
    '-keyalg', 'RSA', '-keysize', '4096', '-validity', '10000',
    '-storepass', password, '-keypass', password,
    '-dname', 'CN=Crewd, O=Crewd, C=RO',
  ],
  { stdio: ['ignore', 'ignore', 'inherit'] },
);
if (result.status !== 0) {
  console.error('keytool a eșuat (e instalat Java? JAVA_HOME?).');
  process.exit(1);
}

appendFileSync(
  ENV,
  `\n# Cheia de semnare a APK-ului (scripts/make-release-key.mjs). Fă o copie de siguranță!\n` +
    `CREWD_KEYSTORE_PATH=${KEYSTORE}\nCREWD_KEY_ALIAS=${ALIAS}\nCREWD_KEYSTORE_PASSWORD=${password}\nCREWD_KEY_PASSWORD=${password}\n`,
);
console.log(`Gata: ${KEYSTORE}\nCalea și parolele sunt în .env.local. Fă o copie de siguranță a amândurora.`);
