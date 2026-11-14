import { describe, expect, it } from '@jest/globals';

import { removeFriendWording } from '../friendWording';

describe('fereastra „elimină din prieteni”', () => {
  it('pentru o femeie spune „prietena”', () => {
    expect(removeFriendWording('female')).toEqual({
      title: 'Vrei să îți elimini prietena?',
      message: 'Nu vă veți mai vedea evenimentele la care mergeți.',
      confirm: 'Elimină prietena',
    });
  });

  it('pentru un bărbat spune „prietenul”', () => {
    expect(removeFriendWording('male')).toEqual({
      title: 'Vrei să îți elimini prietenul?',
      message: 'Nu vă veți mai vedea evenimentele la care mergeți.',
      confirm: 'Elimină prietenul',
    });
  });

  it('pentru „Altul” sau gen necunoscut e neutră', () => {
    const neutral = {
      title: 'Vrei să elimini această persoană din prieteni?',
      message: 'Nu vă veți mai vedea evenimentele la care mergeți.',
      confirm: 'Elimină din prieteni',
    };
    expect(removeFriendWording('other')).toEqual(neutral);
    expect(removeFriendWording(undefined)).toEqual(neutral);
    expect(removeFriendWording(null)).toEqual(neutral);
  });
});
