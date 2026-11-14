// Ia cheia Gemini din seiful 1claw și o pune în Secret Manager (secretul GEMINI_API_KEY),
// de unde o citesc funcțiile de moderare (functions/src/index.ts). Se rulează înainte de deploy,
// și din nou când schimbi cheia în 1claw. Cheia nu se afișează și nu se scrie pe disc.
//
// În .env.local (nu se urcă în repo):
//   ONECLAW_AGENT_ID=...          (id-ul agentului din 1claw)
//   ONECLAW_AGENT_API_KEY=ocv_... (cheia agentului; are voie doar să citească secretul de mai jos)
//   ONECLAW_VAULT_ID=...          (id-ul seifului)
//   ONECLAW_GEMINI_PATH=api-keys/gemini   (opțional; calea secretului în seif)
//
// Rulare: node scripts/sync-gemini-key.mjs   (cere `firebase login` o dată)
import { spawn } from 'node:child_process';

process.loadEnvFile('.env.local');

const API = 'https://api.1claw.co';
const { ONECLAW_AGENT_ID, ONECLAW_AGENT_API_KEY, ONECLAW_VAULT_ID } = process.env;
const path = process.env.ONECLAW_GEMINI_PATH || 'api-keys/gemini';

if (!ONECLAW_AGENT_API_KEY || !ONECLAW_VAULT_ID) {
  console.error('Lipsesc ONECLAW_AGENT_API_KEY sau ONECLAW_VAULT_ID din .env.local.');
  process.exit(1);
}

async function json(res, what) {
  if (!res.ok) throw new Error(`${what}: HTTP ${res.status}`);
  return res.json();
}

// 1. Tokenul agentului (valabil 15 minute).
const { access_token } = await json(
  await fetch(`${API}/v1/auth/agent-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...(ONECLAW_AGENT_ID ? { agent_id: ONECLAW_AGENT_ID } : {}), api_key: ONECLAW_AGENT_API_KEY }),
  }),
  'Autentificarea agentului 1claw',
);

// 2. Secretul (cheia Gemini).
const secret = await json(
  await fetch(`${API}/v1/vaults/${ONECLAW_VAULT_ID}/secrets/${path}`, {
    headers: { Authorization: `Bearer ${access_token}` },
  }),
  `Citirea secretului „${path}” din 1claw`,
);
if (typeof secret.value !== 'string' || !secret.value) throw new Error('Secretul din 1claw e gol.');

// --check: verifică doar că 1claw dă cheia (fără s-o afișeze și fără să scrie ceva).
if (process.argv.includes('--check')) {
  const looksLikeGemini = secret.value.trim().startsWith('AIza');
  console.log(`1claw OK: secretul „${path}” (versiunea ${secret.version}) are ${secret.value.trim().length} caractere${looksLikeGemini ? ', arată ca o cheie Gemini' : ', nu începe cu AIza…'}.`);
  // O cerere inofensivă la Gemini (lista modelelor), ca să vedem că cheia merge; cheia merge în antet, nu în URL.
  const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=50', {
    headers: { 'x-goog-api-key': secret.value.trim() },
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok) {
    const names = (body.models ?? []).map((m) => m.name.replace('models/', ''));
    const wanted = 'gemini-3.5-flash-lite';
    console.log(`Gemini OK (HTTP ${res.status}). Modelul ${wanted} ${names.includes(wanted) ? 'e disponibil' : 'NU apare în listă'}.`);
  } else {
    console.log(`Gemini a refuzat cheia: HTTP ${res.status} ${body.error?.status ?? ''} ${body.error?.message ?? ''}`.trim());
  }
  process.exit(res.ok ? 0 : 1);
}

// 3. În Secret Manager, prin Firebase CLI; valoarea merge pe stdin, nu în argumente.
console.log(`Cheia Gemini a fost luată din 1claw (versiunea ${secret.version}). O scriu în GEMINI_API_KEY…`);
const child = spawn('npx', ['--yes', 'firebase-tools@15', 'functions:secrets:set', 'GEMINI_API_KEY', '--force'], {
  stdio: ['pipe', 'inherit', 'inherit'],
  shell: true,
});
// Fără rând nou la final: CLI-ul păstrează valoarea exact cum o primește.
child.stdin.end(secret.value.trim());
child.on('exit', (code) => {
  if (code === 0) console.log('Gata. Acum: npm --prefix functions run deploy');
  process.exit(code ?? 1);
});
