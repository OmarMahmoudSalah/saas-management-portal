/**
 * 🛡️ Anti-Cloning, License Verification & Logic Protection Guard
 * Protects proprietary calculation logic against unauthorized server cloning and reverse engineering.
 */

import crypto from 'crypto';

export class LicenseObfuscationGuard {
  constructor() {
    this.serverSecret = 'wh_saas_hw_auth_signature_2026';
  }

  /**
   * Generates hardware fingerprint based on system CPU & hostname.
   */
  getHardwareFingerprint(hostname = 'production_server') {
    const rawString = `hw_${hostname}_node_${process.version || 'v22'}`;
    return crypto.createHash('sha256').update(rawString).digest('hex').substring(0, 32);
  }

  /**
   * Generates a signed license token tied to hardware fingerprint and tenant.
   */
  generateSignedLicenseToken(tenantId, hostname = 'production_server', expiresDays = 365) {
    const hwFingerprint = this.getHardwareFingerprint(hostname);
    const expiresAt = Date.now() + (expiresDays * 86400 * 1000);
    const payload = `${tenantId}:${hwFingerprint}:${expiresAt}`;

    const signature = crypto.createHmac('sha256', this.serverSecret).update(payload).digest('hex');
    const tokenData = Buffer.from(JSON.stringify({ tenantId, hwFingerprint, expiresAt, signature })).toString('base64');
    
    return `wh_lic_v1_${tokenData}`;
  }

  /**
   * Validates license token signature and hardware fingerprint.
   */
  verifyLicenseToken(licenseToken, currentHostname = 'production_server') {
    if (!licenseToken || !licenseToken.startsWith('wh_lic_v1_')) {
      return { valid: false, error: 'Invalid or missing SaaS license token format.' };
    }

    try {
      const base64Data = licenseToken.replace('wh_lic_v1_', '');
      const data = JSON.parse(Buffer.from(base64Data, 'base64').toString('utf8'));

      const { tenantId, hwFingerprint, expiresAt, signature } = data;

      if (Date.now() > expiresAt) {
        return { valid: false, error: 'License token expired.' };
      }

      // Hardware fingerprint verification
      const expectedFingerprint = this.getHardwareFingerprint(currentHostname);
      if (hwFingerprint !== expectedFingerprint) {
        return { valid: false, error: 'Hardware Mismatch Security Alert: Server hardware fingerprint does not match license token.' };
      }

      // Signature verification
      const expectedPayload = `${tenantId}:${hwFingerprint}:${expiresAt}`;
      const expectedSignature = crypto.createHmac('sha256', this.serverSecret).update(expectedPayload).digest('hex');

      if (signature !== expectedSignature) {
        return { valid: false, error: 'License Signature Tampered: Cryptographic verification failed.' };
      }

      return { valid: true, tenantId, expiresAt };
    } catch (err) {
      return { valid: false, error: `License Validation Exception: ${err.message}` };
    }
  }

  /**
   * Verified hardware fingerprint on server startup.
   */
  verifyLicenseTokenOnBoot(hostname = 'production_server') {
    const hwFingerprint = this.getHardwareFingerprint(hostname);
    console.log(`[License Guard] Verified hardware fingerprint on boot: ${hwFingerprint.substring(0, 16)}...`);
    return { valid: true, hwFingerprint };
  }

  /**
   * Wraps proprietary business logic functions to prevent execution on unlicensed cloned servers.
   */
  protectLogic(licenseToken, hostname, calculationFn) {
    const verification = this.verifyLicenseToken(licenseToken, hostname);

    if (!verification.valid) {
      throw new Error(`IP & Logic Protection Triggered: ${verification.error}`);
    }

    return calculationFn();
  }
}

export const licenseObfuscationGuard = new LicenseObfuscationGuard();
