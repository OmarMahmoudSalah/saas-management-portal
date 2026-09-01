/**
 * 🛡️ Token-Bucket Multi-Tenant Rate Limiter (Noisy Neighbor Protection)
 */

import { SUBSCRIPTION_TIERS } from '../config/saasConfig.js';

export class TenantRateLimiter {
  constructor() {
    // Map: tenantId -> { tokens: number, lastRefill: number }
    this.buckets = new Map();
  }

  /**
   * Refills and evaluates token bucket for a tenant request.
   */
  evaluateRequest(tenantId, planKey = 'FREE') {
    const plan = SUBSCRIPTION_TIERS[planKey.toUpperCase()] || SUBSCRIPTION_TIERS.FREE;
    // Rate limit capacity: Free = 60/min, Growth = 300/min, Enterprise = 1000/min
    const maxCapacity = planKey === 'ENTERPRISE' ? 1000 : planKey === 'GROWTH' ? 300 : 60;
    const refillRatePerSec = maxCapacity / 60;

    const now = Date.now();
    let bucket = this.buckets.get(tenantId);

    if (!bucket) {
      bucket = { tokens: maxCapacity, lastRefill: now };
      this.buckets.set(tenantId, bucket);
    } else {
      // Calculate elapsed time and refill tokens
      const elapsedSec = (now - bucket.lastRefill) / 1000;
      const refilledTokens = Math.min(maxCapacity, bucket.tokens + (elapsedSec * refillRatePerSec));
      bucket.tokens = refilledTokens;
      bucket.lastRefill = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { allowed: true, remainingTokens: Math.floor(bucket.tokens), maxCapacity };
    }

    return { allowed: false, remainingTokens: 0, maxCapacity, retryAfterSec: 5 };
  }

  /**
   * Express middleware for tenant rate limiting.
   */
  middleware() {
    return (req, res, next) => {
      const tenantId = req.tenantId || 'tenant_default';
      const planKey = req.tenantPlan || 'FREE';

      const result = this.evaluateRequest(tenantId, planKey);

      res.setHeader('X-RateLimit-Limit', result.maxCapacity);
      res.setHeader('X-RateLimit-Remaining', result.remainingTokens);

      if (!result.allowed) {
        res.setHeader('Retry-After', result.retryAfterSec);
        return res.status(429).json({
          error: `Too Many Requests: Rate limit exceeded for tenant '${tenantId}'. Please retry in ${result.retryAfterSec} seconds.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfterSec: result.retryAfterSec
        });
      }

      next();
    };
  }
}

export const tenantRateLimiter = new TenantRateLimiter();
