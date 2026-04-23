import { randomBytes } from 'node:crypto';
import { encryptSecret, decryptSecret } from '@/lib/crypto';

describe('crypto', () => {
  beforeAll(() => {
    process.env.DATASOURCE_ENCRYPTION_KEY = randomBytes(32).toString('base64');
  });

  it('round-trips a secret', () => {
    const secret = 'super-secret-password-42';
    const enc = encryptSecret(secret);
    expect(enc).not.toContain(secret);
    expect(enc.startsWith('v1:')).toBe(true);
    expect(decryptSecret(enc)).toBe(secret);
  });

  it('produces different ciphertexts for the same plaintext', () => {
    const a = encryptSecret('hello');
    const b = encryptSecret('hello');
    expect(a).not.toBe(b);
  });

  it('rejects corrupt ciphertext', () => {
    const enc = encryptSecret('hello');
    const tampered = enc.slice(0, -4) + 'AAAA';
    expect(() => decryptSecret(tampered)).toThrow();
  });

  it('rejects an unknown version', () => {
    expect(() => decryptSecret('v9:a:b:c')).toThrow(/version/);
  });

  it('throws when key is missing', () => {
    const saved = process.env.DATASOURCE_ENCRYPTION_KEY;
    delete process.env.DATASOURCE_ENCRYPTION_KEY;
    try {
      expect(() => encryptSecret('x')).toThrow(/DATASOURCE_ENCRYPTION_KEY/);
    } finally {
      process.env.DATASOURCE_ENCRYPTION_KEY = saved;
    }
  });
});
