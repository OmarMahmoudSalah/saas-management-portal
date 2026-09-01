/**
 * 🔐 AES-256-GCM Per-Tenant Data Encryption & Decryption Service
 * Protects tenant data at rest and prevents cross-tenant data leaks or unauthorized raw DB reads.
 */

import crypto from 'crypto';

export class TenantDataEncryptionService {
  constructor(masterSecret = 'wh_saas_master_secret_key_2026_x99') {
    this.masterSecret = masterSecret;
  }

  /**
   * Derives a unique 256-bit encryption key for a specific tenant.
   */
  deriveTenantKey(tenantId) {
    if (!tenantId) throw new Error('Tenant ID is required for key derivation.');
    const safeTenant = tenantId.toLowerCase().trim();
    return crypto.createHmac('sha256', this.masterSecret).update(`tenant_salt_${safeTenant}`).digest();
  }

  /**
   * Encrypts plaintext string or object using AES-256-GCM per tenant key.
   */
  encryptTenantData(tenantId, data) {
    const key = this.deriveTenantKey(tenantId);
    const iv = crypto.randomBytes(12); // 96-bit IV for AES-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag,
      tenantId: tenantId.toLowerCase().trim(),
      algorithm: 'aes-256-gcm'
    };
  }

  /**
   * Decrypts AES-256-GCM payload using tenant key. Throws error if key mismatch or payload tampered.
   */
  decryptTenantData(tenantId, payload) {
    if (!payload || !payload.encrypted || !payload.iv || !payload.authTag) {
      throw new Error('Invalid encrypted payload structure.');
    }

    const key = this.deriveTenantKey(tenantId);
    const iv = Buffer.from(payload.iv, 'hex');
    const authTag = Buffer.from(payload.authTag, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(payload.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  }
}

export const tenantDataEncryptionService = new TenantDataEncryptionService();
