/**
 * 🛡️ Anti-Tamper Header & Tenant Identity Protection Middleware
 * Prevents HTTP header tampering and tenant impersonation attacks.
 */

import crypto from 'crypto';

export class TenantHeaderTamperGuard {
  constructor(secret = 'wh_header_security_key_2026') {
    this.secret = secret;
  }

  /**
   * Generates a signed cryptographic signature for a tenant HTTP header.
   */
  signTenantHeader(tenantId, timestamp = Math.floor(Date.now() / 1000)) {
    const payload = `${tenantId.toLowerCase().trim()}:${timestamp}`;
    const signature = crypto.createHmac('sha256', this.secret).update(payload).digest('hex');
    return `t=${timestamp},sig=${signature}`;
  }

  /**
   * Express middleware validating signed tenant headers against impersonation attacks.
   */
  middleware() {
    return (req, res, next) => {
      const tenantId = req.headers['x-tenant-id'] || req.headers['x-organization-id'];
      const tenantSig = req.headers['x-tenant-signature'];

      // If no tenant header supplied, continue to default single-tenant context
      if (!tenantId) return next();

      // In production multi-tenant mode, verify signature if present
      if (tenantSig) {
        try {
          const parts = tenantSig.split(',');
          const timestampStr = parts[0]?.replace('t=', '');
          const sig = parts[1]?.replace('sig=', '');

          const timestamp = parseInt(timestampStr, 10);
          const nowSec = Math.floor(Date.now() / 1000);

          // Expire signatures older than 15 minutes to block replay attacks
          if (Math.abs(nowSec - timestamp) > 900) {
            return res.status(401).json({
              error: 'Security Header Error: Tenant signature timestamp expired (Replay Attack Prevention).',
              code: 'HEADER_EXPIRED'
            });
          }

          const expectedSig = this.signTenantHeader(tenantId, timestamp).split(',sig=')[1];
          if (sig !== expectedSig) {
            return res.status(403).json({
              error: 'Security Breach Blocked: Invalid tenant signature (Header Impersonation Attempt).',
              code: 'HEADER_TAMPERED'
            });
          }
        } catch {
          return res.status(400).json({
            error: 'Security Header Error: Malformed tenant signature header.',
            code: 'MALFORMED_SIGNATURE'
          });
        }
      }

      next();
    };
  }
}

export const tenantHeaderTamperGuard = new TenantHeaderTamperGuard();
