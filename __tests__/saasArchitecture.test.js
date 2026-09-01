import { describe, it, expect } from 'vitest';
import { tenantHealthService } from '../services/tenantHealthService';
import { tenantBackupService } from '../services/tenantBackupService';
import { tenantRateLimiter } from '../security/tenantRateLimiter';
import * as saasFacade from '../index';

describe('SaaS Advanced Architecture Test Suite', () => {
  it('computes tenant health score and quota utilization %', () => {
    const health = tenantHealthService.getTenantHealthMetrics('tenant_demo', {
      cartonsCount: 450,
      storageCbm: 40,
      activeUsers: 2
    });

    expect(health.healthStatus).toBe('warning_quota');
    expect(health.healthScore).toBe(75);
    expect(health.usage.cartonUsagePct).toBe(90);
  });

  it('creates and restores isolated tenant data snapshots', () => {
    const records = [
      { id: 'tenant_org_acme:carton_1', data: 'item1' },
      { id: 'tenant_org_acme:carton_2', data: 'item2' },
      { id: 'tenant_org_other:carton_3', data: 'other' }
    ];

    const snapshot = tenantBackupService.createTenantSnapshot('org_acme', records);
    expect(snapshot.recordCount).toBe(2);
    expect(snapshot.records[0].unscopedId).toBe('carton_1');

    const restored = tenantBackupService.restoreTenantSnapshot('org_new_acme', snapshot);
    expect(restored.importedCount).toBe(2);
    expect(restored.records[0].id).toBe('tenant_org_new_acme:carton_1');
  });

  it('enforces token-bucket rate limiting per tenant', () => {
    // Free plan allows up to 60 requests/min
    for (let i = 0; i < 60; i++) {
      const res = tenantRateLimiter.evaluateRequest('org_spam', 'FREE');
      expect(res.allowed).toBe(true);
    }

    // 61st request triggers rate limit
    const blockedRes = tenantRateLimiter.evaluateRequest('org_spam', 'FREE');
    expect(blockedRes.allowed).toBe(false);
    expect(blockedRes.remainingTokens).toBe(0);
  });

  it('exports complete facade in saas/index.js', () => {
    expect(saasFacade.tenantHealthService).toBeDefined();
    expect(saasFacade.tenantBackupService).toBeDefined();
    expect(saasFacade.tenantRateLimiter).toBeDefined();
    expect(saasFacade.SUBSCRIPTION_TIERS).toBeDefined();
  });
});
