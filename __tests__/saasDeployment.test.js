import { describe, it, expect } from 'vitest';
import { provisionTenantCli } from '../deployment/provisionTenant';

describe('SaaS Automated Deployment Test Suite', () => {
  it('provisions new SaaS tenant via CLI helper function', () => {
    const result = provisionTenantCli({
      name: 'Delta Express Cargo',
      plan: 'GROWTH',
      email: 'delta@logistics.com',
      domain: 'logistics.deltaexpress.com'
    });

    expect(result.success).toBe(true);
    expect(result.tenantId).toBe('org_delta_express_cargo');
    expect(result.planKey).toBe('GROWTH');
    expect(result.registeredDomain.domain).toBe('logistics.deltaexpress.com');
    expect(result.licenseToken).toContain('wh_lic_v1_');
    expect(result.apiKey).toContain('wh_live_');
  });
});
