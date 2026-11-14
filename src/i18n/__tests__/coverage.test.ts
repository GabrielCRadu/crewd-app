import { describe, expect, it } from '@jest/globals';
import fs from 'fs';
import path from 'path';

import { EN } from '../en';

/*
 * Orice text scris direct în tr('…') sau trPlural(n, '…', '…') trebuie să aibă traducere în en.ts.
 * Dacă testul pică: adaugă traducerea textului nou (sau a celui schimbat) în src/i18n/en.ts.
 */

const SRC = path.join(__dirname, '..', '..');
const STRING = "'((?:[^'\\\\]|\\\\.)*)'";
const TR = new RegExp(`\\btr\\(\\s*${STRING}`, 'g');
const TR_PLURAL = new RegExp(`\\btrPlural\\([^,]+,\\s*${STRING},\\s*${STRING}`, 'g');
const unescape = (s: string) => s.replace(/\\(.)/g, '$1');

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) return name === '__tests__' || name === 'i18n' ? [] : sourceFiles(full);
    return /\.(tsx|ts)$/.test(name) ? [full] : [];
  });
}

function usedKeys(): Map<string, string> {
  const keys = new Map<string, string>();
  for (const file of sourceFiles(SRC)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const m of text.matchAll(TR)) keys.set(unescape(m[1]!), path.relative(SRC, file));
    for (const m of text.matchAll(TR_PLURAL)) {
      keys.set(unescape(m[1]!), path.relative(SRC, file));
      keys.set(unescape(m[2]!), path.relative(SRC, file));
    }
  }
  return keys;
}

describe('English translations', () => {
  it('cover every text written in tr() / trPlural()', () => {
    const missing = [...usedKeys()]
      .filter(([key]) => /[A-Za-zăâîșțĂÂÎȘȚ]/.test(key) && !(key in EN))
      .map(([key, file]) => `${file}: ${key}`);
    expect(missing).toEqual([]);
  });

  it('keep the same {placeholders} as the Romanian text', () => {
    const names = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    const wrong = Object.entries(EN).filter(([ro, en]) => names(ro) !== names(en)).map(([ro]) => ro);
    expect(wrong).toEqual([]);
  });
});
