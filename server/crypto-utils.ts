import crypto from 'node:crypto';

/**
 * Enterprise-grade password hashing using Node.js built-in scrypt
 * with cryptographic random salt and timing-safe comparison.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash, salt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    const hash = crypto.scryptSync(password, salt, 64);
    const storedHashBuffer = Buffer.from(storedHash, 'hex');
    return crypto.timingSafeEqual(hash, storedHashBuffer);
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

export function generateToken(length = 32): string {
  return crypto.randomBytes(length).toString('hex');
}
