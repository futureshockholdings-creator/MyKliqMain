import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;

// Generate a consistent encryption key from environment variables
function getEncryptionKey(): Buffer {
  const keySource = process.env.ENCRYPTION_KEY || process.env.SESSION_SECRET || 'default-key-for-dev';
  return crypto.scryptSync(keySource, 'salt', KEY_LENGTH);
}

export interface EncryptedData {
  encryptedText: string;
  iv: string;
  authTag: string;
}

export function encryptText(plaintext: string): EncryptedData {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encryptedText: encrypted,
    iv: iv.toString('hex'),
    authTag: '' // Not used with CBC mode
  };
}

export function decryptText(encryptedData: EncryptedData): string {
  const key = getEncryptionKey();
  
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encryptedData.encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Simple encryption for storing in database (combines all parts)
export function encryptForStorage(plaintext: string): string {
  const encrypted = encryptText(plaintext);
  return JSON.stringify(encrypted);
}

export function decryptFromStorage(encryptedString: string): string {
  try {
    const encryptedData: EncryptedData = JSON.parse(encryptedString);
    return decryptText(encryptedData);
  } catch (error) {
    console.error('Failed to decrypt data:', error);
    throw new Error('Invalid encrypted data');
  }
}