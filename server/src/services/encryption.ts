import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SALT_LENGTH = 32;
const TAG_LENGTH = 16;
const IV_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

export class EncryptionService {
  private masterKey: string;

  constructor() {
    this.masterKey = process.env.ENCRYPTION_KEY || process.env.JWT_SECRET || 'default-key-change-in-production';
    if (this.masterKey === 'default-key-change-in-production' && process.env.NODE_ENV === 'production') {
      throw new Error('Encryption key must be set in production');
    }
  }

  /**
   * Encrypt a string value
   */
  encrypt(text: string): string {
    try {
      // Generate a random salt
      const salt = crypto.randomBytes(SALT_LENGTH);
      
      // Derive a key from the master key and salt
      const key = crypto.pbkdf2Sync(this.masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');
      
      // Generate a random IV
      const iv = crypto.randomBytes(IV_LENGTH);
      
      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      
      // Encrypt the text
      const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final()
      ]);
      
      // Get the auth tag
      const tag = cipher.getAuthTag();
      
      // Combine salt, iv, tag, and encrypted data
      const combined = Buffer.concat([salt, iv, tag, encrypted]);
      
      // Return base64 encoded
      return combined.toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypt a string value
   */
  decrypt(encryptedText: string): string {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedText, 'base64');
      
      // Extract components
      const salt = combined.slice(0, SALT_LENGTH);
      const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
      const tag = combined.slice(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
      const encrypted = combined.slice(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
      
      // Derive the key from the master key and salt
      const key = crypto.pbkdf2Sync(this.masterKey, salt, ITERATIONS, KEY_LENGTH, 'sha256');
      
      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      
      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Hash a value (one-way, for verification)
   */
  hash(text: string): string {
    return crypto
      .createHash('sha256')
      .update(text + this.masterKey)
      .digest('hex');
  }

  /**
   * Verify a hash
   */
  verifyHash(text: string, hash: string): boolean {
    const computedHash = this.hash(text);
    return crypto.timingSafeEqual(
      Buffer.from(computedHash),
      Buffer.from(hash)
    );
  }

  /**
   * Generate a secure random API key
   */
  generateApiKey(): string {
    const timestamp = Date.now().toString(36);
    const randomBytes = crypto.randomBytes(24).toString('base64url');
    return `ck_${timestamp}_${randomBytes}`;
  }

  /**
   * Mask an API key for display
   */
  maskApiKey(apiKey: string): string {
    if (apiKey.length < 12) return '***';
    return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
  }
}

export const encryptionService = new EncryptionService();