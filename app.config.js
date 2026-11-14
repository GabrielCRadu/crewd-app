// Extinde app.json: la build (scripts/build-apk.mjs) pune versiunea și cheia Google Maps din mediu.
// În Expo Go / `npx expo start` nu sunt setate, deci configul rămâne cel din app.json.
const { applyBuildConfig } = require('./config/appVersion');

module.exports = ({ config }) => applyBuildConfig(config, process.env);
