/**
 * 🏢 Resource Usage & Quota Enforcement Middleware
 * Verifies tenant resource counts against plan limits before processing mutations.
 */

import { SUBSCRIPTION_TIERS } from '../config/saasConfig.js';

export function enforceQuota(resourceType, getUsageFn) {
  return async (req, res, next) => {
    try {
      const planId = (req.tenantPlan || 'FREE').toUpperCase();
      const plan = SUBSCRIPTION_TIERS[planId] || SUBSCRIPTION_TIERS.FREE;

      let limit = Infinity;
      if (resourceType === 'cartons') limit = plan.maxCartons;
      if (resourceType === 'containers') limit = plan.maxContainers;
      if (resourceType === 'users') limit = plan.maxUsers;
      if (resourceType === 'storageCbm') limit = plan.maxStorageCbm;

      if (limit === Infinity) return next();

      const currentUsage = typeof getUsageFn === 'function' ? await getUsageFn(req.tenantId) : 0;

      if (currentUsage >= limit) {
        return res.status(402).json({
          error: `SaaS Quota Exceeded: Your ${plan.name} plan permits up to ${limit} ${resourceType}. Current usage: ${currentUsage}.`,
          quotaExceeded: true,
          resourceType,
          limit,
          currentUsage,
          upgradeRequired: true
        });
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
