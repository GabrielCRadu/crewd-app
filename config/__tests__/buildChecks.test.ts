import { describe, expect, it } from '@jest/globals';

import { missingRequirements, parseAdbDevices } from '../buildChecks';

const okEnv = 'EXPO_PUBLIC_FIREBASE_API_KEY=x\nGOOGLE_MAPS_API_KEY=k';

describe('missingRequirements', () => {
  it('is empty when everything needed for the build is there', () => {
    expect(missingRequirements({ javaFound: true, sdkDir: 'C:\sdk', envFileText: okEnv })).toEqual([]);
  });

  it('asks for the Google Maps key when it is missing', () => {
    const out = missingRequirements({ javaFound: true, sdkDir: 'C:\sdk', envFileText: 'EXPO_PUBLIC_FIREBASE_API_KEY=x' });
    expect(out.join('\n')).toContain('GOOGLE_MAPS_API_KEY');
  });

  it('asks for the Google Maps key when it is empty', () => {
    const out = missingRequirements({ javaFound: true, sdkDir: 'C:\sdk', envFileText: 'GOOGLE_MAPS_API_KEY=\n' });
    expect(out.join('\n')).toContain('GOOGLE_MAPS_API_KEY');
  });

  it('asks for .env.local when the file is missing', () => {
    const out = missingRequirements({ javaFound: true, sdkDir: 'C:\sdk', envFileText: null });
    expect(out.join('\n')).toContain('.env.local');
  });

  it('asks for Java', () => {
    expect(missingRequirements({ javaFound: false, sdkDir: 'C:\sdk', envFileText: okEnv }).join('\n')).toContain('Java');
  });

  it('asks for the Android SDK', () => {
    expect(missingRequirements({ javaFound: true, sdkDir: null, envFileText: okEnv }).join('\n')).toContain('Android SDK');
  });
});

describe('parseAdbDevices', () => {
  it('keeps only the phones that are ready', () => {
    expect(
      parseAdbDevices('List of devices attached\nR3CX40JN6DF\tdevice\nemulator-5554\toffline\nABC\tunauthorized\n\n'),
    ).toEqual(['R3CX40JN6DF']);
  });

  it('is empty without phones', () => {
    expect(parseAdbDevices('List of devices attached\n\n')).toEqual([]);
  });

  it('handles Windows line endings', () => {
    expect(parseAdbDevices('List of devices attached\r\nR3CX40JN6DF\tdevice\r\n\r\n')).toEqual(['R3CX40JN6DF']);
  });
});
