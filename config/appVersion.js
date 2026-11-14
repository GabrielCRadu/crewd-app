/*
 * Versiunea și configurația de build ale APK-ului (docs/superpowers/specs/2026-11-14-build-apk-design.md).
 * CommonJS, ca să-l folosească și app.config.js, și scripts/build-apk.mjs.
 */

/** Numărul de commit-uri de pe main → versiunea aplicației: 123 → { versionName: '1.0.123', versionCode: 123 }. */
function versionFromCommitCount(count) {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error(`Număr de commit-uri invalid: ${count}`);
  }
  return { versionName: `1.0.${count}`, versionCode: count };
}

/** Numele fișierului APK: '1.0.123' → 'crewd-1.0.123.apk'. */
function apkFileName(versionName) {
  return `crewd-${versionName}.apk`;
}

/**
 * Configul Expo pentru build: versiunea (APP_VERSION_NAME / APP_VERSION_CODE, puse de scriptul de build)
 * și cheia Google Maps (GOOGLE_MAPS_API_KEY, din .env.local) în pluginul react-native-maps.
 * Fără aceste variabile (Expo Go, `npx expo start`), configul rămâne cum e în app.json.
 * Nu modifică obiectul primit.
 */
function applyBuildConfig(config, env) {
  const out = { ...config, android: { ...(config.android ?? {}) }, plugins: [...(config.plugins ?? [])] };
  if (env.APP_VERSION_NAME) out.version = env.APP_VERSION_NAME;
  if (env.APP_VERSION_CODE) out.android.versionCode = Number(env.APP_VERSION_CODE);
  if (env.GOOGLE_MAPS_API_KEY) {
    out.plugins = out.plugins.filter((p) => !(p === 'react-native-maps' || (Array.isArray(p) && p[0] === 'react-native-maps')));
    out.plugins.push(['react-native-maps', { androidGoogleMapsApiKey: env.GOOGLE_MAPS_API_KEY }]);
  }
  return out;
}

module.exports = { versionFromCommitCount, apkFileName, applyBuildConfig };
