import { createHash, createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Environment configuration with validation
export class SecurityConfig {
  static readonly JWT_SECRET = process.env.JWT_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    return 'development-jwt-secret-change-in-production';
  })();

  static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_REFRESH_SECRET environment variable is required in production');
    }
    return 'development-refresh-secret-change-in-production';
  })();

  static readonly ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY environment variable is required in production');
    }
    return 'development-encryption-key-32-chars';
  })();

  static readonly DATABASE_ENCRYPTION_KEY = process.env.DATABASE_ENCRYPTION_KEY || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('DATABASE_ENCRYPTION_KEY environment variable is required in production');
    }
    return 'development-db-encryption-key-32c';
  })();

  static readonly BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');
  
  static readonly SESSION_SECRET = process.env.SESSION_SECRET || (() => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SESSION_SECRET environment variable is required in production');
    }
    return 'development-session-secret-change-in-production';
  })();

  static validate() {
    const requiredInProduction = [
      'JWT_SECRET',
      'JWT_REFRESH_SECRET', 
      'ENCRYPTION_KEY',
      'DATABASE_ENCRYPTION_KEY',
      'SESSION_SECRET'
    ];

    if (process.env.NODE_ENV === 'production') {
      const missing = requiredInProduction.filter(key => !process.env[key]);
      if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
      }
    }

    // Validate key lengths
    if (this.ENCRYPTION_KEY.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be exactly 32 characters');
    }

    if (this.DATABASE_ENCRYPTION_KEY.length !== 32) {
      throw new Error('DATABASE_ENCRYPTION_KEY must be exactly 32 characters');
    }

    if (this.BCRYPT_ROUNDS < 10 || this.BCRYPT_ROUNDS > 15) {
      throw new Error('BCRYPT_ROUNDS must be between 10 and 15');
    }
  }
}

// Initialize and validate configuration
SecurityConfig.validate();

// Encryption utilities for sensitive data at rest
export class DataEncryption {
  private static readonly algorithm = 'aes-256-gcm';

  static async encrypt(text: string, key: string = SecurityConfig.DATABASE_ENCRYPTION_KEY): Promise<string> {
    try {
      const iv = randomBytes(16);
      const cipher = createCipheriv(this.algorithm, Buffer.from(key), iv);
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const authTag = cipher.getAuthTag();
      
      // Combine iv, authTag, and encrypted data
      return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
    } catch (error) {
      throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async decrypt(encryptedData: string, key: string = SecurityConfig.DATABASE_ENCRYPTION_KEY): Promise<string> {
    try {
      const [ivHex, authTagHex, encrypted] = encryptedData.split(':');
      
      if (!ivHex || !authTagHex || !encrypted) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      
      const decipher = createDecipheriv(this.algorithm, Buffer.from(key), iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Hash sensitive identifiers (like email for lookup while preserving privacy)
  static hashIdentifier(identifier: string): string {
    return createHash('sha256').update(identifier).digest('hex');
  }

  // Generate secure random tokens
  static generateSecureToken(length: number = 32): string {
    return randomBytes(length).toString('hex');
  }
}

// Password security utilities
export class PasswordSecurity {
  private static readonly pepper = process.env.PASSWORD_PEPPER || 'default-pepper-change-in-production';

  static async hashPassword(password: string): Promise<string> {
    try {
      // Add pepper to password before hashing
      const pepperedPassword = password + this.pepper;
      
      // Use scrypt for key derivation (more secure than bcrypt for passwords)
      const salt = randomBytes(32);
      const derivedKey = await scryptAsync(pepperedPassword, salt, 64) as Buffer;
      
      return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
    } catch (error) {
      throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const [saltHex, keyHex] = hashedPassword.split(':');
      
      if (!saltHex || !keyHex) {
        return false;
      }
      
      const salt = Buffer.from(saltHex, 'hex');
      const key = Buffer.from(keyHex, 'hex');
      
      const pepperedPassword = password + this.pepper;
      const derivedKey = await scryptAsync(pepperedPassword, salt, 64) as Buffer;
      
      // Use timing-safe comparison
      return this.timingSafeEqual(key, derivedKey);
    } catch (error) {
      return false;
    }
  }

  private static timingSafeEqual(a: Buffer, b: Buffer): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    
    return result === 0;
  }

  // Check password strength
  static checkPasswordStrength(password: string): {
    score: number;
    feedback: string[];
    isValid: boolean;
  } {
    const feedback: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else feedback.push('Use at least 8 characters');

    if (password.length >= 12) score += 1;
    else feedback.push('Use 12+ characters for better security');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[^a-zA-Z0-9]/.test(password)) score += 1;
    else feedback.push('Include special characters');

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      score -= 1;
      feedback.push('Avoid repeating characters');
    }

    if (/123|abc|qwe/i.test(password)) {
      score -= 1;
      feedback.push('Avoid common sequences');
    }

    return {
      score: Math.max(0, score),
      feedback,
      isValid: score >= 4 && feedback.length === 0,
    };
  }
}

// Secure session management
export class SessionSecurity {
  static generateSessionId(): string {
    return DataEncryption.generateSecureToken(64);
  }

  static async createSessionToken(userId: string, sessionId: string): Promise<string> {
    const payload = {
      userId,
      sessionId,
      createdAt: Date.now(),
      type: 'session'
    };

    return DataEncryption.encrypt(JSON.stringify(payload), SecurityConfig.SESSION_SECRET);
  }

  static async validateSessionToken(token: string): Promise<{
    userId: string;
    sessionId: string;
    createdAt: number;
  } | null> {
    try {
      const decrypted = await DataEncryption.decrypt(token, SecurityConfig.SESSION_SECRET);
      const payload = JSON.parse(decrypted);

      if (payload.type !== 'session') {
        return null;
      }

      // Check if session is too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000;
      if (Date.now() - payload.createdAt > maxAge) {
        return null;
      }

      return {
        userId: payload.userId,
        sessionId: payload.sessionId,
        createdAt: payload.createdAt,
      };
    } catch {
      return null;
    }
  }
}
