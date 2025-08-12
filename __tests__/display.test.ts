import { resolveDisplayName } from '@/lib/display';

describe('resolveDisplayName', () => {
  it('masks ai/agent under unified name when enabled', () => {
    expect(resolveDisplayName('ai', true, 'Support')).toBe('Support');
    expect(resolveDisplayName('agent', true, 'Support')).toBe('Support');
  });
  it('shows user as You', () => {
    expect(resolveDisplayName('user', true, 'Support')).toBe('You');
  });
  it('shows distinct names when mask disabled', () => {
    expect(resolveDisplayName('agent', false, 'Support')).toBe('Support');
    expect(resolveDisplayName('ai', false, 'Support')).toBe('Assistant');
  });
});


