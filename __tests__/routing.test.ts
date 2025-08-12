import { evaluateHours } from '@/lib/routing';

describe('evaluateHours', () => {
  it('returns true when within window', () => {
    const now = new Date('2024-05-06T10:30:00Z');
    const weekday = now.getUTCDay();
    const hh = String(now.getUTCHours()).padStart(2,'0');
    const mm = String(now.getUTCMinutes()).padStart(2,'0');
    const cur = `${hh}:${mm}`;
    const hours = [{ tz: 'UTC', weekday, start_local_time: '00:00', end_local_time: '23:59' }];
    expect(evaluateHours(hours as any, now)).toBe(true);
  });

  it('returns false when outside window', () => {
    const now = new Date('2024-05-06T10:30:00Z');
    const weekday = now.getUTCDay();
    const hours = [{ tz: 'UTC', weekday, start_local_time: '11:00', end_local_time: '12:00' }];
    expect(evaluateHours(hours as any, now)).toBe(false);
  });
});


