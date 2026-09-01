import { describe, it, expect } from 'vitest';
import { SUBSCRIPTION_TIERS } from '../config/saasConfig';
import { resolveTenantContext } from '../middleware/tenantContext';
import { enforceQuota } from '../middleware/usageMeter';
import { enforceFeature } from '../middleware/featureGuard';
import { tenantService } from '../services/tenantService';
import { tenantIsolationService } from '../services/tenantIsolationService';
import { domainMappingService } from '../services/domainMappingService';
import { billingProviderService } from '../services/billingProviderService';

describe('SaaS Multi-Tenant Modules Test Suite', () => {
  it('correctly exports subscription tiers and quotas', () => {
    expect(SUBSCRIPTION_TIERS).toHaveProperty('FREE');
    expect(SUBSCRIPTION_TIERS).toHaveProperty('GROWTH');
    expect(SUBSCRIPTION_TIERS).toHaveProperty('ENTERPRISE');
    expect(SUBSCRIPTION_TIERS.FREE.maxCartons).toBe(500);
    expect(SUBSCRIPTION_TIERS.ENTERPRISE.maxCartons).toBe(Infinity);
  });

  it('resolves tenant context from headers or defaults', () => {
    const middleware = resolveTenantContext({ headerName: 'x-tenant-id', defaultTenant: 'tenant_main' });
    
    const req1 = { headers: { 'x-tenant-id': 'ORG_ALPHA' } };
    const res1 = {};
    let nextCalled1 = false;
    middleware(req1, res1, () => { nextCalled1 = true; });

    expect(nextCalled1).toBe(true);
    expect(req1.tenantId).toBe('org_alpha');

    const req2 = { headers: {} };
    let nextCalled2 = false;
    middleware(req2, res1, () => { nextCalled2 = true; });

    expect(nextCalled2).toBe(true);
    expect(req2.tenantId).toBe('tenant_main');
  });

  it('enforces resource quotas correctly', async () => {
    const getUsageMock = async () => 600;
    const middleware = enforceQuota('cartons', getUsageMock);

    const req = { tenantId: 'org_test', tenantPlan: 'FREE' };
    const res = {
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (payload) {
        this.body = payload;
        return this;
      }
    };

    let nextCalled = false;
    await middleware(req, res, () => { nextCalled = true; });

    expect(nextCalled).toBe(false);
    expect(res.statusCode).toBe(402);
    expect(res.body.quotaExceeded).toBe(true);
  });

  it('enforces feature flag access correctly', () => {
    const middleware = enforceFeature('supplierAnalytics');

    const reqFree = { tenantPlan: 'FREE' };
    const resFree = {
      status: function (code) {
        this.statusCode = code;
        return this;
      },
      json: function (payload) {
        this.body = payload;
        return this;
      }
    };

    let nextFree = false;
    middleware(reqFree, resFree, () => { nextFree = true; });

    expect(nextFree).toBe(false);
    expect(resFree.statusCode).toBe(403);

    const reqGrowth = { tenantPlan: 'GROWTH' };
    let nextGrowth = false;
    middleware(reqGrowth, {}, () => { nextGrowth = true; });

    expect(nextGrowth).toBe(true);
  });

  it('provisions and manages tenants in TenantService', () => {
    const tenant = tenantService.createTenant('Acme Cargo', 'GROWTH');
    expect(tenant.tenantId).toBe('org_acme_cargo');
    expect(tenant.planKey).toBe('GROWTH');

    const fetched = tenantService.getTenant('org_acme_cargo');
    expect(fetched).not.toBeNull();

    const updated = tenantService.updateTenantPlan('org_acme_cargo', 'ENTERPRISE');
    expect(updated.planKey).toBe('ENTERPRISE');
  });

  it('provides tenant database key isolation & query scoping', () => {
    const key = tenantIsolationService.getTenantScopedKey('org_acme', 'carton_101');
    expect(key).toBe('tenant_org_acme:carton_101');

    const original = tenantIsolationService.extractOriginalKey(key);
    expect(original).toBe('carton_101');

    const { sqlQuery, params } = tenantIsolationService.applyTenantSqlFilter(
      'SELECT * FROM records WHERE type = ?',
      ['carton'],
      'org_acme'
    );
    expect(sqlQuery).toContain('LIKE $2');
    expect(params[1]).toBe('tenant_org_acme:%');
  });

  it('registers custom domains and resolves subdomains', () => {
    domainMappingService.registerCustomDomain('logistics.acmecargo.com', 'org_acme');
    
    const resolvedDomain = domainMappingService.resolveTenantFromHost('logistics.acmecargo.com');
    expect(resolvedDomain).toBe('org_acme');

    const resolvedSubdomain = domainMappingService.resolveTenantFromHost('cairo.warehouseapp.com');
    expect(resolvedSubdomain).toBe('org_cairo');
  });

  it('processes subscription payment webhooks and calculates MRR metrics', () => {
    tenantService.createTenant('Delta Freight', 'FREE');

    const tx = billingProviderService.processSubscriptionWebhook({
      type: 'invoice.payment_succeeded',
      tenantId: 'org_delta_freight',
      planKey: 'GROWTH',
      amountUsd: 149
    });

    expect(tx.status).toBe('success');
    expect(tenantService.getTenant('org_delta_freight').planKey).toBe('GROWTH');

    const metrics = billingProviderService.calculateMetrics([
      { tenantId: 'org_1', planKey: 'GROWTH', status: 'active' },
      { tenantId: 'org_2', planKey: 'ENTERPRISE', status: 'active' }
    ]);

    expect(metrics.mrrUsd).toBe(149 + 499);
    expect(metrics.arrUsd).toBe((149 + 499) * 12);
  });
});
