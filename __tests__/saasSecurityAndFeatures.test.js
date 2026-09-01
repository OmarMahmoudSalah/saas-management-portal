import { describe, it, expect } from 'vitest';
import { featureToggleService } from '../services/featureToggleService';
import { saasSecurityGuard } from '../security/saasSecurityGuard';
import { tenantService } from '../services/tenantService';

describe('SaaS Security & Feature Toggles Test Suite', () => {
  it('respects subscription plan tier defaults for features', () => {
    const isFreeAnalytics = featureToggleService.isFeatureEnabled('org_free', 'supplierAnalytics', 'FREE');
    expect(isFreeAnalytics).toBe(false);

    const isGrowthAnalytics = featureToggleService.isFeatureEnabled('org_growth', 'supplierAnalytics', 'GROWTH');
    expect(isGrowthAnalytics).toBe(true);
  });

  it('allows tenant-specific feature overrides', () => {
    // Enable supplierAnalytics for a FREE tier tenant specifically
    featureToggleService.setTenantFeatureOverride('org_special_free', 'supplierAnalytics', true, 'admin');

    const isEnabled = featureToggleService.isFeatureEnabled('org_special_free', 'supplierAnalytics', 'FREE');
    expect(isEnabled).toBe(true);
  });

  it('enforces global kill-switches over all tenant overrides and plan tiers', () => {
    featureToggleService.setTenantFeatureOverride('org_vip', 'godMode', true, 'admin');
    
    // Kill godMode globally across the entire platform
    featureToggleService.setGlobalKillSwitch('godMode', false, 'super_admin');

    const isVipGodMode = featureToggleService.isFeatureEnabled('org_vip', 'godMode', 'ENTERPRISE');
    expect(isVipGodMode).toBe(false);

    // Re-enable global kill-switch
    featureToggleService.setGlobalKillSwitch('godMode', true, 'super_admin');
    const isVipGodModeRestored = featureToggleService.isFeatureEnabled('org_vip', 'godMode', 'ENTERPRISE');
    expect(isVipGodModeRestored).toBe(true);
  });

  it('blocks suspended tenants in saasSecurityGuard', () => {
    const tenant = tenantService.createTenant('Suspended Cargo', 'GROWTH');
    tenantService.getTenant(tenant.tenantId).status = 'suspended';

    const middleware = saasSecurityGuard.enforceActiveTenant();
    const req = { tenantId: tenant.tenantId, headers: {} };
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
    middleware(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(403);
    expect(res.body.code).toBe('TENANT_SUSPENDED');
  });

  it('prevents cross-tenant security data violations', () => {
    expect(() => {
      saasSecurityGuard.validateTenantAccess('org_alpha', 'org_beta');
    }).toThrow(/Cross-Tenant Access Security Violation/);

    expect(saasSecurityGuard.validateTenantAccess('org_alpha', 'org_alpha')).toBe(true);
    expect(saasSecurityGuard.validateTenantAccess('super_admin', 'org_beta')).toBe(true);
  });

  it('enforces API key scope permissions', () => {
    const middleware = saasSecurityGuard.enforceApiKeyScope('write');

    const reqReadOnly = { apiKeyScopes: ['read'] };
    const resReadOnly = {
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
    middleware(reqReadOnly, resReadOnly, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(resReadOnly.statusCode).toBe(403);
    expect(resReadOnly.body.code).toBe('INSUFFICIENT_SCOPE');
  });
});
