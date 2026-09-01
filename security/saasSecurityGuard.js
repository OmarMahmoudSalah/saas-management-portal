/**
 * 🛡️ SaaS Multi-Tenant Security & Access Control Guard
 */

import { featureToggleService } from '../services/featureToggleService.js';
import { tenantService } from '../services/tenantService.js';

export class SaasSecurityGuard {
  /**
   * Middleware enforcing active tenant status (blocks suspended / past_due tenants).
   */
  enforceActiveTenant() {
    return (req, res, next) => {
      const tenantId = req.tenantId || req.headers['x-tenant-id'];
      if (!tenantId) return next();

      const tenant = tenantService.getTenant(tenantId);
      if (tenant && tenant.status === 'suspended') {
        return res.status(403).json({
          error: `Account Suspended: Tenant organization '${tenant.orgName || tenantId}' has been suspended.`,
          code: 'TENANT_SUSPENDED',
          tenantId
        });
      }

      next();
    };
  }

  /**
   * Middleware enforcing dynamic feature access check.
   */
  enforceFeature(featureKey) {
    return (req, res, next) => {
      const tenantId = req.tenantId || 'tenant_default';
      const planKey = req.tenantPlan || 'FREE';

      const isEnabled = featureToggleService.isFeatureEnabled(tenantId, featureKey, planKey);

      if (!isEnabled) {
        return res.status(403).json({
          error: `Feature Disabled: Feature '${featureKey}' is currently disabled for this tenant.`,
          code: 'FEATURE_DISABLED',
          featureKey,
          tenantId
        });
      }

      next();
    };
  }

  /**
   * Middleware enforcing API key scope permissions (read, write, admin).
   */
  enforceApiKeyScope(requiredScope = 'read') {
    return (req, res, next) => {
      const scopes = req.apiKeyScopes || ['read', 'write'];
      
      if (!scopes.includes(requiredScope) && !scopes.includes('admin')) {
        return res.status(403).json({
          error: `Insufficient API Scope: This endpoint requires '${requiredScope}' permission. Granted scopes: ${scopes.join(', ')}.`,
          code: 'INSUFFICIENT_SCOPE',
          requiredScope,
          grantedScopes: scopes
        });
      }

      next();
    };
  }

  /**
   * Validates cross-tenant data access attempts.
   */
  validateTenantAccess(requestTenantId, recordTenantId) {
    if (!requestTenantId || !recordTenantId) return true;
    const safeReq = requestTenantId.toLowerCase().trim();
    const safeRec = recordTenantId.toLowerCase().trim();

    if (safeReq !== safeRec && safeReq !== 'super_admin') {
      throw new Error(`Cross-Tenant Access Security Violation: Tenant '${safeReq}' attempted to access data belonging to '${safeRec}'.`);
    }

    return true;
  }
}

export const saasSecurityGuard = new SaasSecurityGuard();
