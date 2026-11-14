import { describe, expect, it } from '@jest/globals';

import { fitsLimit, nextQuality } from '../memoryPhotos';

describe('fitsLimit', () => {
  it('accepts a photo within the limit and refuses a longer one', () => {
    expect(fitsLimit('data:image/jpeg;base64,' + 'A'.repeat(10), 40)).toBe(true);
    expect(fitsLimit('data:image/jpeg;base64,' + 'A'.repeat(40), 40)).toBe(false);
  });
});

describe('nextQuality', () => {
  it('steps the JPEG quality down, then gives up', () => {
    expect(nextQuality(0.75)).toBe(0.6);
    expect(nextQuality(0.6)).toBe(0.45);
    expect(nextQuality(0.45)).toBe(0.3);
    expect(nextQuality(0.3)).toBeNull();
  });
});
