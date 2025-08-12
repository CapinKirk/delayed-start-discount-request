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

  it('is timezone aware across different tz', () => {
    // 10:30Z is 03:30 America/Los_Angeles during DST (PDT, UTC-7)
    const now = new Date('2024-06-06T10:30:00Z');
    // Thursday
    const weekdayLA = 4; // Thu
    // Window 03:00-04:00 local LA should include 03:30
    const hours = [{ tz: 'America/Los_Angeles', weekday: weekdayLA, start_local_time: '03:00', end_local_time: '04:00' }];
    expect(evaluateHours(hours as any, now)).toBe(true);
  });
});



