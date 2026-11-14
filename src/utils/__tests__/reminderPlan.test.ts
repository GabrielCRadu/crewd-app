import { describe, expect, it } from '@jest/globals';

import { reminderIdFor, reminderPlan } from '../reminderPlan';

describe('reminderPlan', () => {
  it('schedules only events that have no reminder yet (no doubles after a restart)', () => {
    const scheduled = [reminderIdFor('e1'), reminderIdFor('e2')];
    expect(reminderPlan(['e1', 'e2', 'e3'], scheduled)).toEqual({ add: ['e3'], cancel: [] });
  });

  it('cancels reminders for events you left, even ones scheduled before the restart', () => {
    expect(reminderPlan(['e1'], [reminderIdFor('e1'), reminderIdFor('e9')])).toEqual({ add: [], cancel: [reminderIdFor('e9')] });
  });

  it('ignores notifications that are not reminders', () => {
    expect(reminderPlan([], ['something-else'])).toEqual({ add: [], cancel: [] });
  });
});

describe('reminderPlan: reminders already shown and old ids', () => {
  it('does not add again a reminder that already went off', () => {
    expect(reminderPlan(['e1'], [], ['e1'])).toEqual({ add: [], cancel: [] });
  });

  it('cancels reminders from older builds (ids without the prefix) once', () => {
    expect(reminderPlan(['e1'], ['legacy-uuid'], [], ['legacy-uuid'])).toEqual({ add: ['e1'], cancel: ['legacy-uuid'] });
  });
});
