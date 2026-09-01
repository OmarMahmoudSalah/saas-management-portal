/**
 * 🏢 Multi-Tenant Storage Analytics & Health Monitoring Service
 */

import { SUBSCRIPTION_TIERS } from '../config/saasConfig.js';
import { tenantService } from './tenantService.js';

export class TenantHealthService {
  /**
   * Computes health score and resource consumption metrics for a tenant.
   */
  getTenantHealthMetrics(tenantId, currentUsage = {}) {
    const tenant = tenantService.getTenant(tenantId);
    const planKey = tenant ? tenant.planKey : 'FREE';
    const plan = SUBSCRIPTION_TIERS[planKey] || SUBSCRIPTION_TIERS.FREE;

    const cartonsCount = currentUsage.cartonsCount || 0;
    const containersCount = currentUsage.containersCount || 0;
    const storageCbm = currentUsage.storageCbm || 0;
    const activeUsers = currentUsage.activeUsers || 1;

    // Quota utilization percentages
    const cartonUsagePct = plan.maxCartons === Infinity ? 0 : Math.round((cartonsCount / plan.maxCartons) * 100);
    const storageUsagePct = plan.maxStorageCbm === Infinity ? 0 : Math.round((storageCbm / plan.maxStorageCbm) * 100);
    const usersUsagePct = plan.maxUsers === Infinity ? 0 : Math.round((activeUsers / plan.maxUsers) * 100);

    // Compute synthetic health score (0 to 100)
    let healthStatus = 'healthy';
    let healthScore = 100;

    if (cartonUsagePct >= 95 || storageUsagePct >= 95) {
      healthStatus = 'critical_quota';
      healthScore = 40;
    } else if (cartonUsagePct >= 80 || storageUsagePct >= 80) {
      healthStatus = 'warning_quota';
      healthScore = 75;
    }

    if (tenant && tenant.status === 'suspended') {
      healthStatus = 'suspended';
      healthScore = 0;
    }

    return {
      tenantId,
      orgName: tenant ? tenant.orgName : 'Default Tenant',
      planKey,
      healthStatus,
      healthScore,
      usage: {
        cartonsCount,
        maxCartons: plan.maxCartons,
        cartonUsagePct,
        storageCbm,
        maxStorageCbm: plan.maxStorageCbm,
        storageUsagePct,
        activeUsers,
        maxUsers: plan.maxUsers,
        usersUsagePct
      },
      evaluatedAt: new Date().toISOString()
    };
  }
}

export const tenantHealthService = new TenantHealthService();
