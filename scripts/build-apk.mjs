#!/usr/bin/env node
/**
 * Construiește APK-ul Android de release din ultima versiune de pe main (origin/main), pe acest PC.
 *
 * Folosire (din rădăcina proiectului):
 *   npm run apk                # construiește C:\crewd-build\apk\crewd-1.0.N.apk
 *   npm run apk -- --install   # îl și instalează pe telefoanele legate prin USB
 *
 * - Lucrează într-un worktree git separat, cu cale scurtă (C:\crewd-build\src), adus la origin/main;
 *   working copy-ul tău și branch-ul curent nu se ating.
 * - Versiunea: 1.0.N, unde N = numărul de commit-uri de pe origin/main (crește singură la fiecare PR unit).
 * - Semnat cu cheia de debug din șablonul Expo, aceeași la fiecare build, ca update-urile să se instaleze peste.
 * Detalii: docs/build-apk.md și docs/superpowers/specs/2026-11-14-build-apk-design.md.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { apkFileName, versionFromCommitCount } = require('../config/appVersion.js');
const { envValue, missingRequirements, parseAdbDevices } = require('../config/buildChecks.js');

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BUILD_DIR = 'C:\\crewd-build';
const SRC = join(BUILD_DIR, 'src');
const APK_DIR = join(BUILD_DIR, 'apk');
const LOCK_HASH_FILE = join(BUILD_DIR, '.lock-hash');
const INSTALL = process.argv.includes('--install');
// Telefoanele reale (32 și 64 de biți); fără x86 (emulatoare), ca build-ul să fie mai rapid și APK-ul mai mic.
const ARCHITECTURES = 'armeabi-v7a,arm64-v8a';

const step = (text) => console.log(`\n▶ ${text}`);

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

/** Rulează o comandă cu ieșirea vizibilă (progresul Gradle); se oprește la prima eroare. */
function run(command, options = {}) {
  const result = spawnSync(command, { stdio: 'inherit', shell: true, ...options });
  if (result.status !== 0) fail(`Comanda a eșuat (cod ${result.status ?? 'necunoscut'}): ${command}`);
}

/** Rulează o comandă și întoarce ce a scris (null dacă a eșuat). */
function capture(command, options = {}) {
  const result = spawnSync(command, { shell: true, encoding: 'utf8', ...options });
  return result.status === 0 ? result.stdout.trim() : null;
}

function findSdkDir() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, 'Android', 'Sdk'),
  ];
  return candidates.find((dir) => dir && existsSync(dir)) ?? null;
}

function hasJava() {
  if (process.env.JAVA_HOME && existsSync(join(process.env.JAVA_HOME, 'bin', 'java.exe'))) return true;
  return spawnSync('java -version', { shell: true, stdio: 'ignore' }).status === 0;
}

function main() {
  // 1. Verificări
  step('Verific Java, Android SDK și .env.local');
  const envPath = join(ROOT, '.env.local');
  const envFileText = existsSync(envPath) ? readFileSync(envPath, 'utf8') : null;
  const sdkDir = findSdkDir();
  const missing = missingRequirements({ javaFound: hasJava(), sdkDir, envFileText });
  if (missing.length > 0) fail(`Nu pot construi APK-ul:\n  - ${missing.join('\n  - ')}`);

  // 2. Ultima versiune de pe main
  step('Aduc ultima versiune de pe main (git fetch origin main)');
  run('git fetch origin main', { cwd: ROOT });

  // 3. Folderul de build (worktree separat, cale scurtă), adus la origin/main
  mkdirSync(BUILD_DIR, { recursive: true });
  if (existsSync(SRC)) {
    step(`Actualizez ${SRC} la origin/main`);
    run(`git -C "${SRC}" checkout --detach --force origin/main`);
  } else {
    step(`Creez ${SRC} (worktree git din origin/main)`);
    run(`git worktree add --detach "${SRC}" origin/main`, { cwd: ROOT });
  }
  const commit = capture(`git -C "${SRC}" log -1 --format="%h %s"`);
  console.log(`  main: ${commit}`);

  // 4. Config-ul Firebase și cheia de hărți (nu sunt în repo)
  copyFileSync(envPath, join(SRC, '.env.local'));

  // 5. Pachetele: doar când s-a schimbat package-lock.json
  const lockHash = createHash('sha256').update(readFileSync(join(SRC, 'package-lock.json'))).digest('hex');
  const lastHash = existsSync(LOCK_HASH_FILE) ? readFileSync(LOCK_HASH_FILE, 'utf8').trim() : null;
  if (lockHash !== lastHash || !existsSync(join(SRC, 'node_modules'))) {
    step('Instalez pachetele (npm ci)');
    run('npm ci', { cwd: SRC });
    writeFileSync(LOCK_HASH_FILE, lockHash);
  } else {
    step('Pachetele sunt la zi (package-lock.json neschimbat)');
  }

  // 6. Versiunea din numărul de commit-uri de pe main
  const count = Number(capture('git rev-list --count origin/main', { cwd: ROOT }));
  const { versionName, versionCode } = versionFromCommitCount(count);
  console.log(`  versiunea: ${versionName} (versionCode ${versionCode})`);
  const env = {
    ...process.env,
    APP_VERSION_NAME: versionName,
    APP_VERSION_CODE: String(versionCode),
    GOOGLE_MAPS_API_KEY: envValue(envFileText, 'GOOGLE_MAPS_API_KEY'),
    NODE_ENV: 'production',
  };

  // 7. Proiectul nativ Android (generat, nu se comite)
  step('Generez proiectul Android (expo prebuild)');
  run('npx expo prebuild --platform android --clean --no-install', { cwd: SRC, env });
  const androidDir = join(SRC, 'android');
  if (!process.env.ANDROID_HOME && !process.env.ANDROID_SDK_ROOT) {
    writeFileSync(join(androidDir, 'local.properties'), `sdk.dir=${sdkDir.replace(/\\/g, '\\\\').replace(/:/g, '\\:')}\n`);
  }

  // 8. Build-ul (primul durează mult: descarcă Gradle și dependențele)
  step('Construiesc APK-ul (Gradle assembleRelease); primul build poate dura 10–20 de minute');
  // Cale completă: cmd nu caută mereu în folderul curent (NoDefaultCurrentDirectoryInExePath).
  run(`"${join(androidDir, 'gradlew.bat')}" assembleRelease -PreactNativeArchitectures=${ARCHITECTURES}`, { cwd: androidDir, env });

  // 9. APK-ul în folderul fix, cu versiunea în nume
  const built = join(androidDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
  if (!existsSync(built)) fail(`Nu găsesc APK-ul construit la ${built}`);
  mkdirSync(APK_DIR, { recursive: true });
  const apkPath = join(APK_DIR, apkFileName(versionName));
  copyFileSync(built, apkPath);
  console.log(`\n✓ APK-ul ${versionName} e gata: ${apkPath}`);

  // 10. Opțional: instalează pe telefoanele conectate
  if (INSTALL) {
    step('Instalez pe telefoanele conectate prin USB');
    const adb = join(sdkDir, 'platform-tools', 'adb.exe');
    const devices = parseAdbDevices(capture(`"${adb}" devices`) ?? '');
    if (devices.length === 0) {
      console.log(`Niciun telefon conectat; APK-ul e în ${apkPath}`);
      return;
    }
    for (const serial of devices) {
      console.log(`  ${serial}`);
      run(`"${adb}" -s ${serial} install -r "${apkPath}"`);
    }
    console.log(`✓ Instalat pe ${devices.length} ${devices.length === 1 ? 'telefon' : 'telefoane'}.`);
  }
}

main();
