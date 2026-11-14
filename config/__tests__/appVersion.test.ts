import { describe, expect, it } from '@jest/globals';

import { apkFileName, applyBuildConfig, versionFromCommitCount } from '../appVersion';

describe('versionFromCommitCount', () => {
  it('turns the number of commits on main into the app version', () => {
    expect(versionFromCommitCount(123)).toEqual({ versionName: '1.0.123', versionCode: 123 });
  });

  it('refuses a count below 1', () => {
    expect(() => versionFromCommitCount(0)).toThrow();
  });

  it('refuses a count that is not a whole number', () => {
    expect(() => versionFromCommitCount(1.5)).toThrow();
  });
});

describe('apkFileName', () => {
  it('puts the version in the file name', () => {
    expect(apkFileName('1.0.123')).toBe('crewd-1.0.123.apk');
  });
});

describe('applyBuildConfig', () => {
  const base = {
    version: '1.0.0',
    android: { package: 'com.crewd.app' },
    plugins: ['@react-native-community/datetimepicker'] as (string | [string, object])[],
  };
  const mapsPlugin = (plugins: (string | [string, object])[] | undefined) =>
    plugins?.find((p) => Array.isArray(p) && p[0] === 'react-native-maps');

  it('leaves the config unchanged without build variables (Expo Go)', () => {
    const out = applyBuildConfig(base, {});
    expect(out.version).toBe('1.0.0');
    expect(out.android?.versionCode).toBeUndefined();
    expect(mapsPlugin(out.plugins)).toBeUndefined();
  });

  it('applies the build version and the Maps key', () => {
    const out = applyBuildConfig(base, { APP_VERSION_NAME: '1.0.42', APP_VERSION_CODE: '42', GOOGLE_MAPS_API_KEY: 'k' });
    expect(out.version).toBe('1.0.42');
    expect(out.android?.versionCode).toBe(42);
    expect(mapsPlugin(out.plugins)).toEqual(['react-native-maps', { androidGoogleMapsApiKey: 'k' }]);
    expect(out.plugins).toContain('@react-native-community/datetimepicker');
    expect(out.android?.package).toBe('com.crewd.app');
  });

  it('does not modify the config it receives', () => {
    const input = JSON.parse(JSON.stringify(base));
    applyBuildConfig(input, { APP_VERSION_NAME: '1.0.42', APP_VERSION_CODE: '42', GOOGLE_MAPS_API_KEY: 'k' });
    expect(input).toEqual(base);
  });
});
