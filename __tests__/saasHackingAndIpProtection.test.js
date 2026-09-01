import { describe, it, expect } from 'vitest';
import { tenantDataEncryptionService } from '../security/tenantDataEncryptionService';
import { licenseObfuscationGuard } from '../security/licenseObfuscationGuard';
import { tenantHeaderTamperGuard } from '../security/tenantHeaderTamperGuard';

describe('SaaS Hacking & IP Data Protection Test Suite', () => {
  it('encrypts and decrypts tenant data using per-tenant AES-256-GCM keys', () => {
    const originalData = { shippingMark: 'ELFAUMY', totalCbm: 12.5, secretNote: 'Confidential cargo' };
    
    // Encrypt for org_acme
    const payload = tenantDataEncryptionService.encryptTenantData('org_acme', originalData);
    expect(payload.encrypted).toBeDefined();
    expect(payload.iv).toBeDefined();
    expect(payload.authTag).toBeDefined();
    expect(payload.encrypted).not.toContain('ELFAUMY'); // Ciphertext obfuscated

    // Decrypt with correct tenant key
    const decrypted = tenantDataEncryptionService.decryptTenantData('org_acme', payload);
    expect(decrypted.shippingMark).toBe('ELFAUMY');
    expect(decrypted.totalCbm).toBe(12.5);

    // Decrypting with WRONG tenant key throws authentication error
    expect(() => {
      tenantDataEncryptionService.decryptTenantData('org_hacker', payload);
    }).toThrow();
  });

  it('generates and validates signed hardware license tokens', () => {
    const token = licenseObfuscationGuard.generateSignedLicenseToken('org_acme', 'prod_server_1', 365);
    expect(token).toContain('wh_lic_v1_');

    // Valid on correct hardware
    const verification = licenseObfuscationGuard.verifyLicenseToken(token, 'prod_server_1');
    expect(verification.valid).toBe(true);
    expect(verification.tenantId).toBe('org_acme');

    // Fails on unauthorized cloned server (hardware mismatch)
    const clonedVerification = licenseObfuscationGuard.verifyLicenseToken(token, 'hacker_cloned_server');
    expect(clonedVerification.valid).toBe(false);
    expect(clonedVerification.error).toContain('Hardware Mismatch Security Alert');
  });

  it('protects proprietary logic from running on unlicensed server clones', () => {
    const validToken = licenseObfuscationGuard.generateSignedLicenseToken('org_acme', 'authorized_hw', 365);

    // Protected calculation function executes cleanly on authorized server
    const result = licenseObfuscationGuard.protectLogic(validToken, 'authorized_hw', () => {
      return 149 * 12;
    });
    expect(result).toBe(1788);

    // Throws exception if run on unlicensed cloned server
    expect(() => {
      licenseObfuscationGuard.protectLogic(validToken, 'illegal_cloned_hw', () => {
        return 149 * 12;
      });
    }).toThrow(/IP & Logic Protection Triggered/);
  });

  it('signs tenant headers and blocks HTTP header tampering', () => {
    const sig = tenantHeaderTamperGuard.signTenantHeader('org_acme');
    expect(sig).toContain('t=');
    expect(sig).toContain('sig=');

    const middleware = tenantHeaderTamperGuard.middleware();
    
    // Tampered header signature triggers 403
    const nowSec = Math.floor(Date.now() / 1000);
    const reqTampered = {
      headers: {
        'x-tenant-id': 'org_acme',
        'x-tenant-signature': `t=${nowSec},sig=fake_tampered_signature_999`
      }
    };
    const res = {
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(payload) {
        this.body = payload;
        return this;
      }
    };

    let nextCalled = false;
    middleware(reqTampered, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('HEADER_TAMPERED');
  });
});
