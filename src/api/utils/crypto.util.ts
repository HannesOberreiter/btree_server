import { Buffer } from 'node:buffer';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import process from 'node:process';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // bytes
const AUTH_TAG_LENGTH = 16; // bytes

function getKey(): string {
  const secret = process.env.LLM_ENCRYPTION_SECRET;
  if (!secret) {
    throw new Error('LLM_ENCRYPTION_SECRET environment variable is not set');
  }
  // Return a 32-char binary string (32 bytes = 256-bit key)
  return createHash('sha256').update(secret).digest('binary');
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const ivBytes = randomBytes(IV_LENGTH);
  const ivStr = ivBytes.toString('binary');

  const cipher = createCipheriv(ALGORITHM, key, ivStr, { authTagLength: AUTH_TAG_LENGTH });
  const encryptedHex
    = cipher.update(plaintext, 'utf8', 'hex')
      + cipher.final('hex');
  const authTagHex = (cipher.getAuthTag() as unknown as Buffer).toString('hex');

  // Format: iv(hex):authTag(hex):ciphertext(hex)
  return `${ivBytes.toString('hex')}:${authTagHex}:${encryptedHex}`;
}

export function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid ciphertext format');
  }
  const ivStr = Buffer.from(parts[0], 'hex').toString('binary');
  const authTagHex = parts[1];
  const encryptedHex = parts[2];

  const decipher = createDecipheriv(ALGORITHM, key, ivStr, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex') as unknown as Uint8Array);

  const decrypted
    = decipher.update(encryptedHex, 'hex', 'utf8')
      + decipher.final('utf8');

  return decrypted;
}
