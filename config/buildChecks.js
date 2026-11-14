/*
 * Verificări pure pentru scripts/build-apk.mjs (testate în config/__tests__/buildChecks.test.ts).
 */

/** Valoarea unei variabile dintr-un fișier .env (null dacă lipsește sau e goală). */
function envValue(envFileText, name) {
  const line = envFileText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .find((l) => l.startsWith(`${name}=`));
  const value = line ? line.slice(name.length + 1).trim().replace(/^["']|["']$/g, '') : '';
  return value || null;
}

/** Ce lipsește ca să putem construi APK-ul; mesaje în română, listă goală dacă e totul ok. */
function missingRequirements({ javaFound, sdkDir, envFileText }) {
  const missing = [];
  if (!javaFound) missing.push('Java (JDK 17+) nu e instalat sau JAVA_HOME nu e setat.');
  if (!sdkDir) missing.push('Android SDK nu e găsit (setează ANDROID_HOME sau instalează-l din Android Studio).');
  if (envFileText === null) {
    missing.push('Lipsește .env.local în rădăcina proiectului (config-ul Firebase și cheia de hărți).');
  } else if (!envValue(envFileText, 'GOOGLE_MAPS_API_KEY')) {
    missing.push('Lipsește GOOGLE_MAPS_API_KEY în .env.local (cheia „Maps SDK for Android”); fără ea harta din APK e goală.');
  }
  return missing;
}

/** Serialele telefoanelor gata de instalare din ieșirea `adb devices` (doar starea „device”). */
function parseAdbDevices(stdout) {
  return stdout
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.trim().split(/\s+/))
    .filter((parts) => parts.length >= 2 && parts[1] === 'device')
    .map((parts) => parts[0]);
}

module.exports = { envValue, missingRequirements, parseAdbDevices };
