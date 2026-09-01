/**
 * 🏢 Tenant Provisioning & Isolated Namespace Service
 */

import { SUBSCRIPTION_TIERS, DEFAULT_TENANT_PLAN } from '../config/saasConfig.js';

export class TenantService {
  constructor() {
    this.tenants = new Map();
  }

  createTenant(orgName, planKey = DEFAULT_TENANT_PLAN) {
    const tenantId = `org_${orgName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    const plan = SUBSCRIPTION_TIERS[planKey.toUpperCase()] ? planKey.toUpperCase() : DEFAULT_TENANT_PLAN;

    const tenant = {
      tenantId,
      orgName,
      planKey: plan,
      createdAt: new Date().toISOString(),
      status: 'active',
      namespaceKey: `db_${tenantId}`
    };

    this.tenants.set(tenantId, tenant);
    return tenant;
  }

  getTenant(tenantId) {
    return this.tenants.get(tenantId) || null;
  }

  updateTenantPlan(tenantId, newPlanKey) {
    const tenant = this.getTenant(tenantId);
    if (!tenant) throw new Error(`Tenant '${tenantId}' not found.`);

    if (!SUBSCRIPTION_TIERS[newPlanKey.toUpperCase()]) {
      throw new Error(`Invalid plan key '${newPlanKey}'.`);
    }

    tenant.planKey = newPlanKey.toUpperCase();
    tenant.updatedAt = new Date().toISOString();
    return tenant;
  }
}

export const tenantService = new TenantService();
