import crypto from "crypto";

const ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = "sha512";

export async function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, hash] = storedHash.split(":");
    if (!salt || !hash) {
      resolve(false);
      return;
    }
    crypto.pbkdf2(password, salt, ITERATIONS, KEY_LENGTH, DIGEST, (err, derivedKey) => {
      if (err) reject(err);
      // Use timing-safe comparison to prevent timing attacks
      const derivedHex = derivedKey.toString("hex");
      const hashBuffer = Buffer.from(hash, "hex");
      const derivedBuffer = Buffer.from(derivedHex, "hex");
      
      if (hashBuffer.length !== derivedBuffer.length) {
        resolve(false);
        return;
      }
      
      resolve(crypto.timingSafeEqual(hashBuffer, derivedBuffer));
    });
  });
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function generate6DigitCode(): string {
  const randomValue = crypto.randomInt(100000, 1000000);
  return randomValue.toString();
}
