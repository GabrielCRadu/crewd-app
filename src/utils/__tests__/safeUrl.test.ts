import { describe, expect, it } from '@jest/globals';

import { safeExternalUrl, sanitizeText } from '../safeText';

describe('safeExternalUrl', () => {
  it('keeps https links', () => {
    expect(safeExternalUrl('https://iabilet.ro/bilete-x')).toBe('https://iabilet.ro/bilete-x');
  });

  it('drops everything that is not https', () => {
    for (const u of ['http://x.ro', 'tel:0722', 'sms:0722', 'market://details?id=x', 'javascript:alert(1)', 'intent://x', '', null, undefined, 'not a url']) {
      expect(safeExternalUrl(u)).toBeNull();
    }
  });
});

describe('sanitizeText', () => {
  it('removes invisible and text-direction characters and trims', () => {
    expect(sanitizeText('  Ana\u200B\u202E Pop\u2066  ', 50)).toBe('Ana Pop');
  });

  it('collapses inner whitespace and cuts to the limit', () => {
    expect(sanitizeText('Ana    Maria', 50)).toBe('Ana Maria');
    expect(sanitizeText('a'.repeat(80), 50)).toHaveLength(50);
  });
});
