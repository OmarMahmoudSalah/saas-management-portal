/**
 * 🏢 SaaS Payment Gateway & Subscription Billing Service (Stripe / Webhook Handler)
 */

import { SUBSCRIPTION_TIERS } from '../config/saasConfig.js';
import { tenantService } from './tenantService.js';

export const TIER_PRICING = {
  FREE: { monthlyUsd: 0, annualUsd: 0 },
  GROWTH: { monthlyUsd: 149, annualUsd: 1490 },
  ENTERPRISE: { monthlyUsd: 499, annualUsd: 4990 }
};

export class BillingProviderService {
  constructor() {
    this.transactions = [];
  }

  processSubscriptionWebhook(event) {
    const { type, tenantId, planKey, paymentMethod, amountUsd } = event;

    if (!tenantId) throw new Error('Webhook missing tenantId parameter.');

    const tenant = tenantService.getTenant(tenantId);
    if (!tenant && type !== 'tenant.created') {
      throw new Error(`Tenant '${tenantId}' not found for billing event.`);
    }

    let status = 'success';
    let message = '';

    switch (type) {
      case 'invoice.payment_succeeded':
        tenantService.updateTenantPlan(tenantId, planKey || 'GROWTH');
        message = `Payment of $${amountUsd} succeeded. Plan updated to ${planKey}.`;
        break;

      case 'invoice.payment_failed':
        status = 'past_due';
        message = `Payment failed for tenant '${tenantId}'. Status set to past_due.`;
        break;

      case 'customer.subscription.deleted':
        tenantService.updateTenantPlan(tenantId, 'FREE');
        message = `Subscription canceled. Downgraded tenant '${tenantId}' to FREE plan.`;
        break;

      default:
        message = `Unhandled event type '${type}'.`;
    }

    const record = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      tenantId,
      amountUsd: amountUsd || 0,
      paymentMethod: paymentMethod || 'credit_card',
      status,
      timestamp: new Date().toISOString(),
      message
    };

    this.transactions.push(record);
    return record;
  }

  calculateMetrics(allTenants = []) {
    let mrr = 0;
    let totalActive = 0;

    allTenants.forEach(t => {
      const tier = TIER_PRICING[t.planKey] || TIER_PRICING.FREE;
      mrr += tier.monthlyUsd;
      if (t.status === 'active') totalActive++;
    });

    return {
      mrrUsd: mrr,
      arrUsd: mrr * 12,
      activeTenantsCount: totalActive,
      avgRevenuePerTenant: totalActive > 0 ? (mrr / totalActive).toFixed(2) : 0
    };
  }
}

export const billingProviderService = new BillingProviderService();
