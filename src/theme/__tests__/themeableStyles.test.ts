import { describe, expect, it } from '@jest/globals';
import fs from 'fs';
import path from 'path';

/*
 * Tema se schimbă pe loc (Setări → Temă), deci stilurile care folosesc culori trebuie să se poată
 * reface. Un fișier care scrie `const styles = StyleSheet.create({ … colors … })` ar rămâne pe tema
 * veche. Scrie-le așa:
 *
 *   const makeStyles = () => StyleSheet.create({ … });
 *   let styles = makeStyles();
 *   onThemeChange(() => { styles = makeStyles(); });
 */

const SRC = path.join(__dirname, '..', '..');
const TOKENS = /\b(colors|glass|type|gradients|tagTints)\b/;

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) return name === '__tests__' ? [] : sourceFiles(full);
    return /\.(tsx|ts)$/.test(name) ? [full] : [];
  });
}

describe('styles follow the theme', () => {
  it('no module-level StyleSheet with theme colors is created only once', () => {
    const fixed: string[] = [];
    for (const file of sourceFiles(SRC)) {
      const text = fs.readFileSync(file, 'utf8');
      for (const m of text.matchAll(/^const (\w+) = StyleSheet\.create\(\{([\s\S]*?)^\}\);/gm)) {
        if (TOKENS.test(m[2]!)) fixed.push(`${path.relative(SRC, file)}: ${m[1]}`);
      }
    }
    expect(fixed).toEqual([]);
  });
});
