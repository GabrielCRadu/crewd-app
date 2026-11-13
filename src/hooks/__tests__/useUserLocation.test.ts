import { describe, expect, it } from '@jest/globals';

import { CITY_CENTER, getLocationNotice } from '../useUserLocation';
import { haversineKm } from '../../utils/distance';

/** Piața Victoriei, Timișoara: orașul evenimentelor din aplicație. */
const TIMISOARA = { latitude: 45.7537, longitude: 21.2257 };

describe('fallback city center', () => {
  it('is in Timișoara (where the events are), not elsewhere', () => {
    expect(haversineKm(CITY_CENTER, TIMISOARA)).toBeLessThan(2);
  });

  it('names Timișoara in the notices shown when the real location is unavailable', () => {
    for (const status of ['denied', 'error'] as const) {
      const notice = getLocationNotice(status) ?? '';
      expect(notice).toContain('Timișoarei');
      expect(notice).not.toContain('Chișinău');
    }
  });

  it('shows no notice when the real location is used', () => {
    expect(getLocationNotice('granted')).toBeNull();
  });
});
