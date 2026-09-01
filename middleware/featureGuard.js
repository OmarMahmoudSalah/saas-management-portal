/**
 * 🏢 Feature Flag Access Guard Middleware
 * Verifies if tenant plan includes access to requested feature.
 */

import { SUBSCRIPTION_TIERS } from '../config/saasConfig.js';

export function enforceFeature(featureKey) {
  return (req, res, next) => {
    const planId = (req.tenantPlan || 'FREE').toUpperCase();
    const plan = SUBSCRIPTION_TIERS[planId] || SUBSCRIPTION_TIERS.FREE;

    const hasAccess = plan.features && plan.features[featureKey] === true;

    if (!hasAccess) {
      return res.status(403).json({
        error: `Feature Restricted: Feature '${featureKey}' is not available on the ${plan.name} plan.`,
        featureKey,
        currentPlan: plan.name,
        upgradeRequired: true
      });
    }

    next();
  };
}
