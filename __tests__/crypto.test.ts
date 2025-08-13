import { encryptString, decryptString } from '@/lib/crypto';

describe('crypto', () => {
  it('encrypts and decrypts round-trip', () => {
    const text = 'hello-world';
    const enc = encryptString(text);
    expect(typeof enc).toBe('string');
    const dec = decryptString(enc);
    expect(dec).toBe(text);
  });
});




