import { randomBytes, createCipheriv, createDecipheriv, createHash } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const TAG_LEN = 16;

function key(): Buffer {
  const raw = process.env.DATASOURCE_ENCRYPTION_KEY;
  if (!raw) throw new Error('DATASOURCE_ENCRYPTION_KEY is not set');
  const buf = Buffer.from(raw, 'base64');
  if (buf.length === 32) return buf;
  // Fallback: derive 32 bytes from arbitrary-length key.
  return createHash('sha256').update(raw).digest();
}

/** Encrypts a plaintext secret into a self-contained "v1:iv:ct:tag" base64 blob. */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key(), iv);
  const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64'), ct.toString('base64'), tag.toString('base64')].join(':');
}

export function decryptSecret(blob: string): string {
  const [version, ivB64, ctB64, tagB64] = blob.split(':');
  if (version !== 'v1') throw new Error('unsupported encryption version');
  const iv = Buffer.from(ivB64, 'base64');
  const ct = Buffer.from(ctB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  if (iv.length !== IV_LEN || tag.length !== TAG_LEN) throw new Error('corrupt ciphertext');
  const decipher = createDecipheriv(ALGO, key(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]).toString('utf8');
}
