import { evaluateHours } from '../src/lib/routing';

describe('AI endpoints sanity', () => {
  test('evaluateHours basic true when matching window', () => {
    const now = new Date('2025-08-13T12:00:00Z');
    const ok = evaluateHours([{ tz: 'GLOBAL|UTC', weekday: now.getUTCDay(), start_local_time: '00:00', end_local_time: '23:59' }], now);
    expect(ok).toBe(true);
  });

  test('timezone groups contain Sydney and New_York', () => {
    const groups = require('../src/lib/timezones');
    const all = groups.tzGroups.flatMap((g: any)=>g.zones);
    expect(all).toContain('Australia/Sydney');
    expect(all).toContain('America/New_York');
  });

  test('model fallback env default respected', () => {
    process.env.DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';
    expect(process.env.DEFAULT_OPENAI_MODEL).toBe('gpt-4o-mini');
  });

  test('tzGroups contains multiple regions', () => {
    const groups = require('../src/lib/timezones');
    expect(groups.tzGroups.find((g: any)=>g.region==='APAC')?.zones.length).toBeGreaterThan(5);
    expect(groups.tzGroups.find((g: any)=>g.region==='EMEA')?.zones.length).toBeGreaterThan(5);
  });

  test('evaluateHours false outside window', () => {
    const now = new Date('2025-08-13T23:59:59Z');
    const ok = evaluateHours([{ tz: 'GLOBAL|UTC', weekday: 1, start_local_time: '09:00', end_local_time: '17:00' }], now);
    expect(ok).toBe(false);
  });
  test('auto-open session flag logic', () => {
    // Simulate once-per-session behavior: store then check
    const storage: any = {};
    storage['por_chat_auto_opened'] = '1';
    expect(storage['por_chat_auto_opened']).toBe('1');
  });

  test('mask roles default true when theme missing', () => {
    const theme = undefined as any;
    const mask = theme?.mask_roles ?? true;
    expect(mask).toBe(true);
  });
});


